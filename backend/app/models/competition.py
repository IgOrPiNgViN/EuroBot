"""Competition and season models."""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Season(Base):
    """Competition season model."""
    __tablename__ = "seasons"
    
    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, unique=True, nullable=False)
    name = Column(String(255), nullable=False)  # e.g., "EUROBOT 2025"
    theme = Column(String(255), nullable=True)  # Тема сезона
    
    # Registration
    registration_open = Column(Boolean, default=False)
    registration_start = Column(DateTime(timezone=True), nullable=True)
    registration_end = Column(DateTime(timezone=True), nullable=True)
    
    # Competition details
    competition_date_start = Column(Date, nullable=True)
    competition_date_end = Column(Date, nullable=True)
    location = Column(String(500), nullable=True)
    format = Column(Text, nullable=True)
    
    # Visibility settings (for admin panel)
    show_dates = Column(Boolean, default=True)
    show_location = Column(Boolean, default=True)
    show_format = Column(Boolean, default=True)
    show_registration_deadline = Column(Boolean, default=True)
    
    # Status
    is_current = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    
    # Relations
    competitions = relationship("Competition", back_populates="season", cascade="all, delete-orphan")
    teams = relationship("Team", backref="season")
    registration_fields = relationship("RegistrationField", back_populates="season", cascade="all, delete-orphan")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Season {self.year}>"


class Competition(Base):
    """Competition/event within a season."""
    __tablename__ = "competitions"
    
    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Documents and files
    rules_file = Column(String(500), nullable=True)
    field_files = Column(JSON, nullable=True)  # Array of file paths
    vinyl_files = Column(JSON, nullable=True)  # Array of file paths
    drawings_3d = Column(JSON, nullable=True)  # Array of file paths
    
    # Links
    registration_link = Column(String(500), nullable=True)
    external_link = Column(String(500), nullable=True)
    
    # Display order
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    season = relationship("Season", back_populates="competitions")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Competition {self.name}>"


class RegistrationField(Base):
    """Custom registration fields for seasons."""
    __tablename__ = "registration_fields"
    
    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(100), nullable=False)
    label = Column(String(255), nullable=False)
    field_type = Column(String(50), nullable=False)  # text, email, phone, select, checkbox, file
    options = Column(JSON, nullable=True)  # For select fields
    is_required = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    season = relationship("Season", back_populates="registration_fields")
    
    def __repr__(self):
        return f"<RegistrationField {self.name}>"



