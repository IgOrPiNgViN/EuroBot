"""Site settings model."""
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON
from app.database import Base


class SiteSettings(Base):
    """Site-wide settings model."""
    __tablename__ = "site_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    value_json = Column(JSON, nullable=True)
    description = Column(String(500), nullable=True)
    is_public = Column(Boolean, default=True)  # Visible to frontend
    
    def __repr__(self):
        return f"<SiteSettings {self.key}>"


# Default settings keys:
# - about_history: История EUROBOT
# - about_goals: Цели и задачи
# - about_advantages: Преимущества участия (can hide)
# - about_show_advantages: Boolean
# - executive_committee: JSON array of committee members
# - expert_council: JSON array of expert council members
# - contact_addresses: JSON array of addresses
# - contact_emails: JSON object with email categories
# - social_links: JSON object with social media links
# - site_title: Site title
# - site_description: Site description for SEO
# - site_keywords: Keywords for SEO





