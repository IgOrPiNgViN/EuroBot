"""Team registration models."""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class TeamStatus(str, enum.Enum):
    """Team registration status."""
    pending = "pending"  # Ожидает подтверждения
    approved = "approved"  # Подтверждена
    rejected = "rejected"  # Отклонена
    withdrawn = "withdrawn"  # Снята с участия


class League(str, enum.Enum):
    """Competition leagues."""
    junior = "junior"  # Юниоры
    senior = "senior"  # Основная лига


class Team(Base):
    """Team registration model."""
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    
    # Contact information
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    
    # Organization
    organization = Column(String(500), nullable=False)  # Школа/университет
    city = Column(String(255), nullable=True)
    region = Column(String(255), nullable=True)
    
    # Team details
    participants_count = Column(Integer, nullable=False)
    league = Column(SAEnum(League, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # Technical
    poster_link = Column(String(1000), nullable=True)  # Ссылка на технический плакат
    
    # Status
    status = Column(SAEnum(TeamStatus, values_callable=lambda x: [e.value for e in x]), default=TeamStatus.pending)
    rules_accepted = Column(Boolean, default=False)
    
    # Relations
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    
    # Metadata
    notes = Column(Text, nullable=True)  # Admin notes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Team {self.name}>"


class TeamMember(Base):
    """Team member model."""
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    
    full_name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=True)  # Капитан, участник, etc.
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    
    team = relationship("Team", back_populates="members")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<TeamMember {self.full_name}>"

