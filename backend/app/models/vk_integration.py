"""VK Integration models."""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class VKIntegration(Base):
    """VK community integration settings."""
    __tablename__ = "vk_integrations"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(String(100), nullable=False)
    access_token = Column(String(500), nullable=False)
    is_enabled = Column(Boolean, default=False)
    mode = Column(String(20), default="off")
    default_category_id = Column(Integer, ForeignKey("news_categories.id"), nullable=True)
    auto_publish = Column(Boolean, default=True)
    check_interval_minutes = Column(Integer, default=10)
    fetch_count = Column(Integer, default=20)
    hashtag_category_map = Column(Text, nullable=True)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    default_category = relationship("NewsCategory", foreign_keys=[default_category_id])
    imported_posts = relationship("VKImportedPost", back_populates="integration", cascade="all, delete-orphan")


class VKImportedPost(Base):
    """Track imported VK posts to avoid duplicates."""
    __tablename__ = "vk_imported_posts"

    id = Column(Integer, primary_key=True, index=True)
    vk_post_id = Column(Integer, nullable=False, index=True)
    vk_integration_id = Column(Integer, ForeignKey("vk_integrations.id", ondelete="CASCADE"), nullable=False)
    news_id = Column(Integer, ForeignKey("news.id", ondelete="SET NULL"), nullable=True)
    vk_post_date = Column(DateTime(timezone=True), nullable=True)
    imported_at = Column(DateTime(timezone=True), server_default=func.now())

    integration = relationship("VKIntegration", back_populates="imported_posts")
    news = relationship("News", foreign_keys=[news_id])
