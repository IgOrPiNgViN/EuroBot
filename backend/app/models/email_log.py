"""Email log model for tracking sent emails."""
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SAEnum, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class EmailStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"


class EmailType(str, enum.Enum):
    registration_confirmation = "registration_confirmation"
    contact_notification = "contact_notification"
    mass_mailing = "mass_mailing"
    team_status_update = "team_status_update"
    custom = "custom"


class EmailLog(Base):
    """Log of all sent emails."""
    __tablename__ = "email_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Recipient info
    to_email = Column(String(255), nullable=False, index=True)
    to_name = Column(String(255), nullable=True)
    
    # Email content
    subject = Column(String(500), nullable=False)
    body_preview = Column(Text, nullable=True)  # First 500 chars of body
    
    # Type and status
    email_type = Column(SAEnum(EmailType, values_callable=lambda x: [e.value for e in x]), 
                        default=EmailType.custom, nullable=False)
    status = Column(SAEnum(EmailStatus, values_callable=lambda x: [e.value for e in x]), 
                    default=EmailStatus.pending, nullable=False)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Relations
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    contact_id = Column(Integer, ForeignKey("contact_messages.id", ondelete="SET NULL"), nullable=True)
    sent_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Admin who triggered
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<EmailLog {self.id}: {self.to_email} - {self.status.value}>"


class MassMailingCampaign(Base):
    """Mass mailing campaign tracking."""
    __tablename__ = "mass_mailing_campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Campaign info
    name = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    
    # Targeting
    target_type = Column(String(50), nullable=False)  # 'all_teams', 'approved_teams', 'pending_teams', etc.
    target_season_id = Column(Integer, ForeignKey("seasons.id", ondelete="SET NULL"), nullable=True)
    
    # Stats
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    
    # Status
    is_sent = Column(Boolean, default=False)
    
    # Created by admin
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<MassMailingCampaign {self.id}: {self.name}>"


