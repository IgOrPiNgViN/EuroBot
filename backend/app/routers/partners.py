"""Partners router."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict

from app.database import get_db
from app.models.partner import Partner, PartnerCategory
from app.models.user import User
from app.schemas.partner import PartnerCreate, PartnerUpdate, PartnerResponse
from app.dependencies import get_current_admin

router = APIRouter(prefix="/partners", tags=["Partners"])


@router.get("/", response_model=List[PartnerResponse])
async def list_partners(
    category: Optional[PartnerCategory] = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """List all partners."""
    query = select(Partner)
    
    if active_only:
        query = query.where(Partner.is_active == True)
    
    if category:
        query = query.where(Partner.category == category)
    
    query = query.order_by(Partner.display_order, Partner.name)
    result = await db.execute(query)
    
    return result.scalars().all()


@router.get("/grouped")
async def get_partners_grouped(db: AsyncSession = Depends(get_db)) -> Dict[str, List[PartnerResponse]]:
    """Get partners grouped by category."""
    query = select(Partner).where(Partner.is_active == True).order_by(Partner.display_order, Partner.name)
    result = await db.execute(query)
    partners = result.scalars().all()
    
    grouped = {}
    for category in PartnerCategory:
        grouped[category.value] = [
            PartnerResponse.model_validate(p) 
            for p in partners 
            if p.category == category
        ]
    
    return grouped


@router.get("/{partner_id}", response_model=PartnerResponse)
async def get_partner(partner_id: int, db: AsyncSession = Depends(get_db)):
    """Get partner by ID."""
    result = await db.execute(select(Partner).where(Partner.id == partner_id))
    partner = result.scalar_one_or_none()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Партнер не найден"
        )
    
    return partner


# Admin endpoints

@router.post("/", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
async def create_partner(
    partner_data: PartnerCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create partner (admin only)."""
    partner = Partner(**partner_data.model_dump())
    db.add(partner)
    await db.commit()
    await db.refresh(partner)
    
    return partner


@router.patch("/{partner_id}", response_model=PartnerResponse)
async def update_partner(
    partner_id: int,
    partner_data: PartnerUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update partner (admin only)."""
    result = await db.execute(select(Partner).where(Partner.id == partner_id))
    partner = result.scalar_one_or_none()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Партнер не найден"
        )
    
    update_data = partner_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(partner, field, value)
    
    await db.commit()
    await db.refresh(partner)
    
    return partner


@router.delete("/{partner_id}")
async def delete_partner(
    partner_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete partner (admin only)."""
    result = await db.execute(select(Partner).where(Partner.id == partner_id))
    partner = result.scalar_one_or_none()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Партнер не найден"
        )
    
    await db.delete(partner)
    await db.commit()
    
    return {"message": "Партнер удален"}



