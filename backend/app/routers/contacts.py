"""Contacts router."""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.contact import ContactMessage, ContactTopic
from app.models.user import User
from app.schemas.contact import ContactMessageCreate, ContactMessageUpdate, ContactMessageResponse, ContactMessageListResponse
from app.dependencies import get_current_admin, get_client_ip
from app.utils.email import send_contact_notification
from app.utils.captcha import verify_captcha

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.post("/", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_contact_message(
    message_data: ContactMessageCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Submit contact form message."""
    # Verify captcha if token provided
    if message_data.recaptcha_token:
        client_ip = request.client.host if request.client else None
        is_valid = await verify_captcha(message_data.recaptcha_token, ip=client_ip)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Проверка капчи не пройдена. Попробуйте снова."
            )
    
    message = ContactMessage(
        name=message_data.name,
        email=message_data.email,
        phone=message_data.phone,
        topic=message_data.topic,
        message=message_data.message,
        ip_address=get_client_ip(request)
    )
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    # Send notification to admin
    await send_contact_notification(
        message.name,
        message.email,
        message.topic.value,
        message.message
    )
    
    return message


# Admin endpoints

@router.get("", response_model=ContactMessageListResponse)
@router.get("/", response_model=ContactMessageListResponse)
async def list_messages(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    topic: Optional[ContactTopic] = None,
    is_read: Optional[bool] = None,
    is_replied: Optional[bool] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all contact messages (admin only)."""
    query = select(ContactMessage)
    
    if topic:
        query = query.where(ContactMessage.topic == topic)
    
    if is_read is not None:
        query = query.where(ContactMessage.is_read == is_read)
    
    if is_replied is not None:
        query = query.where(ContactMessage.is_replied == is_replied)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.execute(count_query)
    total_count = total.scalar() or 0
    
    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(ContactMessage.created_at.desc())
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    messages = result.scalars().all()
    
    return ContactMessageListResponse(
        items=messages,
        total=total_count,
        page=page,
        pages=(total_count + limit - 1) // limit
    )


@router.get("/{message_id}", response_model=ContactMessageResponse)
async def get_message(
    message_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get contact message by ID (admin only)."""
    result = await db.execute(select(ContactMessage).where(ContactMessage.id == message_id))
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сообщение не найдено"
        )
    
    # Mark as read
    if not message.is_read:
        message.is_read = True
        await db.commit()
    
    return message


@router.patch("/{message_id}", response_model=ContactMessageResponse)
async def update_message(
    message_id: int,
    message_data: ContactMessageUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update contact message status (admin only)."""
    result = await db.execute(select(ContactMessage).where(ContactMessage.id == message_id))
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сообщение не найдено"
        )
    
    update_data = message_data.model_dump(exclude_unset=True)
    
    if update_data.get("is_replied") and not message.is_replied:
        update_data["replied_at"] = datetime.utcnow()
        update_data["replied_by"] = admin.id
    
    for field, value in update_data.items():
        setattr(message, field, value)
    
    await db.commit()
    await db.refresh(message)
    
    return message


@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete contact message (admin only)."""
    result = await db.execute(select(ContactMessage).where(ContactMessage.id == message_id))
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сообщение не найдено"
        )
    
    await db.delete(message)
    await db.commit()
    
    return {"message": "Сообщение удалено"}

