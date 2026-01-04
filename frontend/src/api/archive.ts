import apiClient from './client'
import { ArchiveSeason, ArchiveMedia, MediaType } from '../types'

export interface ArchiveSeasonCreateData {
  year: number
  name: string
  theme?: string
  description?: string
  cover_image?: string
  results_summary?: string
  teams_count?: number
}

export interface ArchiveMediaCreateData {
  title?: string
  description?: string
  media_type: MediaType
  file_path: string
  thumbnail?: string
  video_url?: string
  duration?: number
  display_order?: number
}

export const archiveApi = {
  getSeasons: async (): Promise<ArchiveSeason[]> => {
    const response = await apiClient.get('/archive')
    return response.data
  },

  getSeasonByYear: async (year: number): Promise<ArchiveSeason> => {
    const response = await apiClient.get(`/archive/${year}`)
    return response.data
  },

  createSeason: async (data: ArchiveSeasonCreateData): Promise<ArchiveSeason> => {
    const response = await apiClient.post('/archive/', data)
    return response.data
  },

  updateSeason: async (id: number, data: Partial<ArchiveSeasonCreateData>): Promise<ArchiveSeason> => {
    const response = await apiClient.patch(`/archive/${id}`, data)
    return response.data
  },

  deleteSeason: async (id: number): Promise<void> => {
    await apiClient.delete(`/archive/${id}`)
  },

  addMedia: async (seasonId: number, data: ArchiveMediaCreateData): Promise<ArchiveMedia> => {
    const response = await apiClient.post(`/archive/${seasonId}/media`, data)
    return response.data
  },

  deleteMedia: async (mediaId: number): Promise<void> => {
    await apiClient.delete(`/archive/media/${mediaId}`)
  }
}


