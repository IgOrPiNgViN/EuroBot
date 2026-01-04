"""Admin activity log model."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class AdminLog(Base):
    """Admin activity logging model."""
    __tablename__ = "admin_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    action = Column(String(100), nullable=False)  # create, update, delete, etc.
    entity_type = Column(String(100), nullable=False)  # news, team, partner, etc.
    entity_id = Column(Integer, nullable=True)
    
    details = Column(Text, nullable=True)  # JSON with action details
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<AdminLog {self.action} {self.entity_type}>"



