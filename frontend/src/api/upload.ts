import apiClient from './client'

export interface UploadResponse {
  url: string
  filename: string
}

export interface BatchUploadResponse {
  files: Array<{
    original: string
    url: string
    filename: string
    error?: string
  }>
}

export const uploadApi = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  uploadDocument: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  uploadBatch: async (files: File[]): Promise<BatchUploadResponse> => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    
    const response = await apiClient.post('/upload/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  deleteFile: async (filepath: string): Promise<void> => {
    await apiClient.delete(`/upload/${filepath}`)
  }
}





