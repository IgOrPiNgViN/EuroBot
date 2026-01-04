import apiClient from './client'
import { SiteSettings, DashboardStats } from '../types'

export const settingsApi = {
  getPublic: async (): Promise<SiteSettings> => {
    const response = await apiClient.get('/settings')
    return response.data
  },

  get: async (key: string): Promise<unknown> => {
    const response = await apiClient.get(`/settings/${key}`)
    return response.data
  },

  getAll: async (): Promise<SiteSettings[]> => {
    const response = await apiClient.get('/settings/all/admin')
    return response.data
  },

  update: async (key: string, value: string | object, isPublic = true): Promise<void> => {
    const data = typeof value === 'object' 
      ? { value_json: value, is_public: isPublic }
      : { value, is_public: isPublic }
    await apiClient.put(`/settings/${key}`, data)
  },

  delete: async (key: string): Promise<void> => {
    await apiClient.delete(`/settings/${key}`)
  }
}

export const adminApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/admin/dashboard')
    return response.data
  },

  getTeamStats: async (seasonId?: number): Promise<{
    total: number
    by_status: Record<string, number>
    by_league: Record<string, number>
    by_city: Record<string, number>
  }> => {
    const response = await apiClient.get('/admin/teams/stats', {
      params: { season_id: seasonId }
    })
    return response.data
  }
}



