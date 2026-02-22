"""VK Integration router."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import httpx
import json
import re
from loguru import logger

from app.database import get_db
from app.models.vk_integration import VKIntegration, VKImportedPost
from app.models.news import News, NewsCategory
from app.dependencies import get_current_admin
from app.utils.slug import generate_slug

router = APIRouter(prefix="/vk-integration", tags=["VK Integration"])

MOSCOW_TZ = timezone(timedelta(hours=3))
VK_API_VERSION = "5.199"


# --- Schemas ---

class VKIntegrationCreate(BaseModel):
    group_id: str
    access_token: str
    mode: str = "off"
    default_category_id: Optional[int] = None
    auto_publish: bool = True
    check_interval_minutes: int = 10
    fetch_count: int = 20
    hashtag_category_map: Optional[Dict[str, int]] = None


class VKIntegrationUpdate(BaseModel):
    group_id: Optional[str] = None
    access_token: Optional[str] = None
    mode: Optional[str] = None
    default_category_id: Optional[int] = None
    auto_publish: Optional[bool] = None
    check_interval_minutes: Optional[int] = None
    fetch_count: Optional[int] = None
    hashtag_category_map: Optional[Dict[str, int]] = None


class VKIntegrationResponse(BaseModel):
    id: int
    group_id: str
    mode: str = "off"
    default_category_id: Optional[int] = None
    auto_publish: bool
    check_interval_minutes: int
    fetch_count: int = 20
    hashtag_category_map: Optional[Dict[str, int]] = None
    last_checked_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    imported_count: int = 0
    has_token: bool = False

    class Config:
        from_attributes = True


class VKImportedPostResponse(BaseModel):
    id: int
    vk_post_id: int
    news_id: Optional[int] = None
    vk_post_date: Optional[datetime] = None
    imported_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VKTestResult(BaseModel):
    success: bool
    group_name: Optional[str] = None
    posts_count: Optional[int] = None
    error: Optional[str] = None


# --- Helpers ---

def extract_hashtags(text: str) -> list[str]:
    """Extract hashtags from VK post text."""
    return re.findall(r'#(\w+)', text)


def clean_vk_text(text: str) -> str:
    """Clean VK post text for use as news content, preserving structure."""
    text = re.sub(r'\[club\d+\|([^\]]+)\]', r'\1', text)
    text = re.sub(r'\[id\d+\|([^\]]+)\]', r'\1', text)
    return text.strip()


def make_title_from_text(text: str, max_len: int = 150) -> str:
    """Generate a title from post text."""
    clean = clean_vk_text(text)
    clean = re.sub(r'#\w+', '', clean).strip()
    first_line = clean.split('\n')[0].strip()
    if len(first_line) > max_len:
        first_line = first_line[:max_len].rsplit(' ', 1)[0] + '...'
    return first_line if first_line else 'Пост ВКонтакте'


async def determine_category(
    text: str,
    hashtag_map: Optional[Dict[str, int]],
    default_category_id: Optional[int],
    db: AsyncSession
) -> Optional[int]:
    """Determine news category from hashtags or use default."""
    if hashtag_map:
        hashtags = extract_hashtags(text)
        for tag in hashtags:
            tag_lower = tag.lower()
            for map_tag, cat_id in hashtag_map.items():
                if map_tag.lstrip('#').lower() == tag_lower:
                    cat = await db.get(NewsCategory, cat_id)
                    if cat:
                        return cat_id
    return default_category_id


async def fetch_vk_posts(group_id: str, access_token: str, count: int = 20) -> dict:
    """Fetch posts from VK API."""
    url = "https://api.vk.com/method/wall.get"
    params: dict = {
        "count": count,
        "access_token": access_token,
        "v": VK_API_VERSION,
    }
    if group_id.isdigit():
        params["owner_id"] = f"-{group_id}"
    else:
        params["domain"] = group_id
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)
        return resp.json()


async def resolve_group_id(group_id: str, access_token: str) -> Optional[str]:
    """Resolve VK group short name to numeric ID."""
    if group_id.isdigit():
        return group_id
    url = "https://api.vk.com/method/groups.getById"
    params = {
        "group_id": group_id,
        "access_token": access_token,
        "v": VK_API_VERSION,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        data = resp.json()
    if "response" in data and "groups" in data["response"]:
        groups = data["response"]["groups"]
        if groups:
            return str(groups[0]["id"])
    if "response" in data and isinstance(data["response"], list) and data["response"]:
        return str(data["response"][0]["id"])
    return None


async def ensure_unique_slug(slug: str, db: AsyncSession) -> str:
    """Ensure slug is unique in news table."""
    base_slug = slug
    counter = 1
    while True:
        result = await db.execute(select(News).where(News.slug == slug))
        if not result.scalar_one_or_none():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


async def import_vk_post(
    post: dict,
    integration: VKIntegration,
    db: AsyncSession
) -> Optional[News]:
    """Import a single VK post as a News article."""
    post_id = post["id"]
    text = post.get("text", "")
    if not text:
        return None

    existing_result = await db.execute(
        select(VKImportedPost).where(
            VKImportedPost.vk_post_id == post_id,
            VKImportedPost.vk_integration_id == integration.id
        )
    )
    existing_record = existing_result.scalar_one_or_none()
    if existing_record:
        if existing_record.news_id:
            news_check = await db.get(News, existing_record.news_id)
            if news_check:
                return None
        await db.delete(existing_record)
        await db.flush()

    hashtag_map = None
    if integration.hashtag_category_map:
        try:
            hashtag_map = json.loads(integration.hashtag_category_map) if isinstance(
                integration.hashtag_category_map, str
            ) else integration.hashtag_category_map
        except (json.JSONDecodeError, TypeError):
            hashtag_map = None

    category_id = await determine_category(text, hashtag_map, integration.default_category_id, db)

    title = make_title_from_text(text)
    content = clean_vk_text(text)
    content_html = content.replace('\n', '<br/>')

    featured_image = None
    gallery_images = []
    video_url = None
    attachments = post.get("attachments", [])
    for att in attachments:
        if att["type"] == "photo":
            sizes = att["photo"].get("sizes", [])
            if sizes:
                best = max(sizes, key=lambda s: s.get("width", 0) * s.get("height", 0))
                img_url = best.get("url", "")
                if img_url:
                    if not featured_image:
                        featured_image = img_url
                    else:
                        gallery_images.append(img_url)
        elif att["type"] == "video" and not video_url:
            video = att["video"]
            player_url = video.get("player")
            if player_url:
                video_url = player_url
            else:
                owner_id = video.get("owner_id", "")
                vid_id = video.get("id", "")
                access_key = video.get("access_key", "")
                if owner_id and vid_id:
                    video_url = f"https://vk.com/video_ext.php?oid={owner_id}&id={vid_id}"
                    if access_key:
                        video_url += f"&hash={access_key}"
                    video_url += "&hd=2"
            thumb_images = video.get("image") or video.get("photo") or []
            if thumb_images and not featured_image:
                best_thumb = max(thumb_images, key=lambda t: t.get("width", 0) * t.get("height", 0))
                featured_image = best_thumb.get("url", "")

    gallery_json = json.dumps(gallery_images) if gallery_images else None

    post_date = datetime.fromtimestamp(post["date"], tz=MOSCOW_TZ).replace(tzinfo=None)

    slug = generate_slug(title)
    if not slug:
        slug = f"vk-post-{post_id}"
    slug = await ensure_unique_slug(slug, db)

    news = News(
        title=title,
        slug=slug,
        excerpt=content[:300] if len(content) > 300 else content,
        content=content_html,
        featured_image=featured_image,
        video_url=video_url,
        gallery=gallery_json,
        category_id=category_id,
        is_published=integration.auto_publish,
        is_featured=integration.auto_publish,
        publish_date=post_date if integration.auto_publish else None,
        created_at=post_date,
    )
    db.add(news)
    await db.flush()

    imported = VKImportedPost(
        vk_post_id=post_id,
        vk_integration_id=integration.id,
        news_id=news.id,
        vk_post_date=post_date,
    )
    db.add(imported)

    return news


# --- Background task ---

async def vk_fetch_task():
    """Background task: periodically fetch new VK posts."""
    from app.database import async_session_maker

    while True:
        try:
            await asyncio.sleep(60)
            async with async_session_maker() as session:
                result = await session.execute(
                    select(VKIntegration).where(VKIntegration.mode == "auto")
                )
                integrations = result.scalars().all()

                for integration in integrations:
                    now = datetime.now(MOSCOW_TZ)
                    if integration.last_checked_at:
                        elapsed = (now - integration.last_checked_at.replace(
                            tzinfo=MOSCOW_TZ if integration.last_checked_at.tzinfo is None else None
                        )).total_seconds() / 60
                        if elapsed < integration.check_interval_minutes:
                            continue

                    try:
                        count = integration.fetch_count or 20
                        data = await fetch_vk_posts(integration.group_id, integration.access_token, count=count)
                        if "error" in data:
                            logger.error(f"VK API error for group {integration.group_id}: {data['error']}")
                            continue

                        posts = data.get("response", {}).get("items", [])
                        imported_count = 0
                        for post in posts:
                            if post.get("marked_as_ads"):
                                continue
                            news = await import_vk_post(post, integration, session)
                            if news:
                                imported_count += 1

                        integration.last_checked_at = now.replace(tzinfo=None)
                        await session.commit()

                        if imported_count > 0:
                            logger.info(
                                f"VK: imported {imported_count} posts from group {integration.group_id}"
                            )
                    except Exception as e:
                        logger.error(f"VK fetch error for group {integration.group_id}: {e}")
                        await session.rollback()

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"VK fetch task error: {e}")


import asyncio


# --- API Endpoints ---

@router.get("", response_model=Optional[VKIntegrationResponse])
async def get_vk_integration(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    """Get current VK integration settings."""
    result = await db.execute(select(VKIntegration).limit(1))
    integration = result.scalar_one_or_none()
    if not integration:
        return None

    imported_count = await _get_imported_count(integration.id, db)
    return await _build_response(integration, imported_count)


async def _parse_hashtag_map(integration: VKIntegration) -> Optional[Dict[str, int]]:
    if integration.hashtag_category_map:
        try:
            return json.loads(integration.hashtag_category_map) if isinstance(
                integration.hashtag_category_map, str
            ) else integration.hashtag_category_map
        except (json.JSONDecodeError, TypeError):
            pass
    return None


async def _build_response(integration: VKIntegration, imported_count: int = 0) -> VKIntegrationResponse:
    hashtag_map = await _parse_hashtag_map(integration)
    return VKIntegrationResponse(
        id=integration.id,
        group_id=integration.group_id,
        mode=integration.mode or "off",
        default_category_id=integration.default_category_id,
        auto_publish=integration.auto_publish,
        check_interval_minutes=integration.check_interval_minutes,
        fetch_count=integration.fetch_count or 20,
        hashtag_category_map=hashtag_map,
        last_checked_at=integration.last_checked_at,
        created_at=integration.created_at,
        updated_at=integration.updated_at,
        imported_count=imported_count,
        has_token=bool(integration.access_token),
    )


async def _get_imported_count(integration_id: int, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count(VKImportedPost.id)).where(
            VKImportedPost.vk_integration_id == integration_id
        )
    )
    return result.scalar() or 0


@router.post("", response_model=VKIntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_vk_integration(
    data: VKIntegrationCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    """Create or replace VK integration settings (only one allowed)."""
    existing = await db.execute(select(VKIntegration).limit(1))
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)
        await db.flush()

    hashtag_json = json.dumps(data.hashtag_category_map) if data.hashtag_category_map else None

    integration = VKIntegration(
        group_id=data.group_id,
        access_token=data.access_token,
        mode=data.mode,
        default_category_id=data.default_category_id,
        auto_publish=data.auto_publish,
        check_interval_minutes=data.check_interval_minutes,
        fetch_count=data.fetch_count,
        hashtag_category_map=hashtag_json,
    )
    db.add(integration)
    await db.flush()
    await db.refresh(integration)
    return await _build_response(integration, 0)


@router.put("", response_model=VKIntegrationResponse)
async def update_vk_integration(
    data: VKIntegrationUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    """Update VK integration settings."""
    result = await db.execute(select(VKIntegration).limit(1))
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(status_code=404, detail="VK integration not configured")

    if data.group_id is not None:
        integration.group_id = data.group_id
    if data.access_token is not None:
        integration.access_token = data.access_token
    if data.default_category_id is not None:
        integration.default_category_id = data.default_category_id
    if data.mode is not None and data.mode in ("off", "auto", "manual"):
        integration.mode = data.mode
    if data.auto_publish is not None:
        integration.auto_publish = data.auto_publish
    if data.check_interval_minutes is not None:
        integration.check_interval_minutes = data.check_interval_minutes
    if data.fetch_count is not None:
        integration.fetch_count = max(1, min(100, data.fetch_count))
    if data.hashtag_category_map is not None:
        integration.hashtag_category_map = json.dumps(data.hashtag_category_map)

    await db.flush()
    await db.refresh(integration)

    imported_count = await _get_imported_count(integration.id, db)
    return await _build_response(integration, imported_count)


@router.patch("/mode/{new_mode}", response_model=VKIntegrationResponse)
async def set_vk_mode(
    new_mode: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    """Set VK integration mode: off, auto, manual."""
    if new_mode not in ("off", "auto", "manual"):
        raise HTTPException(status_code=400, detail="Mode must be: off, auto, manual")

    result = await db.execute(select(VKIntegration).limit(1))
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(status_code=404, detail="VK integration not configured")

    integration.mode = new_mode
    integration.is_enabled = new_mode != "off"
    await db.flush()
    await db.refresh(integration)

    imported_count = await _get_imported_count(integration.id, db)
    return await _build_response(integration, imported_count)


@router.post("/test", response_model=VKTestResult)
async def test_vk_connection(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    """Test VK API connection with current settings."""
    result = await db.execute(select(VKIntegration).limit(1))
    integration = result.scalar_one_or_none()
    if not integration:
        return VKTestResult(success=False, error="VK integration not configured")

    try:
        data = await fetch_vk_posts(integration.group_id, integration.access_token, count=1)
        if "error" in data:
            error_msg = data["error"].get("error_msg", "Unknown VK API error")
            return VKTestResult(success=False, error=error_msg)

        response = data.get("response", {})
        total = response.get("count", 0)

        numeric_id = await resolve_group_id(integration.group_id, integration.access_token)
        group_name = integration.group_id
        if numeric_id:
            url = "https://api.vk.com/method/groups.getById"
            params = {
                "group_id": numeric_id,
                "access_token": integration.access_token,
                "v": VK_API_VERSION,
            }
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, params=params)
                gdata = resp.json()
            if "response" in gdata:
                groups = gdata["response"].get("groups", gdata["response"] if isinstance(gdata["response"], list) else [])
                if groups:
                    group_name = groups[0].get("name", integration.group_id)

        return VKTestResult(success=True, group_name=group_name, posts_count=total)
    except Exception as e:
        return VKTestResult(success=False, error=str(e))


@router.post("/fetch-now")
async def fetch_now(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    """Manually trigger VK post fetch."""
    result = await db.execute(select(VKIntegration).limit(1))
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(status_code=404, detail="VK integration not configured")
    if integration.mode == "off":
        raise HTTPException(status_code=400, detail="Интеграция выключена. Выберите режим Авто или Вручную.")

    try:
        count = integration.fetch_count or 20
        data = await fetch_vk_posts(integration.group_id, integration.access_token, count=count)
        if "error" in data:
            error_msg = data["error"].get("error_msg", "Unknown error")
            raise HTTPException(status_code=400, detail=f"VK API: {error_msg}")

        posts = data.get("response", {}).get("items", [])
        imported_count = 0
        for post in posts:
            if post.get("marked_as_ads"):
                continue
            news = await import_vk_post(post, integration, db)
            if news:
                imported_count += 1

        integration.last_checked_at = datetime.now(MOSCOW_TZ).replace(tzinfo=None)
        await db.flush()

        return {"imported": imported_count, "total_checked": len(posts)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/imported", response_model=List[VKImportedPostResponse])
async def list_imported_posts(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    """List recently imported VK posts."""
    result = await db.execute(
        select(VKImportedPost)
        .order_by(VKImportedPost.imported_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.delete("/imported")
async def delete_all_imported(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    """Delete all imported VK posts and their news articles."""
    result = await db.execute(select(VKImportedPost))
    imported_posts = result.scalars().all()

    deleted_news = 0
    for post in imported_posts:
        if post.news_id:
            news = await db.get(News, post.news_id)
            if news:
                await db.delete(news)
                deleted_news += 1
        await db.delete(post)

    await db.flush()
    return {"deleted_news": deleted_news, "deleted_records": len(imported_posts)}


@router.delete("")
async def delete_vk_integration(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    """Delete VK integration settings."""
    result = await db.execute(select(VKIntegration).limit(1))
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(status_code=404, detail="VK integration not configured")

    await db.delete(integration)
    return {"detail": "VK integration deleted"}
