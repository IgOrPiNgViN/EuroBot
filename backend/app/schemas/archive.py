"""Archive schemas."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.archive import MediaType


class ArchiveMediaBase(BaseModel):
    """Base archive media schema."""
    title: Optional[str] = None
    description: Optional[str] = None
    media_type: MediaType
    file_path: str
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None
    duration: Optional[int] = None
    display_order: int = 0


class ArchiveMediaCreate(ArchiveMediaBase):
    """Schema for creating archive media."""
    archive_season_id: int


class ArchiveMediaResponse(ArchiveMediaBase):
    """Archive media response schema."""
    id: int
    archive_season_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ArchiveSeasonBase(BaseModel):
    """Base archive season schema."""
    year: int
    name: str
    theme: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    results_summary: Optional[str] = None
    teams_count: Optional[int] = None


class ArchiveSeasonCreate(ArchiveSeasonBase):
    """Schema for creating an archive season."""
    pass


class ArchiveSeasonUpdate(BaseModel):
    """Schema for updating an archive season."""
    name: Optional[str] = None
    theme: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    results_summary: Optional[str] = None
    teams_count: Optional[int] = None


class ArchiveSeasonResponse(ArchiveSeasonBase):
    """Archive season response schema."""
    id: int
    media: List[ArchiveMediaResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True





