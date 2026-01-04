"""Teams router."""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from io import BytesIO
import pandas as pd

from app.database import get_db
from app.models.team import Team, TeamMember, TeamStatus, League
from app.models.user import User
from app.models.competition import Season
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamListResponse
from app.dependencies import get_current_admin, get_current_user, get_client_ip
from app.utils.email import send_registration_confirmation

router = APIRouter(prefix="/teams", tags=["Teams"])


# Public endpoints

@router.post("/register", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def register_team(
    team_data: TeamCreate,
    request: Request,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register a new team for competition."""
    # Check if season exists and registration is open
    result = await db.execute(select(Season).where(Season.id == team_data.season_id))
    season = result.scalar_one_or_none()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сезон не найден"
        )
    
    if not season.registration_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Регистрация на этот сезон закрыта"
        )
    
    if not team_data.rules_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо принять правила соревнований"
        )
    
    # Check if team name already exists for this season
    result = await db.execute(
        select(Team).where(
            Team.name == team_data.name,
            Team.season_id == team_data.season_id
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Команда с таким названием уже зарегистрирована"
        )
    
    # Create team
    team = Team(
        name=team_data.name,
        email=team_data.email,
        phone=team_data.phone,
        organization=team_data.organization,
        city=team_data.city,
        region=team_data.region,
        participants_count=team_data.participants_count,
        league=team_data.league,
        poster_link=team_data.poster_link,
        rules_accepted=team_data.rules_accepted,
        season_id=team_data.season_id,
        user_id=user.id if user else None,
        status=TeamStatus.pending
    )
    
    # Add team members
    if team_data.members:
        for member_data in team_data.members:
            member = TeamMember(**member_data.model_dump())
            team.members.append(member)
    
    db.add(team)
    await db.commit()
    
    # Reload team with members to avoid detached instance error
    result = await db.execute(
        select(Team).options(selectinload(Team.members)).where(Team.id == team.id)
    )
    team = result.scalar_one()
    
    # Send confirmation email (don't await to not block response)
    await send_registration_confirmation(team.name, team.email)
    
    return team


# Admin endpoints

@router.get("/", response_model=TeamListResponse)
async def list_teams(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    season_id: Optional[int] = None,
    status: Optional[TeamStatus] = None,
    league: Optional[League] = None,
    search: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all teams (admin only)."""
    query = select(Team).options(selectinload(Team.members))
    
    # Filters
    if season_id:
        query = query.where(Team.season_id == season_id)
    
    if status:
        query = query.where(Team.status == status)
    
    if league:
        query = query.where(Team.league == league)
    
    if search:
        query = query.where(
            Team.name.ilike(f"%{search}%") |
            Team.organization.ilike(f"%{search}%") |
            Team.email.ilike(f"%{search}%")
        )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.execute(count_query)
    total_count = total.scalar() or 0
    
    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(Team.created_at.desc())
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    teams = result.scalars().unique().all()
    
    return TeamListResponse(
        items=teams,
        total=total_count,
        page=page,
        pages=(total_count + limit - 1) // limit
    )


@router.get("/export")
async def export_teams(
    season_id: Optional[int] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Export teams to Excel (admin only)."""
    query = select(Team).options(selectinload(Team.members))
    
    if season_id:
        query = query.where(Team.season_id == season_id)
    
    query = query.order_by(Team.created_at.desc())
    result = await db.execute(query)
    teams = result.scalars().unique().all()
    
    # Create DataFrame
    data = []
    for team in teams:
        data.append({
            "ID": team.id,
            "Название": team.name,
            "Email": team.email,
            "Телефон": team.phone,
            "Организация": team.organization,
            "Город": team.city,
            "Регион": team.region,
            "Участников": team.participants_count,
            "Лига": team.league.value,
            "Статус": team.status.value,
            "Ссылка на плакат": team.poster_link,
            "Дата регистрации": team.created_at.strftime("%Y-%m-%d %H:%M"),
            "Участники": ", ".join([m.full_name for m in team.members])
        })
    
    df = pd.DataFrame(data)
    
    # Create Excel file
    output = BytesIO()
    df.to_excel(output, index=False, sheet_name="Команды")
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=teams.xlsx"}
    )


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get team by ID (admin only)."""
    query = select(Team).options(selectinload(Team.members)).where(Team.id == team_id)
    result = await db.execute(query)
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    return team


@router.patch("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_data: TeamUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update team (admin only)."""
    query = select(Team).options(selectinload(Team.members)).where(Team.id == team_id)
    result = await db.execute(query)
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    update_data = team_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)
    
    await db.commit()
    await db.refresh(team)
    
    return team


@router.delete("/{team_id}")
async def delete_team(
    team_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete team (admin only)."""
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    await db.delete(team)
    await db.commit()
    
    return {"message": "Команда удалена"}

