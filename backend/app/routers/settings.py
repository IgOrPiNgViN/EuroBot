"""Site settings router."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from app.database import get_db
from app.models.settings import SiteSettings
from app.models.user import User
from app.schemas.settings import SettingsUpdate, SettingsResponse
from app.dependencies import get_current_admin

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any])
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """Get all public site settings."""
    result = await db.execute(select(SiteSettings).where(SiteSettings.is_public == True))
    settings = result.scalars().all()
    
    settings_dict = {}
    for setting in settings:
        if setting.value_json is not None:
            settings_dict[setting.key] = setting.value_json
        else:
            settings_dict[setting.key] = setting.value
    
    return settings_dict


@router.get("/{key}")
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    """Get specific setting by key."""
    result = await db.execute(select(SiteSettings).where(SiteSettings.key == key))
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройка не найдена"
        )
    
    if not setting.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен"
        )
    
    return setting.value_json if setting.value_json is not None else setting.value


# Admin endpoints

@router.get("/all/admin", response_model=List[SettingsResponse])
async def get_all_settings(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all settings (admin only)."""
    result = await db.execute(select(SiteSettings))
    return result.scalars().all()


@router.put("/{key}", response_model=SettingsResponse)
async def update_setting(
    key: str,
    setting_data: SettingsUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update or create setting (admin only)."""
    result = await db.execute(select(SiteSettings).where(SiteSettings.key == key))
    setting = result.scalar_one_or_none()
    
    if not setting:
        # Create new setting
        setting = SiteSettings(key=key)
        db.add(setting)
    
    update_data = setting_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(setting, field, value)
    
    await db.commit()
    await db.refresh(setting)
    
    return setting


@router.delete("/{key}")
async def delete_setting(
    key: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete setting (admin only)."""
    result = await db.execute(select(SiteSettings).where(SiteSettings.key == key))
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройка не найдена"
        )
    
    await db.delete(setting)
    await db.commit()
    
    return {"message": "Настройка удалена"}





