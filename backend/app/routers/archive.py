"""Archive router."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.models.archive import ArchiveSeason, ArchiveMedia, MediaType
from app.models.user import User
from app.schemas.archive import (
    ArchiveSeasonCreate, ArchiveSeasonUpdate, ArchiveSeasonResponse,
    ArchiveMediaCreate, ArchiveMediaResponse
)
from app.dependencies import get_current_admin

router = APIRouter(prefix="/archive", tags=["Archive"])


# Public endpoints

@router.get("/", response_model=List[ArchiveSeasonResponse])
async def list_archive_seasons(db: AsyncSession = Depends(get_db)):
    """List all archive seasons."""
    query = select(ArchiveSeason).options(
        selectinload(ArchiveSeason.media)
    ).order_by(ArchiveSeason.year.desc())
    
    result = await db.execute(query)
    return result.scalars().unique().all()


@router.get("/{year}", response_model=ArchiveSeasonResponse)
async def get_archive_season(year: int, db: AsyncSession = Depends(get_db)):
    """Get archive season by year."""
    query = select(ArchiveSeason).options(
        selectinload(ArchiveSeason.media)
    ).where(ArchiveSeason.year == year)
    
    result = await db.execute(query)
    season = result.scalar_one_or_none()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Архивный сезон не найден"
        )
    
    return season


# Admin endpoints

@router.post("/", response_model=ArchiveSeasonResponse, status_code=status.HTTP_201_CREATED)
async def create_archive_season(
    season_data: ArchiveSeasonCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create archive season (admin only)."""
    # Check if year already exists
    result = await db.execute(select(ArchiveSeason).where(ArchiveSeason.year == season_data.year))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Архив для этого года уже существует"
        )
    
    season = ArchiveSeason(**season_data.model_dump())
    db.add(season)
    await db.commit()
    await db.refresh(season)
    
    return season


@router.patch("/{season_id}", response_model=ArchiveSeasonResponse)
async def update_archive_season(
    season_id: int,
    season_data: ArchiveSeasonUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update archive season (admin only)."""
    query = select(ArchiveSeason).options(
        selectinload(ArchiveSeason.media)
    ).where(ArchiveSeason.id == season_id)
    
    result = await db.execute(query)
    season = result.scalar_one_or_none()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Архивный сезон не найден"
        )
    
    update_data = season_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(season, field, value)
    
    await db.commit()
    await db.refresh(season)
    
    return season


@router.delete("/{season_id}")
async def delete_archive_season(
    season_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete archive season (admin only)."""
    result = await db.execute(select(ArchiveSeason).where(ArchiveSeason.id == season_id))
    season = result.scalar_one_or_none()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Архивный сезон не найден"
        )
    
    await db.delete(season)
    await db.commit()
    
    return {"message": "Архивный сезон удален"}


# Media

@router.post("/{season_id}/media", response_model=ArchiveMediaResponse, status_code=status.HTTP_201_CREATED)
async def add_archive_media(
    season_id: int,
    media_data: ArchiveMediaCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Add media to archive season (admin only)."""
    # Check if season exists
    result = await db.execute(select(ArchiveSeason).where(ArchiveSeason.id == season_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Архивный сезон не найден"
        )
    
    media = ArchiveMedia(**media_data.model_dump(), archive_season_id=season_id)
    db.add(media)
    await db.commit()
    await db.refresh(media)
    
    return media


@router.delete("/media/{media_id}")
async def delete_archive_media(
    media_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete archive media (admin only)."""
    result = await db.execute(select(ArchiveMedia).where(ArchiveMedia.id == media_id))
    media = result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Медиафайл не найден"
        )
    
    await db.delete(media)
    await db.commit()
    
    return {"message": "Медиафайл удален"}





