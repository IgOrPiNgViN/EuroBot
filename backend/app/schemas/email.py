"""Email schemas."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class EmailStatus(str, Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"


class EmailType(str, Enum):
    registration_confirmation = "registration_confirmation"
    contact_notification = "contact_notification"
    mass_mailing = "mass_mailing"
    team_status_update = "team_status_update"
    custom = "custom"


class EmailLogResponse(BaseModel):
    """Response schema for email log."""
    id: int
    to_email: str
    to_name: Optional[str] = None
    subject: str
    body_preview: Optional[str] = None
    email_type: str
    status: str
    error_message: Optional[str] = None
    retry_count: int
    team_id: Optional[int] = None
    contact_id: Optional[int] = None
    sent_by: Optional[int] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EmailLogListResponse(BaseModel):
    """Response schema for email log list."""
    items: List[EmailLogResponse]
    total: int
    page: int
    pages: int


class MassMailingCreate(BaseModel):
    """Schema for creating mass mailing campaign."""
    name: str
    subject: str
    body: str
    target_type: str  # 'all_teams', 'approved_teams', 'pending_teams'
    target_season_id: Optional[int] = None


class MassMailingResponse(BaseModel):
    """Response schema for mass mailing campaign."""
    id: int
    name: str
    subject: str
    body: str
    target_type: str
    target_season_id: Optional[int] = None
    total_recipients: int
    sent_count: int
    failed_count: int
    is_sent: bool
    created_by: Optional[int] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MassMailingListResponse(BaseModel):
    """Response schema for mass mailing campaign list."""
    items: List[MassMailingResponse]
    total: int
    page: int
    pages: int


class SendCustomEmailRequest(BaseModel):
    """Request schema for sending custom email."""
    to: List[EmailStr]
    subject: str
    body: str
    html: Optional[bool] = False

