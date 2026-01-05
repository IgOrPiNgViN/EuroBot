"""Email management router."""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.email_log import EmailLog, MassMailingCampaign, EmailStatus, EmailType
from app.models.team import Team, TeamStatus
from app.models.user import User
from app.schemas.email import (
    EmailLogResponse, EmailLogListResponse,
    MassMailingCreate, MassMailingResponse, MassMailingListResponse,
    SendCustomEmailRequest
)
from app.dependencies import get_current_admin, get_current_super_admin
from app.utils.email import send_email

router = APIRouter(prefix="/emails", tags=["Email"])


@router.get("/logs", response_model=EmailLogListResponse)
async def list_email_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    email_type: Optional[EmailType] = None,
    status_filter: Optional[EmailStatus] = Query(None, alias="status"),
    search: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all email logs (admin only)."""
    query = select(EmailLog)
    
    if email_type:
        query = query.where(EmailLog.email_type == email_type)
    
    if status_filter:
        query = query.where(EmailLog.status == status_filter)
    
    if search:
        query = query.where(
            EmailLog.to_email.ilike(f"%{search}%") |
            EmailLog.subject.ilike(f"%{search}%")
        )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.execute(count_query)
    total_count = total.scalar() or 0
    
    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(EmailLog.created_at.desc())
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return EmailLogListResponse(
        items=logs,
        total=total_count,
        page=page,
        pages=(total_count + limit - 1) // limit
    )


@router.get("/logs/stats")
async def get_email_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get email sending statistics."""
    # Total emails
    total_result = await db.execute(select(func.count(EmailLog.id)))
    total = total_result.scalar() or 0
    
    # By status
    sent_result = await db.execute(
        select(func.count(EmailLog.id)).where(EmailLog.status == EmailStatus.sent)
    )
    sent = sent_result.scalar() or 0
    
    failed_result = await db.execute(
        select(func.count(EmailLog.id)).where(EmailLog.status == EmailStatus.failed)
    )
    failed = failed_result.scalar() or 0
    
    # By type
    by_type = {}
    for email_type in EmailType:
        type_result = await db.execute(
            select(func.count(EmailLog.id)).where(EmailLog.email_type == email_type)
        )
        by_type[email_type.value] = type_result.scalar() or 0
    
    return {
        "total": total,
        "sent": sent,
        "failed": failed,
        "pending": total - sent - failed,
        "by_type": by_type
    }


# Mass Mailing endpoints

@router.get("/campaigns", response_model=MassMailingListResponse)
async def list_campaigns(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all mass mailing campaigns."""
    query = select(MassMailingCampaign)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.execute(count_query)
    total_count = total.scalar() or 0
    
    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(MassMailingCampaign.created_at.desc())
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    campaigns = result.scalars().all()
    
    return MassMailingListResponse(
        items=campaigns,
        total=total_count,
        page=page,
        pages=(total_count + limit - 1) // limit
    )


@router.post("/campaigns", response_model=MassMailingResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign_data: MassMailingCreate,
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new mass mailing campaign (super admin only)."""
    # Get recipient count based on target
    recipient_query = select(func.count(Team.id))
    
    if campaign_data.target_type == "approved_teams":
        recipient_query = recipient_query.where(Team.status == TeamStatus.approved)
    elif campaign_data.target_type == "pending_teams":
        recipient_query = recipient_query.where(Team.status == TeamStatus.pending)
    
    if campaign_data.target_season_id:
        recipient_query = recipient_query.where(Team.season_id == campaign_data.target_season_id)
    
    result = await db.execute(recipient_query)
    recipient_count = result.scalar() or 0
    
    campaign = MassMailingCampaign(
        name=campaign_data.name,
        subject=campaign_data.subject,
        body=campaign_data.body,
        target_type=campaign_data.target_type,
        target_season_id=campaign_data.target_season_id,
        total_recipients=recipient_count,
        created_by=admin.id
    )
    
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    
    return campaign


@router.post("/campaigns/{campaign_id}/send")
async def send_campaign(
    campaign_id: int,
    background_tasks: BackgroundTasks,
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Send a mass mailing campaign (super admin only)."""
    result = await db.execute(
        select(MassMailingCampaign).where(MassMailingCampaign.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Рассылка не найдена")
    
    if campaign.is_sent:
        raise HTTPException(status_code=400, detail="Рассылка уже отправлена")
    
    # Get recipients
    teams_query = select(Team)
    
    if campaign.target_type == "approved_teams":
        teams_query = teams_query.where(Team.status == TeamStatus.approved)
    elif campaign.target_type == "pending_teams":
        teams_query = teams_query.where(Team.status == TeamStatus.pending)
    
    if campaign.target_season_id:
        teams_query = teams_query.where(Team.season_id == campaign.target_season_id)
    
    teams_result = await db.execute(teams_query)
    teams = teams_result.scalars().all()
    
    # Send emails in background
    async def send_campaign_emails():
        sent = 0
        failed = 0
        
        for team in teams:
            success = await send_email(
                to=team.email,
                subject=campaign.subject,
                body=campaign.body,
                db=db,
                email_type="mass_mailing",
                team_id=team.id,
                sent_by=admin.id
            )
            
            if success:
                sent += 1
            else:
                failed += 1
        
        # Update campaign stats
        campaign.sent_count = sent
        campaign.failed_count = failed
        campaign.is_sent = True
        campaign.sent_at = datetime.utcnow()
        await db.commit()
    
    background_tasks.add_task(send_campaign_emails)
    
    return {"message": f"Рассылка запущена для {len(teams)} получателей"}


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a mass mailing campaign (super admin only)."""
    result = await db.execute(
        select(MassMailingCampaign).where(MassMailingCampaign.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Рассылка не найдена")
    
    if campaign.is_sent:
        raise HTTPException(status_code=400, detail="Нельзя удалить отправленную рассылку")
    
    await db.delete(campaign)
    await db.commit()
    
    return {"message": "Рассылка удалена"}


@router.post("/send-custom")
async def send_custom_email(
    request: SendCustomEmailRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Send custom email to specified recipients (admin only)."""
    success = await send_email(
        to=request.to,
        subject=request.subject,
        body=request.body,
        html=request.html,
        db=db,
        email_type="custom",
        sent_by=admin.id
    )
    
    if success:
        return {"message": f"Письма отправлены на {len(request.to)} адресов"}
    else:
        raise HTTPException(status_code=500, detail="Ошибка при отправке писем")


