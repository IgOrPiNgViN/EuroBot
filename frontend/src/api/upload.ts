import apiClient from './client'

export interface UploadResponse {
  url: string
  filename: string
  original?: string
  size?: number
}

export interface BatchUploadResponse {
  files: Array<{
    original: string
    url: string
    filename: string
    error?: string
  }>
}

/** Папка на сервере: images — картинки, documents — PDF/Word/Excel, files — всё остальное */
export type UploadKind = 'images' | 'documents' | 'files'

export interface UploadedFile {
  url: string
  path: string
  filename: string
  folder: UploadKind
  size: number
  modified: string
  is_image: boolean
}

const ENDPOINTS: Record<UploadKind, string> = {
  images: '/upload/image',
  documents: '/upload/document',
  files: '/upload/file',
}

export const ACCEPT: Record<UploadKind, string> = {
  images: '.jpg,.jpeg,.png,.gif,.webp,.svg,.ico,.avif',
  documents: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv',
  files: '',
}

/** Текст ошибки загрузки для показа пользователю */
export function uploadErrorMessage(error: any): string {
  const status = error?.response?.status
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (status === 413) return 'Файл слишком большой для сервера'
  return 'Ошибка загрузки файла'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

const postFile = async (
  endpoint: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
  return response.data
}

export const uploadApi = {
  upload: (kind: UploadKind, file: File, onProgress?: (percent: number) => void) =>
    postFile(ENDPOINTS[kind], file, onProgress),

  uploadImage: (file: File, onProgress?: (percent: number) => void) =>
    postFile(ENDPOINTS.images, file, onProgress),

  uploadDocument: (file: File, onProgress?: (percent: number) => void) =>
    postFile(ENDPOINTS.documents, file, onProgress),

  uploadFile: (file: File, onProgress?: (percent: number) => void) =>
    postFile(ENDPOINTS.files, file, onProgress),

  uploadBatch: async (files: File[]): Promise<BatchUploadResponse> => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    const response = await apiClient.post('/upload/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  listFiles: async (folder?: UploadKind): Promise<UploadedFile[]> => {
    const response = await apiClient.get('/upload/files', { params: folder ? { folder } : {} })
    return response.data.files
  },

  deleteFile: async (filepath: string): Promise<void> => {
    await apiClient.delete(`/upload/${filepath}`)
  }
}
