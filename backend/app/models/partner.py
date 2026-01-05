"""Partner models."""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class PartnerCategory(str, enum.Enum):
    """Partner categories."""
    GENERAL = "general"  # Генеральный партнер
    OFFICIAL = "official"  # Официальные партнеры
    TECHNOLOGY = "technology"  # Технологические партнеры
    EDUCATIONAL = "educational"  # Образовательные партнеры
    MEDIA = "media"  # СМИ партнеры


class Partner(Base):
    """Partner model."""
    __tablename__ = "partners"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(Enum(PartnerCategory), nullable=False)
    logo = Column(String(500), nullable=False)
    website = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    # Display options
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Partner {self.name}>"





