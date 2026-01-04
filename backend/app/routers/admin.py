"""Admin dashboard router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User, UserRole
from app.models.news import News
from app.models.team import Team, TeamStatus
from app.models.partner import Partner
from app.models.contact import ContactMessage
from app.models.admin_log import AdminLog
from app.models.competition import Season
from app.dependencies import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
async def get_dashboard_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get admin dashboard statistics."""
    # Count entities
    teams_count = await db.execute(select(func.count(Team.id)))
    news_count = await db.execute(select(func.count(News.id)))
    partners_count = await db.execute(select(func.count(Partner.id)))
    messages_count = await db.execute(select(func.count(ContactMessage.id)))
    users_count = await db.execute(select(func.count(User.id)))
    
    # Pending items
    pending_teams = await db.execute(
        select(func.count(Team.id)).where(Team.status == TeamStatus.pending)
    )
    unread_messages = await db.execute(
        select(func.count(ContactMessage.id)).where(ContactMessage.is_read == False)
    )
    
    # Recent registrations (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_teams = await db.execute(
        select(func.count(Team.id)).where(Team.created_at >= week_ago)
    )
    
    # Current season
    current_season = await db.execute(
        select(Season).where(Season.is_current == True)
    )
    season = current_season.scalar_one_or_none()
    
    return {
        "totals": {
            "teams": teams_count.scalar() or 0,
            "news": news_count.scalar() or 0,
            "partners": partners_count.scalar() or 0,
            "messages": messages_count.scalar() or 0,
            "users": users_count.scalar() or 0
        },
        "pending": {
            "teams": pending_teams.scalar() or 0,
            "messages": unread_messages.scalar() or 0
        },
        "recent": {
            "teams_week": recent_teams.scalar() or 0
        },
        "current_season": {
            "id": season.id if season else None,
            "name": season.name if season else None,
            "registration_open": season.registration_open if season else False
        } if season else None
    }


@router.get("/logs")
async def get_admin_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_id: Optional[int] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get admin activity logs."""
    query = select(AdminLog)
    
    if action:
        query = query.where(AdminLog.action == action)
    
    if entity_type:
        query = query.where(AdminLog.entity_type == entity_type)
    
    if user_id:
        query = query.where(AdminLog.user_id == user_id)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.execute(count_query)
    total_count = total.scalar() or 0
    
    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(AdminLog.created_at.desc())
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "items": logs,
        "total": total_count,
        "page": page,
        "pages": (total_count + limit - 1) // limit
    }


@router.get("/teams/stats")
async def get_team_stats(
    season_id: Optional[int] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get team registration statistics."""
    query = select(Team)
    
    if season_id:
        query = query.where(Team.season_id == season_id)
    
    result = await db.execute(query)
    teams = result.scalars().all()
    
    # Calculate stats
    status_counts = {}
    league_counts = {}
    city_counts = {}
    
    for team in teams:
        # Status
        status = team.status.value
        status_counts[status] = status_counts.get(status, 0) + 1
        
        # League
        league = team.league.value
        league_counts[league] = league_counts.get(league, 0) + 1
        
        # City
        if team.city:
            city_counts[team.city] = city_counts.get(team.city, 0) + 1
    
    return {
        "total": len(teams),
        "by_status": status_counts,
        "by_league": league_counts,
        "by_city": dict(sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:10])
    }

