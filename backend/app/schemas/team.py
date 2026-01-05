"""Team schemas."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.team import TeamStatus, League


class TeamMemberBase(BaseModel):
    """Base team member schema."""
    full_name: str
    role: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class TeamMemberCreate(TeamMemberBase):
    """Schema for creating a team member."""
    pass


class TeamMemberResponse(TeamMemberBase):
    """Team member response schema."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    """Base team schema."""
    name: str
    email: EmailStr
    phone: str
    organization: str
    city: Optional[str] = None
    region: Optional[str] = None
    participants_count: int
    league: League
    poster_link: Optional[str] = None
    rules_accepted: bool = False


class TeamCreate(TeamBase):
    """Schema for creating a team."""
    season_id: int
    members: Optional[List[TeamMemberCreate]] = []
    recaptcha_token: Optional[str] = None  # For spam protection


class TeamUpdate(BaseModel):
    """Schema for updating a team."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    participants_count: Optional[int] = None
    league: Optional[League] = None
    poster_link: Optional[str] = None
    status: Optional[TeamStatus] = None
    notes: Optional[str] = None


class TeamResponse(TeamBase):
    """Team response schema."""
    id: int
    status: TeamStatus
    season_id: int
    user_id: Optional[int] = None
    members: List[TeamMemberResponse] = []
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TeamListResponse(BaseModel):
    """Paginated team list response."""
    items: List[TeamResponse]
    total: int
    page: int
    pages: int





