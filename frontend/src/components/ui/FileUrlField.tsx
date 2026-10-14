import { useRef, useState } from 'react'
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  FolderOpenIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { ACCEPT, UploadKind, uploadApi, uploadErrorMessage } from '../../api/upload'
import Input from './Input'
import { MediaLibraryModal } from './MediaLibrary'
import '../../styles/components/ui/ImageUrlField.css'

export interface FileUrlFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  /** Куда загружать и какие файлы принимать */
  kind?: UploadKind
  placeholder?: string
  required?: boolean
  helperText?: string
  previewAlt?: string
  showPreview?: boolean
  /** Вызывается после успешной загрузки — например, чтобы подставить название документа */
  onUploaded?: (info: { url: string; originalName: string }) => void
}

const KIND_TEXT: Record<UploadKind, { button: string; success: string }> = {
  images: { button: 'Загрузить изображение', success: 'Изображение загружено на сервер' },
  documents: { button: 'Загрузить документ', success: 'Документ загружен на сервер' },
  files: { button: 'Загрузить файл', success: 'Файл загружен на сервер' },
}

/**
 * Поле для ссылки на файл: можно вставить ссылку вручную, загрузить файл
 * с компьютера (кнопкой или перетаскиванием) или выбрать из уже загруженных.
 */
export default function FileUrlField({
  label,
  value,
  onChange,
  kind = 'images',
  placeholder = 'Загрузите файл или вставьте ссылку',
  required = false,
  helperText,
  previewAlt = 'Превью',
  showPreview = true,
  onUploaded,
}: FileUrlFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [previewFailed, setPreviewFailed] = useState(false)
  const uploading = progress !== null

  const handleUpload = async (file: File) => {
    setProgress(0)
    try {
      const result = await uploadApi.upload(kind, file, setProgress)
      setPreviewFailed(false)
      onChange(result.url)
      onUploaded?.({ url: result.url, originalName: file.name })
      toast.success(KIND_TEXT[kind].success)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(uploadErrorMessage(error))
    } finally {
      setProgress(null)
    }
  }

  const isImage = kind === 'images' || /\.(jpe?g|png|gif|webp|svg|avif|ico)(\?|$)/i.test(value)
  const fileName = value ? decodeURIComponent(value.split('?')[0].split('/').pop() || value) : ''

  return (
    <div
      className={`image-url-field ${dragOver ? 'is-drag-over' : ''}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          setDragOver(true)
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        const file = e.dataTransfer.files?.[0]
        if (!file) return
        e.preventDefault()
        setDragOver(false)
        void handleUpload(file)
      }}
    >
      <Input
        label={label}
        value={value}
        onChange={(e) => {
          setPreviewFailed(false)
          onChange(e.target.value)
        }}
        placeholder={placeholder}
        required={required}
        helperText={helperText}
      />

      <div className="image-url-field-actions">
        <label className={`image-url-field-upload ${uploading ? 'is-loading' : ''}`}>
          <ArrowUpTrayIcon className="image-url-field-upload-icon" />
          {uploading ? `Загрузка... ${progress}%` : KIND_TEXT[kind].button}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT[kind] || undefined}
            className="image-url-field-file-input"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                void handleUpload(file)
                e.target.value = ''
              }
            }}
          />
        </label>
        <button
          type="button"
          className="image-url-field-upload"
          onClick={() => setLibraryOpen(true)}
          disabled={uploading}
        >
          <FolderOpenIcon className="image-url-field-upload-icon" />
          Выбрать из загруженных
        </button>
        {value && (
          <button
            type="button"
            className="image-url-field-clear"
            onClick={() => onChange('')}
            title="Очистить поле"
          >
            <XMarkIcon className="image-url-field-upload-icon" />
          </button>
        )}
        <span className="image-url-field-drop-hint">или перетащите файл сюда</span>
      </div>

      {showPreview && value && (
        <div className="image-url-field-preview">
          {isImage && !previewFailed ? (
            <img
              src={value}
              alt={previewAlt}
              className="image-url-field-preview-image"
              onError={() => setPreviewFailed(true)}
            />
          ) : isImage ? (
            <div className="image-url-field-preview-error">Не удалось загрузить изображение</div>
          ) : (
            <a href={value} target="_blank" rel="noreferrer" className="image-url-field-preview-file">
              <DocumentIcon className="image-url-field-upload-icon" />
              {fileName}
            </a>
          )}
        </div>
      )}

      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        initialFolder={kind}
        onSelect={(file) => {
          setPreviewFailed(false)
          onChange(file.url)
        }}
      />
    </div>
  )
}
