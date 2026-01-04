"""Partner schemas."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.partner import PartnerCategory


class PartnerBase(BaseModel):
    """Base partner schema."""
    name: str
    category: PartnerCategory
    logo: str
    website: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class PartnerCreate(PartnerBase):
    """Schema for creating a partner."""
    pass


class PartnerUpdate(BaseModel):
    """Schema for updating a partner."""
    name: Optional[str] = None
    category: Optional[PartnerCategory] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class PartnerResponse(PartnerBase):
    """Partner response schema."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True



