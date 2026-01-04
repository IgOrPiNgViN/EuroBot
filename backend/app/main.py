"""Main FastAPI application."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
from loguru import logger

from app.config import settings
from app.database import init_db, engine
from app.routers import (
    auth_router,
    users_router,
    news_router,
    partners_router,
    teams_router,
    seasons_router,
    archive_router,
    contacts_router,
    settings_router,
    upload_router,
    admin_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting Eurobot API...")
    await init_db()
    await create_initial_data()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Eurobot API...")
    await engine.dispose()


app = FastAPI(
    title="Eurobot Russia API",
    description="API для сайта соревнований Евробот Россия",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
upload_dir = os.path.abspath(settings.UPLOAD_DIR)
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(news_router, prefix="/api")
app.include_router(partners_router, prefix="/api")
app.include_router(teams_router, prefix="/api")
app.include_router(seasons_router, prefix="/api")
app.include_router(archive_router, prefix="/api")
app.include_router(contacts_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Eurobot Russia API", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера"}
    )


async def create_initial_data():
    """Create initial admin user and default settings."""
    from sqlalchemy import select
    from datetime import datetime, date, timedelta
    from app.database import async_session_maker
    from app.models.user import User, UserRole
    from app.models.news import NewsCategory, NewsCategoryType
    from app.models.settings import SiteSettings
    from app.models.competition import Season
    from app.utils.security import get_password_hash
    
    async with async_session_maker() as session:
        # Check if admin exists
        result = await session.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        admin = result.scalar_one_or_none()
        
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                full_name="Главный администратор",
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True
            )
            session.add(admin)
            logger.info(f"Created super admin user: {settings.ADMIN_EMAIL}")
        
        # Create default season if none exists
        result = await session.execute(select(Season).where(Season.is_current == True))
        current_season = result.scalar_one_or_none()
        
        if not current_season:
            current_year = datetime.now().year
            season = Season(
                year=current_year,
                name=f"Евробот {current_year}",
                theme="Farming Mars",
                registration_open=True,
                registration_start=datetime.now(),
                registration_end=datetime.now() + timedelta(days=90),
                competition_date_start=date(current_year, 5, 1),
                competition_date_end=date(current_year, 5, 3),
                location="Москва",
                is_current=True,
                is_archived=False,
                show_dates=True,
                show_location=True,
                show_format=True,
                show_registration_deadline=True
            )
            session.add(season)
            logger.info(f"Created default season: Евробот {current_year}")
        
        # Create default news categories
        categories = [
            {"name": "Объявления", "slug": "announcements", "type": NewsCategoryType.ANNOUNCEMENTS},
            {"name": "Результаты", "slug": "results", "type": NewsCategoryType.RESULTS},
            {"name": "Инструкции", "slug": "instructions", "type": NewsCategoryType.INSTRUCTIONS},
            {"name": "События", "slug": "events", "type": NewsCategoryType.EVENTS},
        ]
        
        for cat_data in categories:
            result = await session.execute(
                select(NewsCategory).where(NewsCategory.slug == cat_data["slug"])
            )
            if not result.scalar_one_or_none():
                category = NewsCategory(**cat_data)
                session.add(category)
        
        # Create default settings
        default_settings = [
            {"key": "site_title", "value": "Евробот Россия", "is_public": True},
            {"key": "site_description", "value": "Международные соревнования по робототехнике", "is_public": True},
            {"key": "about_history", "value": "EUROBOT — это международные соревнования по робототехнике для молодёжи.", "is_public": True},
            {"key": "about_goals", "value": "Развитие инженерного мышления и популяризация робототехники.", "is_public": True},
            {"key": "show_advantages", "value": "true", "is_public": True},
            {"key": "contact_emails", "value_json": {
                "technical": "tech@eurobot.ru",
                "registration": "reg@eurobot.ru",
                "sponsorship": "partners@eurobot.ru",
                "press": "press@eurobot.ru"
            }, "is_public": True},
        ]
        
        for setting_data in default_settings:
            result = await session.execute(
                select(SiteSettings).where(SiteSettings.key == setting_data["key"])
            )
            if not result.scalar_one_or_none():
                setting = SiteSettings(**setting_data)
                session.add(setting)
        
        await session.commit()
        logger.info("Initial data created")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

