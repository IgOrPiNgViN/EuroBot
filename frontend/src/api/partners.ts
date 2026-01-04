import apiClient from './client'
import { Partner, PartnerCategory } from '../types'

export interface PartnerCreateData {
  name: string
  category: PartnerCategory
  logo: string
  website?: string
  description?: string
  is_active?: boolean
  display_order?: number
}

export const partnersApi = {
  getList: async (category?: PartnerCategory): Promise<Partner[]> => {
    const response = await apiClient.get('/partners', { params: { category } })
    return response.data
  },

  getGrouped: async (): Promise<Record<PartnerCategory, Partner[]>> => {
    const response = await apiClient.get('/partners/grouped')
    return response.data
  },

  getById: async (id: number): Promise<Partner> => {
    const response = await apiClient.get(`/partners/${id}`)
    return response.data
  },

  create: async (data: PartnerCreateData): Promise<Partner> => {
    const response = await apiClient.post('/partners/', data)
    return response.data
  },

  update: async (id: number, data: Partial<PartnerCreateData>): Promise<Partner> => {
    const response = await apiClient.patch(`/partners/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/partners/${id}`)
  }
}


