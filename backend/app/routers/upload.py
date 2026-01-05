"""File upload router."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from typing import List
import os
import uuid
import aiofiles
from datetime import datetime

from app.models.user import User
from app.dependencies import get_current_admin
from app.config import settings

router = APIRouter(prefix="/upload", tags=["Upload"])

# Allowed file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "application/msword", 
                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
ALLOWED_ARCHIVE_TYPES = {"application/zip", "application/x-rar-compressed"}
ALLOWED_3D_TYPES = {"model/stl", "application/octet-stream"}  # STL files

ALL_ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_DOCUMENT_TYPES | ALLOWED_ARCHIVE_TYPES | ALLOWED_3D_TYPES


def get_upload_path(subfolder: str = "") -> str:
    """Get upload directory path."""
    base_path = os.path.abspath(settings.UPLOAD_DIR)
    if subfolder:
        path = os.path.join(base_path, subfolder)
    else:
        path = base_path
    
    os.makedirs(path, exist_ok=True)
    return path


def generate_filename(original_filename: str) -> str:
    """Generate unique filename."""
    ext = os.path.splitext(original_filename)[1].lower()
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}{ext}"


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin)
):
    """Upload image file (admin only)."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимый тип файла. Разрешены: JPEG, PNG, GIF, WebP"
        )
    
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл слишком большой. Максимум: {settings.MAX_FILE_SIZE // 1024 // 1024}MB"
        )
    
    filename = generate_filename(file.filename)
    filepath = os.path.join(get_upload_path("images"), filename)
    
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    return {"url": f"/uploads/images/{filename}", "filename": filename}


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin)
):
    """Upload document file (admin only)."""
    if file.content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимый тип файла. Разрешены: PDF, DOC, DOCX"
        )
    
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл слишком большой. Максимум: {settings.MAX_FILE_SIZE // 1024 // 1024}MB"
        )
    
    filename = generate_filename(file.filename)
    filepath = os.path.join(get_upload_path("documents"), filename)
    
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    return {"url": f"/uploads/documents/{filename}", "filename": filename}


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin)
):
    """Upload any allowed file (admin only)."""
    # Allow any file type for flexibility (3D models, etc.)
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл слишком большой. Максимум: {settings.MAX_FILE_SIZE // 1024 // 1024}MB"
        )
    
    filename = generate_filename(file.filename)
    filepath = os.path.join(get_upload_path("files"), filename)
    
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    return {"url": f"/uploads/files/{filename}", "filename": filename}


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
        if file.size and file.size > settings.MAX_FILE_SIZE:
            results.append({"filename": file.filename, "error": "Файл слишком большой"})
            continue
        
        filename = generate_filename(file.filename)
        filepath = os.path.join(get_upload_path("files"), filename)
        
        async with aiofiles.open(filepath, "wb") as f:
            content = await file.read()
            await f.write(content)
        
        results.append({
            "original": file.filename,
            "url": f"/uploads/files/{filename}",
            "filename": filename
        })
    
    return {"files": results}


@router.delete("/{filepath:path}")
async def delete_file(
    filepath: str,
    admin: User = Depends(get_current_admin)
):
    """Delete uploaded file (admin only)."""
    full_path = os.path.join(settings.UPLOAD_DIR, filepath)
    
    if not os.path.exists(full_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден"
        )
    
    os.remove(full_path)
    return {"message": "Файл удален"}





