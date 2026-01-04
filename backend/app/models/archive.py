"""Archive models for previous seasons."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class MediaType(str, enum.Enum):
    """Archive media types."""
    PHOTO = "photo"
    VIDEO = "video"
    DOCUMENT = "document"


class ArchiveSeason(Base):
    """Archive season model."""
    __tablename__ = "archive_seasons"
    
    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    theme = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Cover image
    cover_image = Column(String(500), nullable=True)
    
    # Results and stats
    results_summary = Column(Text, nullable=True)
    teams_count = Column(Integer, nullable=True)
    
    # Media
    media = relationship("ArchiveMedia", back_populates="archive_season", cascade="all, delete-orphan")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<ArchiveSeason {self.year}>"


class ArchiveMedia(Base):
    """Archive media files."""
    __tablename__ = "archive_media"
    
    id = Column(Integer, primary_key=True, index=True)
    archive_season_id = Column(Integer, ForeignKey("archive_seasons.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    media_type = Column(Enum(MediaType), nullable=False)
    file_path = Column(String(500), nullable=False)
    thumbnail = Column(String(500), nullable=True)
    
    # For videos
    video_url = Column(String(500), nullable=True)  # YouTube/Vimeo embed
    duration = Column(Integer, nullable=True)  # In seconds
    
    display_order = Column(Integer, default=0)
    
    archive_season = relationship("ArchiveSeason", back_populates="media")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ArchiveMedia {self.title}>"



