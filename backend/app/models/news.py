"""News models."""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class NewsCategoryType(str, enum.Enum):
    """News category types."""
    ANNOUNCEMENTS = "announcements"  # Объявления
    RESULTS = "results"  # Результаты
    INSTRUCTIONS = "instructions"  # Инструкции
    EVENTS = "events"  # События


# Many-to-many relationship table for news and tags
news_tags = Table(
    "news_tags",
    Base.metadata,
    Column("news_id", Integer, ForeignKey("news.id", ondelete="CASCADE")),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"))
)


class NewsCategory(Base):
    """News category model."""
    __tablename__ = "news_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    type = Column(Enum(NewsCategoryType), nullable=False)
    
    news = relationship("News", back_populates="category")


class NewsTag(Base):
    """News tag model for filtering."""
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    slug = Column(String(50), unique=True, nullable=False)
    
    news = relationship("News", secondary=news_tags, back_populates="tags")


class News(Base):
    """News article model."""
    __tablename__ = "news"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    slug = Column(String(500), unique=True, nullable=False, index=True)
    excerpt = Column(Text, nullable=True)  # Short description
    content = Column(Text, nullable=False)
    
    # Media
    featured_image = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    gallery = Column(Text, nullable=True)  # JSON array of image URLs
    
    # Category and tags
    category_id = Column(Integer, ForeignKey("news_categories.id"), nullable=True)
    category = relationship("NewsCategory", back_populates="news")
    tags = relationship("NewsTag", secondary=news_tags, back_populates="news")
    
    # Publishing
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)  # Show on main page
    publish_date = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    views_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # SEO
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<News {self.title}>"



