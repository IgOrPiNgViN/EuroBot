import apiClient from './client'
import { News, NewsListResponse, NewsCategory, NewsTag } from '../types'

export interface NewsFilters {
  page?: number
  limit?: number
  category?: string
  tag?: string
  search?: string
  featured?: boolean
}

export interface NewsCreateData {
  title: string
  excerpt?: string
  content: string
  featured_image?: string
  video_url?: string
  gallery?: string
  category_id?: number
  is_published?: boolean
  is_featured?: boolean
  publish_date?: string
  scheduled_publish_at?: string | null
  meta_title?: string
  meta_description?: string
  tag_ids?: number[]
}

export interface AdminNewsFilters extends NewsFilters {
  is_published?: boolean
}

export const newsApi = {
  getList: async (filters: NewsFilters = {}): Promise<NewsListResponse> => {
    const response = await apiClient.get('/news', { params: filters })
    return response.data
  },

  // Get all news including unpublished (admin only)
  getListAdmin: async (filters: AdminNewsFilters = {}): Promise<NewsListResponse> => {
    const response = await apiClient.get('/news/admin/all', { params: filters })
    return response.data
  },

  getFeatured: async (limit = 5): Promise<News[]> => {
    const response = await apiClient.get('/news/featured', { params: { limit } })
    return response.data
  },

  getBySlug: async (slug: string): Promise<News> => {
    const response = await apiClient.get(`/news/${slug}`)
    return response.data
  },

  getCategories: async (): Promise<NewsCategory[]> => {
    const response = await apiClient.get('/news/categories')
    return response.data
  },

  getTags: async (): Promise<NewsTag[]> => {
    const response = await apiClient.get('/news/tags')
    return response.data
  },

  create: async (data: NewsCreateData): Promise<News> => {
    const response = await apiClient.post('/news/', data)
    return response.data
  },

  update: async (id: number, data: Partial<NewsCreateData>): Promise<News> => {
    const response = await apiClient.patch(`/news/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/news/${id}`)
  }
}


