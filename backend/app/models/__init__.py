"""Database models."""
from app.models.user import User
from app.models.news import News, NewsCategory, NewsTag
from app.models.partner import Partner, PartnerCategory
from app.models.team import Team, TeamMember
from app.models.competition import Competition, Season, RegistrationField
from app.models.archive import ArchiveSeason, ArchiveMedia
from app.models.contact import ContactMessage
from app.models.settings import SiteSettings
from app.models.admin_log import AdminLog
from app.models.email_log import EmailLog, MassMailingCampaign
from app.models.vk_integration import VKIntegration, VKImportedPost

__all__ = [
    "User",
    "News", "NewsCategory", "NewsTag",
    "Partner", "PartnerCategory",
    "Team", "TeamMember",
    "Competition", "Season", "RegistrationField",
    "ArchiveSeason", "ArchiveMedia",
    "ContactMessage",
    "SiteSettings",
    "AdminLog",
    "EmailLog", "MassMailingCampaign",
    "VKIntegration", "VKImportedPost"
]




