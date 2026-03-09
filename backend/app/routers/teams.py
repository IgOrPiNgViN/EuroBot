"""Teams router."""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from io import BytesIO, StringIO
import pandas as pd
import csv

from app.database import get_db
from app.models.team import Team, TeamMember, TeamStatus, League
from app.models.user import User
from app.models.competition import Season
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamListResponse
from app.dependencies import get_current_admin, get_current_user, get_client_ip
from app.utils.email import send_registration_confirmation
from app.utils.captcha import verify_captcha

router = APIRouter(prefix="/teams", tags=["Teams"])


# Public endpoints

@router.post("/register", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def register_team(
    team_data: TeamCreate,
    request: Request,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register a new team for competition."""
    # Verify captcha if token provided
    if team_data.recaptcha_token:
        client_ip = request.client.host if request.client else None
        is_valid = await verify_captcha(team_data.recaptcha_token, ip=client_ip)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Проверка капчи не пройдена. Попробуйте снова."
            )
    
    # Check if season exists and registration is open
    result = await db.execute(select(Season).where(Season.id == team_data.season_id))
    season = result.scalar_one_or_none()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сезон не найден"
        )
    
    if not season.registration_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Регистрация на этот сезон закрыта"
        )
    
    if not team_data.rules_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо принять правила соревнований"
        )
    
    # Check if team name already exists for this season
    result = await db.execute(
        select(Team).where(
            Team.name == team_data.name,
            Team.season_id == team_data.season_id
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Команда с таким названием уже зарегистрирована"
        )
    
    # Create team
    team = Team(
        name=team_data.name,
        email=team_data.email,
        phone=team_data.phone,
        organization=team_data.organization,
        city=team_data.city,
        region=team_data.region,
        participants_count=team_data.participants_count,
        league=team_data.league,
        poster_link=team_data.poster_link,
        rules_accepted=team_data.rules_accepted,
        custom_fields=team_data.custom_fields,
        season_id=team_data.season_id,
        user_id=user.id if user else None,
        status=TeamStatus.pending
    )
    
    # Add team members
    if team_data.members:
        for member_data in team_data.members:
            member = TeamMember(**member_data.model_dump())
            team.members.append(member)
    
    db.add(team)
    await db.commit()
    
    # Reload team with members to avoid detached instance error
    result = await db.execute(
        select(Team).options(selectinload(Team.members)).where(Team.id == team.id)
    )
    team = result.scalar_one()
    
    # Send confirmation email (don't await to not block response)
    await send_registration_confirmation(team.name, team.email)
    
    return team


# Admin endpoints

@router.get("/", response_model=TeamListResponse)
async def list_teams(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    season_id: Optional[int] = None,
    status: Optional[TeamStatus] = None,
    league: Optional[League] = None,
    search: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all teams (admin only)."""
    query = select(Team).options(selectinload(Team.members))
    
    # Filters
    if season_id:
        query = query.where(Team.season_id == season_id)
    
    if status:
        query = query.where(Team.status == status)
    
    if league:
        query = query.where(Team.league == league)
    
    if search:
        query = query.where(
            Team.name.ilike(f"%{search}%") |
            Team.organization.ilike(f"%{search}%") |
            Team.email.ilike(f"%{search}%")
        )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.execute(count_query)
    total_count = total.scalar() or 0
    
    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(Team.created_at.desc())
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    teams = result.scalars().unique().all()
    
    return TeamListResponse(
        items=teams,
        total=total_count,
        page=page,
        pages=(total_count + limit - 1) // limit
    )


@router.get("/export")
async def export_teams(
    season_id: Optional[int] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Export teams to Excel (admin only)."""
    query = select(Team).options(selectinload(Team.members))
    
    if season_id:
        query = query.where(Team.season_id == season_id)
    
    query = query.order_by(Team.created_at.desc())
    result = await db.execute(query)
    teams = result.scalars().unique().all()
    
    # Create DataFrame
    data = []
    for team in teams:
        data.append({
            "ID": team.id,
            "Название": team.name,
            "Email": team.email,
            "Телефон": team.phone,
            "Организация": team.organization,
            "Город": team.city,
            "Регион": team.region,
            "Участников": team.participants_count,
            "Лига": team.league.value,
            "Статус": team.status.value,
            "Ссылка на плакат": team.poster_link,
            "Дата регистрации": team.created_at.strftime("%Y-%m-%d %H:%M"),
            "Участники": ", ".join([m.full_name for m in team.members])
        })
    
    df = pd.DataFrame(data)
    
    # Create Excel file
    output = BytesIO()
    df.to_excel(output, index=False, sheet_name="Команды")
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=teams.xlsx"}
    )


@router.get("/csv-template")
async def download_csv_template(
    admin: User = Depends(get_current_admin),
):
    """Download CSV template for team import (admin only)."""
    output = StringIO()
    writer = csv.writer(output, delimiter=';')
    writer.writerow([
        "Название команды", "Email", "Телефон", "Организация",
        "Город", "Регион", "Кол-во участников", "Лига (junior/senior)",
        "Ссылка на плакат", "Участники (ФИО через запятую)"
    ])
    writer.writerow([
        "Роботех-1", "team@example.com", "+7 900 123-45-67",
        "МГТУ им. Баумана", "Москва", "Московская область", "4", "senior",
        "", "Иванов Иван, Петров Пётр, Сидорова Анна"
    ])

    content = output.getvalue().encode("utf-8-sig")
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=teams_template.csv"}
    )


@router.post("/import-csv")
async def import_teams_csv(
    file: UploadFile = File(...),
    season_id: int = Form(...),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Import teams from CSV file (admin only)."""
    if not file.filename or not file.filename.lower().endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть в формате CSV"
        )

    result_obj = await db.execute(select(Season).where(Season.id == season_id))
    season = result_obj.scalar_one_or_none()
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сезон не найден"
        )

    raw = await file.read()
    for encoding in ("utf-8-sig", "utf-8", "cp1251", "latin-1"):
        try:
            text = raw.decode(encoding)
            break
        except (UnicodeDecodeError, ValueError):
            continue
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось определить кодировку файла. Используйте UTF-8 или Windows-1251."
        )

    delimiter = ';' if ';' in text.split('\n')[0] else ','
    reader = csv.reader(StringIO(text), delimiter=delimiter)
    rows = list(reader)

    if len(rows) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл пуст или содержит только заголовки"
        )

    header = [h.strip().lower() for h in rows[0]]

    COLUMN_MAP = {
        "название команды": "name", "название": "name", "команда": "name", "name": "name", "team": "name",
        "email": "email", "почта": "email", "e-mail": "email",
        "телефон": "phone", "phone": "phone", "тел": "phone", "тел.": "phone",
        "организация": "organization", "organization": "organization",
        "школа": "organization", "университет": "organization", "учреждение": "organization",
        "город": "city", "city": "city",
        "регион": "region", "region": "region", "область": "region",
        "кол-во участников": "participants_count", "количество участников": "participants_count",
        "участников": "participants_count", "participants": "participants_count",
        "лига": "league", "league": "league", "лига (junior/senior)": "league",
        "ссылка на плакат": "poster_link", "плакат": "poster_link", "poster": "poster_link",
        "участники": "members", "участники (фио через запятую)": "members",
        "members": "members", "состав": "members",
    }

    col_indices = {}
    for i, h in enumerate(header):
        mapped = COLUMN_MAP.get(h)
        if mapped and mapped not in col_indices:
            col_indices[mapped] = i

    if "name" not in col_indices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не найден столбец с названием команды. Ожидается: 'Название команды', 'Название' или 'Команда'."
        )

    imported = 0
    skipped = 0
    errors = []

    for row_num, row in enumerate(rows[1:], start=2):
        if not row or all(not cell.strip() for cell in row):
            continue

        def get_val(field: str) -> str:
            idx = col_indices.get(field)
            if idx is not None and idx < len(row):
                return row[idx].strip()
            return ""

        team_name = get_val("name")
        if not team_name:
            errors.append(f"Строка {row_num}: пустое название команды")
            skipped += 1
            continue

        existing = await db.execute(
            select(Team).where(Team.name == team_name, Team.season_id == season_id)
        )
        if existing.scalar_one_or_none():
            errors.append(f"Строка {row_num}: команда '{team_name}' уже существует")
            skipped += 1
            continue

        email = get_val("email") or f"{team_name.lower().replace(' ', '_')}@import.local"
        phone = get_val("phone") or "-"
        organization = get_val("organization") or "-"
        city = get_val("city") or None
        region = get_val("region") or None

        participants_raw = get_val("participants_count")
        try:
            participants_count = int(participants_raw) if participants_raw else 1
        except ValueError:
            participants_count = 1

        league_raw = get_val("league").lower()
        if league_raw in ("junior", "юниоры", "юниор"):
            league = League.junior
        else:
            league = League.senior

        poster_link = get_val("poster_link") or None

        team = Team(
            name=team_name,
            email=email,
            phone=phone,
            organization=organization,
            city=city,
            region=region,
            participants_count=participants_count,
            league=league,
            poster_link=poster_link,
            rules_accepted=True,
            season_id=season_id,
            status=TeamStatus.approved,
        )

        members_raw = get_val("members")
        if members_raw:
            for member_name in members_raw.split(","):
                member_name = member_name.strip()
                if member_name:
                    team.members.append(TeamMember(full_name=member_name))

        db.add(team)
        imported += 1

    if imported > 0:
        await db.commit()

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "message": f"Импортировано: {imported}, пропущено: {skipped}"
    }


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get team by ID (admin only)."""
    query = select(Team).options(selectinload(Team.members)).where(Team.id == team_id)
    result = await db.execute(query)
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    return team


@router.patch("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_data: TeamUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update team (admin only)."""
    query = select(Team).options(selectinload(Team.members)).where(Team.id == team_id)
    result = await db.execute(query)
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    update_data = team_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)
    
    await db.commit()
    await db.refresh(team)
    
    return team


@router.delete("/{team_id}")
async def delete_team(
    team_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete team (admin only)."""
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    await db.delete(team)
    await db.commit()
    
    return {"message": "Команда удалена"}

