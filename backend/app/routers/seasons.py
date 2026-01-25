"""Seasons and competitions router."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.database import get_db
from app.models.competition import Season, Competition, RegistrationField
from app.models.team import Team
from app.models.archive import ArchiveSeason
from app.models.user import User
from app.schemas.competition import (
    SeasonCreate, SeasonUpdate, SeasonResponse,
    CompetitionCreate, CompetitionUpdate, CompetitionResponse,
    RegistrationFieldCreate, RegistrationFieldUpdate, RegistrationFieldResponse
)
from app.schemas.archive import FinalizeSeasonData, ArchiveSeasonResponse
from app.dependencies import get_current_admin

router = APIRouter(prefix="/seasons", tags=["Seasons"])


# Public endpoints

@router.get("", response_model=List[SeasonResponse])
@router.get("/", response_model=List[SeasonResponse])
async def list_seasons(
    current_only: bool = False,
    include_archived: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """List all seasons."""
    query = select(Season).options(
        selectinload(Season.competitions),
        selectinload(Season.registration_fields)
    )
    
    if current_only:
        query = query.where(Season.is_current == True)
    
    if not include_archived:
        query = query.where(Season.is_archived == False)
    
    query = query.order_by(Season.year.desc())
    result = await db.execute(query)
    
    return result.scalars().unique().all()


@router.get("/current", response_model=Optional[SeasonResponse])
async def get_current_season(db: AsyncSession = Depends(get_db)):
    """Get the current active season."""
    query = select(Season).options(
        selectinload(Season.competitions),
        selectinload(Season.registration_fields)
    ).where(Season.is_current == True)
    
    result = await db.execute(query)
    return result.scalar_one_or_none()


@router.get("/{season_id}", response_model=SeasonResponse)
async def get_season(season_id: int, db: AsyncSession = Depends(get_db)):
    """Get season by ID."""
    query = select(Season).options(
        selectinload(Season.competitions),
        selectinload(Season.registration_fields)
    ).where(Season.id == season_id)
    
    result = await db.execute(query)
    season = result.scalar_one_or_none()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сезон не найден"
        )
    
    return season


# Admin endpoints

@router.post("/", response_model=SeasonResponse, status_code=status.HTTP_201_CREATED)
async def create_season(
    season_data: SeasonCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new season (admin only)."""
    # Check if year already exists
    result = await db.execute(select(Season).where(Season.year == season_data.year))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Сезон с таким годом уже существует"
        )
    
    # If marking as current, unmark others
    if season_data.is_current:
        await db.execute(
            Season.__table__.update().values(is_current=False)
        )
    
    season = Season(**season_data.model_dump())
    db.add(season)
    await db.commit()
    
    # Reload with relationships
    query = select(Season).options(
        selectinload(Season.competitions),
        selectinload(Season.registration_fields)
    ).where(Season.id == season.id)
    result = await db.execute(query)
    
    return result.scalar_one()


@router.patch("/{season_id}", response_model=SeasonResponse)
async def update_season(
    season_id: int,
    season_data: SeasonUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update season (admin only)."""
    result = await db.execute(select(Season).where(Season.id == season_id))
    season = result.scalar_one_or_none()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сезон не найден"
        )
    
    update_data = season_data.model_dump(exclude_unset=True)
    
    # If marking as current, unmark others
    if update_data.get("is_current"):
        await db.execute(
            Season.__table__.update().where(Season.id != season_id).values(is_current=False)
        )
    
    for field, value in update_data.items():
        setattr(season, field, value)
    
    await db.commit()
    
    # Reload with relationships
    query = select(Season).options(
        selectinload(Season.competitions),
        selectinload(Season.registration_fields)
    ).where(Season.id == season_id)
    result = await db.execute(query)
    
    return result.scalar_one()


@router.post("/{season_id}/finalize", response_model=ArchiveSeasonResponse)
async def finalize_season(
    season_id: int,
    archive_data: FinalizeSeasonData,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Finalize season and create archive entry (admin only)."""
    # Get the season
    result = await db.execute(select(Season).where(Season.id == season_id))
    season = result.scalar_one_or_none()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сезон не найден"
        )
    
    if season.is_archived:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Сезон уже завершён и находится в архиве"
        )
    
    # Check if archive for this year already exists
    result = await db.execute(select(ArchiveSeason).where(ArchiveSeason.year == season.year))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Архив для этого года уже существует"
        )
    
    # Count teams for this season
    teams_count_result = await db.execute(
        select(func.count(Team.id)).where(Team.season_id == season_id)
    )
    teams_count = teams_count_result.scalar() or 0
    
    # Create archive entry with data from season + additional fields
    archive_season = ArchiveSeason(
        year=season.year,
        name=season.name,
        theme=season.theme,
        description=archive_data.description,
        cover_image=archive_data.cover_image,
        first_place=archive_data.first_place,
        second_place=archive_data.second_place,
        third_place=archive_data.third_place,
        additional_info=archive_data.additional_info,
        teams_count=teams_count
    )
    db.add(archive_season)
    
    # Mark season as archived and not current
    season.is_archived = True
    if season.is_current:
        season.is_current = False
    
    await db.commit()
    
    # Re-fetch archive with relationships
    result = await db.execute(
        select(ArchiveSeason).options(
            selectinload(ArchiveSeason.media)
        ).where(ArchiveSeason.id == archive_season.id)
    )
    
    return result.scalar_one()


