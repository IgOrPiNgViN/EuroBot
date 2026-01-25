import apiClient from './client'
import { Team, TeamListResponse, TeamStatus, League } from '../types'

export interface TeamFilters {
  page?: number
  limit?: number
  season_id?: number
  status?: TeamStatus
  league?: League
  search?: string
}

export interface TeamMemberData {
  full_name: string
  role?: string
  email?: string
  phone?: string
}

export interface TeamRegisterData {
  name: string
  email: string
  phone: string
  organization: string
  city?: string
  region?: string
  participants_count: number
  league: League
  poster_link?: string
  rules_accepted: boolean
  season_id: number
  members?: TeamMemberData[]
  custom_fields?: Record<string, unknown>
  recaptcha_token?: string
}

export const teamsApi = {
  register: async (data: TeamRegisterData): Promise<Team> => {
    const response = await apiClient.post('/teams/register', data)
    return response.data
  },

  getList: async (filters: TeamFilters = {}): Promise<TeamListResponse> => {
    const response = await apiClient.get('/teams/', { params: filters })
    return response.data
  },

  getById: async (id: number): Promise<Team> => {
    const response = await apiClient.get(`/teams/${id}`)
    return response.data
  },

  update: async (id: number, data: Partial<TeamRegisterData & { status?: TeamStatus; notes?: string }>): Promise<Team> => {
    const response = await apiClient.patch(`/teams/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/teams/${id}`)
  },

  exportExcel: async (seasonId?: number): Promise<Blob> => {
    const response = await apiClient.get('/teams/export', {
      params: { season_id: seasonId },
      responseType: 'blob'
    })
    return response.data
  }
}


