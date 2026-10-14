import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  ArrowUpTrayIcon,
  ClipboardDocumentIcon,
  DocumentIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  ACCEPT,
  UploadKind,
  UploadedFile,
  formatFileSize,
  uploadApi,
  uploadErrorMessage,
} from '../../api/upload'
import LoadingSpinner from './LoadingSpinner'
import '../../styles/components/ui/MediaLibrary.css'

const TABS: Array<{ value: UploadKind | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'images', label: 'Изображения' },
  { value: 'documents', label: 'Документы' },
  { value: 'files', label: 'Прочее' },
]

interface MediaLibraryProps {
  /** Если передан — клик по файлу выбирает его (режим «выбрать из загруженных») */
  onSelect?: (file: UploadedFile) => void
  /** Начальная вкладка */
  initialFolder?: UploadKind | 'all'
  /** Показывать кнопку удаления */
  allowDelete?: boolean
}

export default function MediaLibrary({ onSelect, initialFolder = 'all', allowDelete = false }: MediaLibraryProps) {
  const [folder, setFolder] = useState<UploadKind | 'all'>(initialFolder)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      setFiles(await uploadApi.listFiles(folder === 'all' ? undefined : folder))
    } catch {
      toast.error('Не удалось загрузить список файлов')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? files.filter(f => f.filename.toLowerCase().includes(q)) : files
  }, [files, search])

  const kindForFile = (file: File): UploadKind => {
    if (folder !== 'all') return folder
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
    if (ACCEPT.images.split(',').includes(ext)) return 'images'
    if (ACCEPT.documents.split(',').includes(ext)) return 'documents'
    return 'files'
  }

  const uploadMany = async (list: FileList | File[]) => {
    const arr = Array.from(list)
    let ok = 0
    for (const [i, file] of arr.entries()) {
      setUploading(`${i + 1} из ${arr.length}: ${file.name}`)
      try {
        await uploadApi.upload(kindForFile(file), file)
        ok++
      } catch (error) {
        toast.error(`${file.name}: ${uploadErrorMessage(error)}`)
      }
    }
    setUploading(null)
    if (ok) toast.success(ok === 1 ? 'Файл загружен' : `Загружено файлов: ${ok}`)
    void load()
  }

  const copyLink = async (file: UploadedFile) => {
    const full = window.location.origin + file.url
    try {
      await navigator.clipboard.writeText(full)
      toast.success('Ссылка скопирована')
    } catch {
      window.prompt('Скопируйте ссылку:', full)
    }
  }

  const remove = async (file: UploadedFile) => {
    if (!confirm(`Удалить файл ${file.filename}?\nЕсли он используется на сайте, там перестанет отображаться.`)) return
    try {
      await uploadApi.deleteFile(file.path)
      setFiles(prev => prev.filter(f => f.path !== file.path))
      toast.success('Файл удалён')
    } catch (error) {
      toast.error(uploadErrorMessage(error))
    }
  }

  return (
    <div
      className={`media-library ${dragOver ? 'is-drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)
        if (e.dataTransfer.files.length) void uploadMany(e.dataTransfer.files)
      }}
    >
      <div className="media-library-toolbar">
        <div className="media-library-tabs">
          {TABS.map(tab => (
            <button
              key={tab.value}
              type="button"
              className={`media-library-tab ${folder === tab.value ? 'is-active' : ''}`}
              onClick={() => setFolder(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          className="input media-library-search"
          placeholder="Поиск по имени..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="media-library-upload"
          disabled={!!uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ArrowUpTrayIcon className="media-library-icon" />
          Загрузить
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept={folder === 'all' ? undefined : ACCEPT[folder] || undefined}
          onChange={(e) => {
            if (e.target.files?.length) void uploadMany(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <p className="media-library-hint">
        {uploading
          ? `Загрузка ${uploading}...`
          : 'Перетащите файлы сюда, чтобы загрузить их на сервер.'}
      </p>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="media-library-empty">Файлов пока нет</div>
      ) : (
        <div className="media-library-grid">
          {filtered.map(file => (
            <div
              key={file.path}
              className={`media-library-item ${onSelect ? 'is-selectable' : ''}`}
              onClick={onSelect ? () => onSelect(file) : undefined}
              title={file.filename}
            >
              <div className="media-library-thumb">
                {file.is_image ? (
                  <img src={file.url} alt={file.filename} loading="lazy" />
                ) : (
                  <DocumentIcon className="media-library-doc-icon" />
                )}
              </div>
              <div className="media-library-name">{file.filename}</div>
              <div className="media-library-meta">{formatFileSize(file.size)}</div>
              <div className="media-library-actions" onClick={(e) => e.stopPropagation()}>
                <button type="button" title="Скопировать ссылку" onClick={() => copyLink(file)}>
                  <ClipboardDocumentIcon className="media-library-icon" />
                </button>
                <a href={file.url} target="_blank" rel="noreferrer" title="Открыть">
                  ↗
                </a>
                {allowDelete && (
                  <button type="button" title="Удалить" className="is-danger" onClick={() => remove(file)}>
                    <TrashIcon className="media-library-icon" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface MediaLibraryModalProps {
  open: boolean
  onClose: () => void
  onSelect: (file: UploadedFile) => void
  initialFolder?: UploadKind | 'all'
}

export function MediaLibraryModal({ open, onClose, onSelect, initialFolder }: MediaLibraryModalProps) {
  if (!open) return null
  // Портал в body: модалка часто открывается из другой модалки с transform/overflow
  return createPortal(
    <div className="media-library-modal-overlay" onClick={onClose}>
      <div className="media-library-modal" onClick={(e) => e.stopPropagation()}>
        <div className="media-library-modal-header">
          <h3>Выберите файл</h3>
          <button type="button" onClick={onClose} title="Закрыть">
            <XMarkIcon className="media-library-icon" />
          </button>
        </div>
        <MediaLibrary
          initialFolder={initialFolder}
          onSelect={(file) => {
            onSelect(file)
            onClose()
          }}
        />
      </div>
    </div>,
    document.body
  )
}
