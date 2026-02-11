// User types
export type UserRole = 'guest' | 'user' | 'admin' | 'super_admin'

export interface User {
  id: number
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login: string | null
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

// News types
export interface NewsCategory {
  id: number
  name: string
  slug: string
  type: 'announcements' | 'results' | 'instructions' | 'events'
}

export interface NewsTag {
  id: number
  name: string
  slug: string
}

export interface News {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  video_url: string | null
  gallery: string | null
  category: NewsCategory | null
  tags: NewsTag[]
  is_published: boolean
  is_featured: boolean
  publish_date: string | null
  views_count: number
  author_id: number | null
  created_at: string
  updated_at: string | null
  meta_title: string | null
  meta_description: string | null
}

export interface NewsListResponse {
  items: News[]
  total: number
  page: number
  pages: number
}

// Partner types
export type PartnerCategory = 'general' | 'official' | 'technology' | 'educational' | 'media'

export interface Partner {
  id: number
  name: string
  category: PartnerCategory
  logo: string
  website: string | null
  description: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string | null
}

// Team types
export type TeamStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'
export type League = 'junior' | 'senior'

export interface TeamMember {
  id: number
  full_name: string
  role: string | null
  email: string | null
  phone: string | null
  created_at: string
}

export interface Team {
  id: number
  name: string
  email: string
  phone: string
  organization: string
  city: string | null
  region: string | null
  participants_count: number
  league: League
  poster_link: string | null
  status: TeamStatus
  rules_accepted: boolean
  season_id: number
  user_id: number | null
  members: TeamMember[]
  notes: string | null
  created_at: string
  updated_at: string | null
}

export interface TeamListResponse {
  items: Team[]
  total: number
  page: number
  pages: number
}

// Season types
export interface RegistrationField {
  id: number
  season_id: number
  name: string
  label: string
  field_type: string
  options: unknown[] | null
  is_required: boolean
  display_order: number
  is_active: boolean
}

export interface Competition {
  id: number
  season_id: number
  name: string
  description: string | null
  rules_file: string | null
  field_files: string[] | null
  vinyl_files: string[] | null
  drawings_3d: string[] | null
  registration_link: string | null
  external_link: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface Season {
  id: number
  year: number
  name: string
  theme: string | null
  registration_open: boolean
  registration_start: string | null
  registration_end: string | null
  competition_date_start: string | null
  competition_date_end: string | null
  location: string | null
  format: string | null
  show_dates: boolean
  show_location: boolean
  show_format: boolean
  show_registration_deadline: boolean
  is_current: boolean
  is_archived: boolean
  competitions: Competition[]
  registration_fields: RegistrationField[]
  created_at: string
  updated_at: string | null
}

// Archive types
export type MediaType = 'photo' | 'video' | 'document'

export interface ArchiveMedia {
  id: number
  archive_season_id: number
  title: string | null
  description: string | null
  media_type: MediaType
  file_path: string
  thumbnail: string | null
  video_url: string | null
  duration: number | null
  display_order: number
  created_at: string
}

export interface ArchiveSeason {
  id: number
  year: number
  name: string
  theme: string | null
  description: string | null
  cover_image: string | null
  first_place: string | null
  second_place: string | null
  third_place: string | null
  additional_info: string | null
  teams_count: number | null
  media: ArchiveMedia[]
  created_at: string
  updated_at: string | null
}

// Contact types
export type ContactTopic = 'technical' | 'registration' | 'sponsorship' | 'press' | 'other'

export interface ContactMessage {
  id: number
  name: string
  email: string
  phone: string | null
  topic: ContactTopic
  message: string
  is_read: boolean
  is_replied: boolean
  replied_at: string | null
  replied_by: number | null
  created_at: string
}

export interface ContactMessageListResponse {
  items: ContactMessage[]
  total: number
  page: number
  pages: number
}

// Settings types
export interface SiteSettings {
  [key: string]: string | object | null
}

// Admin dashboard types
export interface DashboardStats {
  totals: {
    teams: number
    news: number
    partners: number
    messages: number
    users: number
  }
  pending: {
    teams: number
    messages: number
  }
  recent: {
    teams_week: number
  }
  current_season: {
    id: number | null
    name: string | null
    registration_open: boolean
  } | null
}

export interface FormatStructure {
  logo_url: string;
  title_url: string;
  icon_url?: string;
  tasks: string[];
  documents: Array<{
    url: string;
    name: string;
  }>;
}


export interface ArchiveSeasonDescriptionData {
  mainDescription?: string;
  logoUrl?: string;
  titleImageUrl?: string;
  [key: string]: any;
}