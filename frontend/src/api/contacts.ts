import apiClient from './client'
import { ContactMessage, ContactMessageListResponse, ContactTopic } from '../types'

export interface ContactFilters {
  page?: number
  limit?: number
  topic?: ContactTopic
  is_read?: boolean
  is_replied?: boolean
}

export interface ContactCreateData {
  name: string
  email: string
  phone?: string
  topic: ContactTopic
  message: string
  recaptcha_token?: string
}

export const contactsApi = {
  send: async (data: ContactCreateData): Promise<ContactMessage> => {
    const response = await apiClient.post('/contacts/', data)
    return response.data
  },

  getList: async (filters: ContactFilters = {}): Promise<ContactMessageListResponse> => {
    const response = await apiClient.get('/contacts', { params: filters })
    return response.data
  },

  getById: async (id: number): Promise<ContactMessage> => {
    const response = await apiClient.get(`/contacts/${id}`)
    return response.data
  },

  markAsRead: async (id: number): Promise<ContactMessage> => {
    const response = await apiClient.patch(`/contacts/${id}`, { is_read: true })
    return response.data
  },

  markAsReplied: async (id: number): Promise<ContactMessage> => {
    const response = await apiClient.patch(`/contacts/${id}`, { is_replied: true })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`)
  }
}


