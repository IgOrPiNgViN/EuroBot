"""Pydantic schemas for API validation."""
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserLogin, Token, TokenPayload
from app.schemas.news import NewsCreate, NewsUpdate, NewsResponse, NewsCategoryResponse, NewsTagResponse
from app.schemas.partner import PartnerCreate, PartnerUpdate, PartnerResponse
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamMemberCreate, TeamMemberResponse
from app.schemas.competition import (
    SeasonCreate, SeasonUpdate, SeasonResponse,
    CompetitionCreate, CompetitionUpdate, CompetitionResponse,
    RegistrationFieldCreate, RegistrationFieldResponse
)
from app.schemas.archive import ArchiveSeasonCreate, ArchiveSeasonResponse, ArchiveMediaCreate, ArchiveMediaResponse
from app.schemas.contact import ContactMessageCreate, ContactMessageResponse
from app.schemas.settings import SettingsUpdate, SettingsResponse

__all__ = [
    "UserCreate", "UserUpdate", "UserResponse", "UserLogin", "Token", "TokenPayload",
    "NewsCreate", "NewsUpdate", "NewsResponse", "NewsCategoryResponse", "NewsTagResponse",
    "PartnerCreate", "PartnerUpdate", "PartnerResponse",
    "TeamCreate", "TeamUpdate", "TeamResponse", "TeamMemberCreate", "TeamMemberResponse",
    "SeasonCreate", "SeasonUpdate", "SeasonResponse",
    "CompetitionCreate", "CompetitionUpdate", "CompetitionResponse",
    "RegistrationFieldCreate", "RegistrationFieldResponse",
    "ArchiveSeasonCreate", "ArchiveSeasonResponse", "ArchiveMediaCreate", "ArchiveMediaResponse",
    "ContactMessageCreate", "ContactMessageResponse",
    "SettingsUpdate", "SettingsResponse"
]





