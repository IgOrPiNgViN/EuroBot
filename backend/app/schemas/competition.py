"""Competition and season schemas."""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime, date


class RegistrationFieldBase(BaseModel):
    """Base registration field schema."""
    name: str
    label: str
    field_type: str
    options: Optional[List[Any]] = None
    is_required: bool = False
    display_order: int = 0
    is_active: bool = True


class RegistrationFieldCreate(RegistrationFieldBase):
    """Schema for creating a registration field."""
    pass


class RegistrationFieldUpdate(BaseModel):
    """Schema for updating a registration field."""
    name: Optional[str] = None
    label: Optional[str] = None
    field_type: Optional[str] = None
    options: Optional[List[Any]] = None
    is_required: Optional[bool] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class RegistrationFieldResponse(RegistrationFieldBase):
    """Registration field response schema."""
    id: int
    season_id: int
    
    class Config:
        from_attributes = True


class CompetitionBase(BaseModel):
    """Base competition schema."""
    name: str
    description: Optional[str] = None
    rules_file: Optional[str] = None
    field_files: Optional[List[str]] = None
    vinyl_files: Optional[List[str]] = None
    drawings_3d: Optional[List[str]] = None
    registration_link: Optional[str] = None
    external_link: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class CompetitionCreate(CompetitionBase):
    """Schema for creating a competition."""
    season_id: int


class CompetitionUpdate(BaseModel):
    """Schema for updating a competition."""
    name: Optional[str] = None
    description: Optional[str] = None
    rules_file: Optional[str] = None
    field_files: Optional[List[str]] = None
    vinyl_files: Optional[List[str]] = None
    drawings_3d: Optional[List[str]] = None
    registration_link: Optional[str] = None
    external_link: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CompetitionResponse(CompetitionBase):
    """Competition response schema."""
    id: int
    season_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SeasonBase(BaseModel):
    """Base season schema."""
    year: int
    name: str
    theme: Optional[str] = None
    registration_open: bool = False
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    competition_date_start: Optional[date] = None
    competition_date_end: Optional[date] = None
    location: Optional[str] = None
    format: Optional[str] = None
    show_dates: bool = True
    show_location: bool = True
    show_format: bool = True
    show_registration_deadline: bool = True
    is_current: bool = False
    is_archived: bool = False


class SeasonCreate(SeasonBase):
    """Schema for creating a season."""
    pass


class SeasonUpdate(BaseModel):
    """Schema for updating a season."""
    year: Optional[int] = None
    name: Optional[str] = None
    theme: Optional[str] = None
    registration_open: Optional[bool] = None
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    competition_date_start: Optional[date] = None
    competition_date_end: Optional[date] = None
    location: Optional[str] = None
    format: Optional[str] = None
    show_dates: Optional[bool] = None
    show_location: Optional[bool] = None
    show_format: Optional[bool] = None
    show_registration_deadline: Optional[bool] = None
    is_current: Optional[bool] = None
    is_archived: Optional[bool] = None


class SeasonResponse(SeasonBase):
    """Season response schema."""
    id: int
    competitions: List[CompetitionResponse] = []
    registration_fields: List[RegistrationFieldResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True