@router.delete("/{season_id}")
async def delete_season(
    season_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete season (admin only)."""
    result = await db.execute(select(Season).where(Season.id == season_id))
    season = result.scalar_one_or_none()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сезон не найден"
        )
    
    await db.delete(season)
    await db.commit()
    
    return {"message": "Сезон удален"}


# Competitions

@router.post("/{season_id}/competitions", response_model=CompetitionResponse, status_code=status.HTTP_201_CREATED)
async def create_competition(
    season_id: int,
    competition_data: CompetitionCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create competition in season (admin only)."""
    # Check if season exists
    result = await db.execute(select(Season).where(Season.id == season_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сезон не найден"
        )
    
    competition = Competition(**competition_data.model_dump(), season_id=season_id)
    db.add(competition)
    await db.commit()
    await db.refresh(competition)
    
    return competition


@router.patch("/competitions/{competition_id}", response_model=CompetitionResponse)
async def update_competition(
    competition_id: int,
    competition_data: CompetitionUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update competition (admin only)."""
    result = await db.execute(select(Competition).where(Competition.id == competition_id))
    competition = result.scalar_one_or_none()
    
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Соревнование не найдено"
        )
    
    update_data = competition_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(competition, field, value)
    
    await db.commit()
    await db.refresh(competition)
    
    return competition


@router.delete("/competitions/{competition_id}")
async def delete_competition(
    competition_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete competition (admin only)."""
    result = await db.execute(select(Competition).where(Competition.id == competition_id))
    competition = result.scalar_one_or_none()
    
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Соревнование не найдено"
        )
    
    await db.delete(competition)
    await db.commit()
    
    return {"message": "Соревнование удалено"}


# Registration fields

@router.get("/{season_id}/fields", response_model=List[RegistrationFieldResponse])
async def get_registration_fields(
    season_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get registration fields for a season."""
    query = select(RegistrationField).where(
        RegistrationField.season_id == season_id
    ).order_by(RegistrationField.display_order)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{season_id}/fields", response_model=RegistrationFieldResponse, status_code=status.HTTP_201_CREATED)
async def create_registration_field(
    season_id: int,
    field_data: RegistrationFieldCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create custom registration field (admin only)."""
    field = RegistrationField(**field_data.model_dump(), season_id=season_id)
    db.add(field)
    await db.commit()
    await db.refresh(field)
    
    return field


@router.patch("/fields/{field_id}", response_model=RegistrationFieldResponse)
async def update_registration_field(
    field_id: int,
    field_data: RegistrationFieldUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update registration field (admin only)."""
    result = await db.execute(select(RegistrationField).where(RegistrationField.id == field_id))
    field = result.scalar_one_or_none()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Поле не найдено"
        )
    
    update_data = field_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(field, key, value)
    
    await db.commit()
    await db.refresh(field)
    
    return field


@router.delete("/fields/{field_id}")
async def delete_registration_field(
    field_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete registration field (admin only)."""
    result = await db.execute(select(RegistrationField).where(RegistrationField.id == field_id))
    field = result.scalar_one_or_none()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Поле не найдено"
        )
    
    await db.delete(field)
    await db.commit()
    
    return {"message": "Поле удалено"}





