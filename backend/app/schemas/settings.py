"""Settings schemas."""
from pydantic import BaseModel
from typing import Optional, Any


class SettingsBase(BaseModel):
    """Base settings schema."""
    key: str
    value: Optional[str] = None
    value_json: Optional[Any] = None
    description: Optional[str] = None
    is_public: bool = True


class SettingsUpdate(BaseModel):
    """Schema for updating settings."""
    value: Optional[str] = None
    value_json: Optional[Any] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class SettingsResponse(SettingsBase):
    """Settings response schema."""
    id: int
    
    class Config:
        from_attributes = True



