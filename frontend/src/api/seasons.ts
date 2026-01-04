import apiClient from './client'
import { Season, Competition, RegistrationField } from '../types'

export interface SeasonCreateData {
  year: number
  name: string
  theme?: string
  registration_open?: boolean
  registration_start?: string
  registration_end?: string
  competition_date_start?: string
  competition_date_end?: string
  location?: string
  format?: string
  show_dates?: boolean
  show_location?: boolean
  show_format?: boolean
  show_registration_deadline?: boolean
  is_current?: boolean
  is_archived?: boolean
}

export interface CompetitionCreateData {
  name: string
  description?: string
  rules_file?: string
  field_files?: string[]
  vinyl_files?: string[]
  drawings_3d?: string[]
  registration_link?: string
  external_link?: string
  display_order?: number
  is_active?: boolean
}

export const seasonsApi = {
  getList: async (currentOnly = false, includeArchived = false): Promise<Season[]> => {
    const response = await apiClient.get('/seasons', {
      params: { current_only: currentOnly, include_archived: includeArchived }
    })
    return response.data
  },

  getCurrent: async (): Promise<Season | null> => {
    const response = await apiClient.get('/seasons/current')
    return response.data
  },

  getById: async (id: number): Promise<Season> => {
    const response = await apiClient.get(`/seasons/${id}`)
    return response.data
  },

  create: async (data: SeasonCreateData): Promise<Season> => {
    const response = await apiClient.post('/seasons/', data)
    return response.data
  },

  update: async (id: number, data: Partial<SeasonCreateData>): Promise<Season> => {
    const response = await apiClient.patch(`/seasons/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/seasons/${id}`)
  },

  // Competitions
  createCompetition: async (seasonId: number, data: CompetitionCreateData): Promise<Competition> => {
    const response = await apiClient.post(`/seasons/${seasonId}/competitions`, data)
    return response.data
  },

  updateCompetition: async (competitionId: number, data: Partial<CompetitionCreateData>): Promise<Competition> => {
    const response = await apiClient.patch(`/seasons/competitions/${competitionId}`, data)
    return response.data
  },

  deleteCompetition: async (competitionId: number): Promise<void> => {
    await apiClient.delete(`/seasons/competitions/${competitionId}`)
  }
}


