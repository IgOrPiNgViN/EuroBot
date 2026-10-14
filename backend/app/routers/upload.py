"""File upload router.

Файлы, загруженные через админ-панель, сохраняются в UPLOAD_DIR на сервере
бэкенда и раздаются по адресу /uploads/<папка>/<имя> (nginx / proxy.php
проксируют /uploads на бэкенд), поэтому полученную ссылку можно сразу
сохранять в любое поле сайта.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from typing import List, Optional
import os
import re
import uuid
import aiofiles
from datetime import datetime

from app.models.user import User
from app.dependencies import get_current_admin
from app.config import settings
from app.utils.slug import transliterate

router = APIRouter(prefix="/upload", tags=["Upload"])

# Разрешённые расширения по папкам. Проверяем расширение, а не только
# Content-Type: браузеры часто присылают application/octet-stream для
# .stl, .step, .rar и т.п.
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico", ".avif"}
DOCUMENT_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".odt", ".ods", ".odp", ".rtf", ".txt", ".csv",
}
OTHER_EXTENSIONS = {
    ".zip", ".rar", ".7z",
    ".stl", ".step", ".stp", ".dxf", ".dwg", ".f3d",
    ".mp4", ".webm", ".mov", ".mp3",
}

FOLDERS = {
    "images": IMAGE_EXTENSIONS,
    "documents": DOCUMENT_EXTENSIONS,
    "files": IMAGE_EXTENSIONS | DOCUMENT_EXTENSIONS | OTHER_EXTENSIONS,
}

# Признаки активного содержимого в SVG (защита от XSS через загруженный логотип)
SVG_DANGEROUS = re.compile(rb"<script|javascript:|\son\w+\s*=|<foreignObject|<iframe|<embed|<object", re.IGNORECASE)


def get_upload_path(subfolder: str = "") -> str:
    """Get upload directory path."""
    base_path = os.path.abspath(settings.UPLOAD_DIR)
    if subfolder:
        path = os.path.join(base_path, subfolder)
    else:
        path = base_path

    os.makedirs(path, exist_ok=True)
    return path


def generate_filename(original_filename: Optional[str]) -> str:
    """Generate unique, human-readable filename (транслит исходного имени + короткий id)."""
    original_filename = original_filename or "file"
    stem, ext = os.path.splitext(os.path.basename(original_filename))
    stem = transliterate(stem).lower()
    stem = re.sub(r"[^a-z0-9_-]+", "-", stem).strip("-_")[:60] or "file"
    unique_id = uuid.uuid4().hex[:8]
    return f"{stem}_{unique_id}{ext.lower()}"


def _size_limit_mb() -> int:
    return settings.MAX_FILE_SIZE // 1024 // 1024


async def save_upload(file: UploadFile, folder: str) -> dict:
    """Validate and save an uploaded file into UPLOAD_DIR/<folder>."""
    allowed = FOLDERS[folder]
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимый тип файла «{ext or 'без расширения'}». "
                   f"Разрешены: {', '.join(sorted(e.lstrip('.') for e in allowed))}"
        )

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Файл слишком большой. Максимум: {_size_limit_mb()} МБ"
        )
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Файл пустой")

    if ext == ".svg" and SVG_DANGEROUS.search(content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SVG содержит скрипты или встроенные объекты — пересохраните его как обычное изображение"
        )

    filename = generate_filename(file.filename)
    filepath = os.path.join(get_upload_path(folder), filename)
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    return {
        "url": f"/uploads/{folder}/{filename}",
        "filename": filename,
        "original": file.filename,
        "size": len(content),
    }


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin)
):
    """Upload image file (admin only)."""
    return await save_upload(file, "images")


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin)
):
    """Upload document file (admin only)."""
    return await save_upload(file, "documents")


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin)
):
    """Upload any allowed file: archives, 3D models, video, etc. (admin only)."""
    return await save_upload(file, "files")


@router.post("/batch")
async def upload_batch(
    files: List[UploadFile] = File(...),
    admin: User = Depends(get_current_admin)
):
    """Upload multiple files (admin only)."""
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Максимум 10 файлов за раз"
        )

    results = []
    for file in files:
        try:
            results.append(await save_upload(file, "files"))
        except HTTPException as e:
            results.append({"original": file.filename, "error": e.detail})

    return {"files": results}


@router.get("/files")
async def list_files(
    folder: Optional[str] = Query(None, description="images | documents | files"),
    admin: User = Depends(get_current_admin)
):
    """List uploaded files, newest first (admin only)."""
    if folder is not None and folder not in FOLDERS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неизвестная папка")

    items = []
    for name in ([folder] if folder else list(FOLDERS)):
        path = os.path.join(os.path.abspath(settings.UPLOAD_DIR), name)
        if not os.path.isdir(path):
            continue
        for entry in os.scandir(path):
            if not entry.is_file():
                continue
            stat = entry.stat()
            items.append({
                "url": f"/uploads/{name}/{entry.name}",
                "path": f"{name}/{entry.name}",
                "filename": entry.name,
                "folder": name,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "is_image": os.path.splitext(entry.name)[1].lower() in IMAGE_EXTENSIONS,
            })

    items.sort(key=lambda i: i["modified"], reverse=True)
    return {"files": items}


@router.delete("/{filepath:path}")
async def delete_file(
    filepath: str,
    admin: User = Depends(get_current_admin)
):
    """Delete uploaded file (admin only)."""
    # Принимаем как "images/x.png", так и "/uploads/images/x.png"
    filepath = filepath.lstrip("/")
    if filepath.startswith("uploads/"):
        filepath = filepath[len("uploads/"):]

    base = os.path.abspath(settings.UPLOAD_DIR)
    full_path = os.path.abspath(os.path.join(base, filepath))
    if os.path.commonpath([base, full_path]) != base or full_path == base:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Недопустимый путь")

    if not os.path.isfile(full_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден"
        )

    os.remove(full_path)
    return {"message": "Файл удален"}
