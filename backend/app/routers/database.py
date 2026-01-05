"""Database management router for super admins."""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, inspect
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import json
import io

from app.database import get_db, engine
from app.models.user import User
from app.dependencies import get_current_super_admin

router = APIRouter(prefix="/database", tags=["Database Management"])


class SQLQueryRequest(BaseModel):
    """SQL query request."""
    query: str
    params: Optional[Dict[str, Any]] = None


class TableDataUpdate(BaseModel):
    """Update table data request."""
    table_name: str
    row_id: int
    column: str
    value: Any


class TableRowDelete(BaseModel):
    """Delete table row request."""
    table_name: str
    row_id: int


# Allowed tables for direct manipulation (security)
ALLOWED_TABLES = [
    'users', 'news', 'news_categories', 'tags', 'news_tags',
    'teams', 'team_members', 'seasons', 'competitions',
    'partners', 'partner_categories', 'archive_seasons', 'archive_media',
    'contact_messages', 'site_settings', 'admin_logs',
    'email_logs', 'mass_mailing_campaigns', 'registration_fields'
]


@router.get("/tables")
async def list_tables(
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get list of all database tables with row counts."""
    tables = []
    
    for table_name in ALLOWED_TABLES:
        try:
            result = await db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            count = result.scalar() or 0
            tables.append({
                "name": table_name,
                "row_count": count
            })
        except Exception:
            # Table might not exist yet
            pass
    
    return {"tables": tables}


@router.get("/tables/{table_name}")
async def get_table_data(
    table_name: str,
    page: int = 1,
    limit: int = 50,
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get data from a specific table with pagination."""
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Таблица не разрешена для просмотра")
    
    offset = (page - 1) * limit
    
    # Get total count
    count_result = await db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
    total = count_result.scalar() or 0
    
    # Get data
    result = await db.execute(
        text(f"SELECT * FROM {table_name} ORDER BY id DESC LIMIT :limit OFFSET :offset"),
        {"limit": limit, "offset": offset}
    )
    
    rows = result.fetchall()
    columns = result.keys()
    
    # Convert to list of dicts
    data = []
    for row in rows:
        row_dict = {}
        for i, col in enumerate(columns):
            value = row[i]
            # Convert datetime to string for JSON
            if isinstance(value, datetime):
                value = value.isoformat()
            row_dict[col] = value
        data.append(row_dict)
    
    return {
        "table": table_name,
        "columns": list(columns),
        "data": data,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/tables/{table_name}/structure")
async def get_table_structure(
    table_name: str,
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get table structure (columns, types)."""
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Таблица не разрешена")
    
    result = await db.execute(text(f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = :table_name
        ORDER BY ordinal_position
    """), {"table_name": table_name})
    
    columns = []
    for row in result.fetchall():
        columns.append({
            "name": row[0],
            "type": row[1],
            "nullable": row[2] == 'YES',
            "default": row[3]
        })
    
    return {"table": table_name, "columns": columns}


@router.put("/tables/{table_name}/{row_id}")
async def update_table_row(
    table_name: str,
    row_id: int,
    data: Dict[str, Any],
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a row in a table."""
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Таблица не разрешена для редактирования")
    
    # Build SET clause
    set_parts = []
    params = {"id": row_id}
    
    for key, value in data.items():
        if key != 'id':  # Don't update ID
            set_parts.append(f"{key} = :{key}")
            params[key] = value
    
    if not set_parts:
        raise HTTPException(status_code=400, detail="Нет данных для обновления")
    
    query = f"UPDATE {table_name} SET {', '.join(set_parts)} WHERE id = :id"
    
    try:
        await db.execute(text(query), params)
        await db.commit()
        return {"message": "Запись обновлена", "id": row_id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")


@router.delete("/tables/{table_name}/{row_id}")
async def delete_table_row(
    table_name: str,
    row_id: int,
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a row from a table."""
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Таблица не разрешена для удаления")
    
    # Prevent deleting super admin
    if table_name == 'users':
        result = await db.execute(
            text("SELECT role FROM users WHERE id = :id"),
            {"id": row_id}
        )
        user = result.fetchone()
        if user and user[0] == 'SUPER_ADMIN':
            raise HTTPException(status_code=403, detail="Нельзя удалить супер-админа")
    
    try:
        await db.execute(text(f"DELETE FROM {table_name} WHERE id = :id"), {"id": row_id})
        await db.commit()
        return {"message": "Запись удалена", "id": row_id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")


@router.post("/query")
async def execute_query(
    request: SQLQueryRequest,
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Execute a raw SQL query (SELECT only for safety)."""
    query = request.query.strip().upper()
    
    # Only allow SELECT queries for safety
    if not query.startswith('SELECT'):
        raise HTTPException(
            status_code=400, 
            detail="Разрешены только SELECT запросы. Для изменения данных используйте другие endpoints."
        )
    
    # Block dangerous keywords
    dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE']
    for word in dangerous:
        if word in query:
            raise HTTPException(status_code=400, detail=f"Запрещённое ключевое слово: {word}")
    
    try:
        result = await db.execute(text(request.query), request.params or {})
        rows = result.fetchall()
        columns = list(result.keys())
        
        data = []
        for row in rows:
            row_dict = {}
            for i, col in enumerate(columns):
                value = row[i]
                if isinstance(value, datetime):
                    value = value.isoformat()
                row_dict[col] = value
            data.append(row_dict)
        
        return {
            "columns": columns,
            "data": data,
            "row_count": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка выполнения запроса: {str(e)}")


@router.get("/backup")
async def create_backup(
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a JSON backup of all tables."""
    backup_data = {
        "created_at": datetime.utcnow().isoformat(),
        "created_by": admin.email,
        "tables": {}
    }
    
    for table_name in ALLOWED_TABLES:
        try:
            result = await db.execute(text(f"SELECT * FROM {table_name}"))
            rows = result.fetchall()
            columns = list(result.keys())
            
            table_data = []
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    if isinstance(value, datetime):
                        value = value.isoformat()
                    row_dict[col] = value
                table_data.append(row_dict)
            
            backup_data["tables"][table_name] = {
                "columns": columns,
                "data": table_data,
                "row_count": len(table_data)
            }
        except Exception as e:
            backup_data["tables"][table_name] = {"error": str(e)}
    
    # Create JSON file
    json_data = json.dumps(backup_data, ensure_ascii=False, indent=2)
    
    filename = f"eurobot_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    
    return Response(
        content=json_data,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/stats")
async def get_database_stats(
    admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get database statistics."""
    stats = {
        "tables": {},
        "total_rows": 0,
        "database_size": None
    }
    
    for table_name in ALLOWED_TABLES:
        try:
            result = await db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            count = result.scalar() or 0
            stats["tables"][table_name] = count
            stats["total_rows"] += count
        except:
            pass
    
    # Get database size (PostgreSQL specific)
    try:
        result = await db.execute(text("SELECT pg_size_pretty(pg_database_size(current_database()))"))
        stats["database_size"] = result.scalar()
    except:
        pass
    
    return stats


