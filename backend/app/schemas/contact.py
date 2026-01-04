"""Contact schemas."""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.contact import ContactTopic


class ContactMessageBase(BaseModel):
    """Base contact message schema."""
    name: str
    email: EmailStr
    phone: Optional[str] = None
    topic: ContactTopic
    message: str


class ContactMessageCreate(ContactMessageBase):
    """Schema for creating a contact message."""
    recaptcha_token: Optional[str] = None  # For spam protection


class ContactMessageUpdate(BaseModel):
    """Schema for updating a contact message."""
    is_read: Optional[bool] = None
    is_replied: Optional[bool] = None


class ContactMessageResponse(ContactMessageBase):
    """Contact message response schema."""
    id: int
    is_read: bool
    is_replied: bool
    replied_at: Optional[datetime] = None
    replied_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ContactMessageListResponse(BaseModel):
    """Paginated contact message list response."""
    items: list[ContactMessageResponse]
    total: int
    page: int
    pages: int



