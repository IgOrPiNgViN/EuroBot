"""News schemas."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.news import NewsCategoryType


class NewsTagBase(BaseModel):
    """Base tag schema."""
    name: str
    slug: str


class NewsTagResponse(NewsTagBase):
    """Tag response schema."""
    id: int
    
    class Config:
        from_attributes = True


class NewsCategoryBase(BaseModel):
    """Base category schema."""
    name: str
    slug: str
    type: NewsCategoryType


class NewsCategoryResponse(NewsCategoryBase):
    """Category response schema."""
    id: int
    
    class Config:
        from_attributes = True


class NewsBase(BaseModel):
    """Base news schema."""
    title: str
    excerpt: Optional[str] = None
    content: str
    featured_image: Optional[str] = None
    video_url: Optional[str] = None
    gallery: Optional[str] = None
    category_id: Optional[int] = None
    is_published: bool = False
    is_featured: bool = False
    publish_date: Optional[datetime] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class NewsCreate(NewsBase):
    """Schema for creating news."""
    tag_ids: Optional[List[int]] = []


class NewsUpdate(BaseModel):
    """Schema for updating news."""
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    featured_image: Optional[str] = None
    video_url: Optional[str] = None
    gallery: Optional[str] = None
    category_id: Optional[int] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    publish_date: Optional[datetime] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tag_ids: Optional[List[int]] = None


class NewsResponse(NewsBase):
    """News response schema."""
    id: int
    slug: str
    category: Optional[NewsCategoryResponse] = None
    tags: List[NewsTagResponse] = []
    views_count: int
    author_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NewsListResponse(BaseModel):
    """Paginated news list response."""
    items: List[NewsResponse]
    total: int
    page: int
    pages: int



