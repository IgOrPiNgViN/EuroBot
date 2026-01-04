"""API routers."""
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.news import router as news_router
from app.routers.partners import router as partners_router
from app.routers.teams import router as teams_router
from app.routers.seasons import router as seasons_router
from app.routers.archive import router as archive_router
from app.routers.contacts import router as contacts_router
from app.routers.settings import router as settings_router
from app.routers.upload import router as upload_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "users_router",
    "news_router",
    "partners_router",
    "teams_router",
    "seasons_router",
    "archive_router",
    "contacts_router",
    "settings_router",
    "upload_router",
    "admin_router"
]



