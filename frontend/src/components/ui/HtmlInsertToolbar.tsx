import { RefObject, useState } from 'react'
import toast from 'react-hot-toast'
import { DocumentArrowUpIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { ACCEPT, UploadKind, uploadApi, uploadErrorMessage } from '../../api/upload'
import '../../styles/components/ui/ImageUrlField.css'

interface HtmlInsertToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement>
  value: string
  onChange: (value: string) => void
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Панель над HTML-полем: загружает картинку или документ на сервер
 * и вставляет готовый HTML-код в место курсора — без ручного копирования ссылок.
 */
export default function HtmlInsertToolbar({ textareaRef, value, onChange }: HtmlInsertToolbarProps) {
  const [busy, setBusy] = useState<string | null>(null)

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = value.slice(0, start) + snippet + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(start + snippet.length, start + snippet.length)
    })
  }

  const handle = async (kind: UploadKind, file: File) => {
    setBusy(file.name)
    try {
      const { url } = await uploadApi.upload(kind, file)
      const name = escapeHtml(file.name.replace(/\.[^.]+$/, ''))
      insertAtCursor(
        kind === 'images'
          ? `\n<img src="${url}" alt="${name}" />\n`
          : `<a href="${url}" target="_blank" rel="noopener">${name}</a>`
      )
      toast.success('Файл загружен и вставлен в текст')
    } catch (error) {
      toast.error(uploadErrorMessage(error))
    } finally {
      setBusy(null)
    }
  }

  const button = (kind: UploadKind, label: string, Icon: typeof PhotoIcon) => (
    <label className={`image-url-field-upload ${busy ? 'is-loading' : ''}`}>
      <Icon className="image-url-field-upload-icon" />
      {label}
      <input
        type="file"
        className="image-url-field-file-input"
        accept={ACCEPT[kind] || undefined}
        disabled={!!busy}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handle(kind, file)
          e.target.value = ''
        }}
      />
    </label>
  )

  return (
    <div className="image-url-field-actions">
      {button('images', 'Вставить картинку', PhotoIcon)}
      {button('documents', 'Вставить документ', DocumentArrowUpIcon)}
      {busy && <span className="image-url-field-drop-hint">Загрузка {busy}...</span>}
    </div>
  )
}
