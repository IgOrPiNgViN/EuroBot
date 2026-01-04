"""News router."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.news import News, NewsCategory, NewsTag, NewsCategoryType
from app.models.user import User
from app.schemas.news import (
    NewsCreate, NewsUpdate, NewsResponse, NewsListResponse,
    NewsCategoryResponse, NewsTagResponse
)
from app.dependencies import get_current_admin, get_current_user
from app.utils.slug import generate_slug

router = APIRouter(prefix="/news", tags=["News"])


# Public endpoints

@router.get("/", response_model=NewsListResponse)
async def list_news(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """List published news with filtering and pagination."""
    query = select(News).options(
        selectinload(News.category),
        selectinload(News.tags)
    ).where(
        News.is_published == True,
        or_(News.publish_date <= datetime.utcnow(), News.publish_date == None)
    )
    
    # Filters
    if category:
        query = query.join(News.category).where(NewsCategory.slug == category)
    
    if tag:
        query = query.join(News.tags).where(NewsTag.slug == tag)
    
    if search:
        query = query.where(
            or_(
                News.title.ilike(f"%{search}%"),
                News.content.ilike(f"%{search}%")
            )
        )
    
    if featured is not None:
        query = query.where(News.is_featured == featured)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.execute(count_query)
    total_count = total.scalar() or 0
    
    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(News.publish_date.desc(), News.created_at.desc())
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    news_list = result.scalars().unique().all()
    
    return NewsListResponse(
        items=news_list,
        total=total_count,
        page=page,
        pages=(total_count + limit - 1) // limit
    )


@router.get("/featured", response_model=List[NewsResponse])
async def get_featured_news(
    limit: int = Query(5, ge=1, le=10),
    db: AsyncSession = Depends(get_db)
):
    """Get featured news for homepage."""
    query = select(News).options(
        selectinload(News.category),
        selectinload(News.tags)
    ).where(
        News.is_published == True,
        News.is_featured == True,
        or_(News.publish_date <= datetime.utcnow(), News.publish_date == None)
    ).order_by(News.publish_date.desc()).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().unique().all()


@router.get("/categories", response_model=List[NewsCategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List all news categories."""
    result = await db.execute(select(NewsCategory))
    return result.scalars().all()


@router.get("/tags", response_model=List[NewsTagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)):
    """List all news tags."""
    result = await db.execute(select(NewsTag))
    return result.scalars().all()


@router.get("/{slug}", response_model=NewsResponse)
async def get_news_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get news article by slug."""
    query = select(News).options(
        selectinload(News.category),
        selectinload(News.tags)
    ).where(News.slug == slug)
    
    result = await db.execute(query)
    news = result.scalar_one_or_none()
    
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Новость не найдена"
        )
    
    # Check if published (unless admin)
    if not news.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Новость не найдена"
        )
    
    # Increment views
    news.views_count += 1
    await db.commit()
    
    # Re-fetch with relationships loaded
    result = await db.execute(
        select(News).options(
            selectinload(News.category),
            selectinload(News.tags)
        ).where(News.slug == slug)
    )
    news = result.scalar_one()
    
    return news


# Admin endpoints

@router.post("/", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
async def create_news(
    news_data: NewsCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create news article (admin only)."""
    # Generate slug
    slug = generate_slug(news_data.title)
    
    # Check if slug exists
    result = await db.execute(select(News).where(News.slug == slug))
    if result.scalar_one_or_none():
        slug = f"{slug}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    # Get tags
    tags = []
    if news_data.tag_ids:
        result = await db.execute(select(NewsTag).where(NewsTag.id.in_(news_data.tag_ids)))
        tags = result.scalars().all()
    
    # Create news
    news = News(
        title=news_data.title,
        slug=slug,
        excerpt=news_data.excerpt,
        content=news_data.content,
        featured_image=news_data.featured_image,
        video_url=news_data.video_url,
        gallery=news_data.gallery,
        category_id=news_data.category_id,
        is_published=news_data.is_published,
        is_featured=news_data.is_featured,
        publish_date=news_data.publish_date or datetime.utcnow(),
        meta_title=news_data.meta_title,
        meta_description=news_data.meta_description,
        author_id=admin.id,
        tags=tags
    )
    
    db.add(news)
    await db.commit()
    
    # Re-fetch with relationships loaded
    result = await db.execute(
        select(News).options(
            selectinload(News.category),
            selectinload(News.tags)
        ).where(News.id == news.id)
    )
    news = result.scalar_one()
    
    return news


@router.patch("/{news_id}", response_model=NewsResponse)
async def update_news(
    news_id: int,
    news_data: NewsUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update news article (admin only)."""
    query = select(News).options(
        selectinload(News.category),
        selectinload(News.tags)
    ).where(News.id == news_id)
    
    result = await db.execute(query)
    news = result.scalar_one_or_none()
    
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Новость не найдена"
        )
    
    # Update fields
    update_data = news_data.model_dump(exclude_unset=True)
    
    # Handle tags separately
    if "tag_ids" in update_data:
        tag_ids = update_data.pop("tag_ids")
        if tag_ids is not None:
            result = await db.execute(select(NewsTag).where(NewsTag.id.in_(tag_ids)))
            news.tags = result.scalars().all()
    
    # Update title -> regenerate slug
    if "title" in update_data and update_data["title"] != news.title:
        news.slug = generate_slug(update_data["title"])
    
    for field, value in update_data.items():
        setattr(news, field, value)
    
    await db.commit()
    
    # Re-fetch with relationships loaded
    result = await db.execute(
        select(News).options(
            selectinload(News.category),
            selectinload(News.tags)
        ).where(News.id == news_id)
    )
    news = result.scalar_one()
    
    return news


@router.delete("/{news_id}")
async def delete_news(
    news_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete news article (admin only)."""
    result = await db.execute(select(News).where(News.id == news_id))
    news = result.scalar_one_or_none()
    
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Новость не найдена"
        )
    
    await db.delete(news)
    await db.commit()
    
    return {"message": "Новость удалена"}

