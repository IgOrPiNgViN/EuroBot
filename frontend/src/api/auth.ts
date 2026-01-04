import apiClient from './client'
import { User, AuthTokens, UserRole } from '../types'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name?: string
  phone?: string
}

export interface AdminCreateData {
  email: string
  password: string
  full_name?: string
  phone?: string
  role: UserRole
}

export interface AdminUpdateData {
  full_name?: string
  phone?: string
  password?: string
  is_active?: boolean
  role?: UserRole
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthTokens> => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await apiClient.post('/auth/refresh', null, {
      params: { refresh_token: refreshToken }
    })
    return response.data
  },

  // Admin management (super admin only)
  getAdmins: async (): Promise<User[]> => {
    const response = await apiClient.get('/auth/admins')
    return response.data
  },

  createAdmin: async (data: AdminCreateData): Promise<User> => {
    const response = await apiClient.post('/auth/admins', data)
    return response.data
  },

  updateAdmin: async (id: number, data: AdminUpdateData): Promise<User> => {
    const response = await apiClient.put(`/auth/admins/${id}`, data)
    return response.data
  },

  deleteAdmin: async (id: number): Promise<void> => {
    await apiClient.delete(`/auth/admins/${id}`)
  }
}



