"""Contact form models."""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class ContactTopic(str, enum.Enum):
    """Contact form topics."""
    TECHNICAL = "technical"  # Технические вопросы
    REGISTRATION = "registration"  # Регистрация и участие
    SPONSORSHIP = "sponsorship"  # Спонсорство и партнерство
    PRESS = "press"  # Пресса
    OTHER = "other"  # Другое


class ContactMessage(Base):
    """Contact form message model."""
    __tablename__ = "contact_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)  # Optional
    topic = Column(Enum(ContactTopic), nullable=False)
    message = Column(Text, nullable=False)
    
    # Status
    is_read = Column(Boolean, default=False)
    is_replied = Column(Boolean, default=False)
    replied_at = Column(DateTime(timezone=True), nullable=True)
    replied_by = Column(Integer, nullable=True)  # Admin user id
    
    # IP and spam protection
    ip_address = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ContactMessage from {self.email}>"


