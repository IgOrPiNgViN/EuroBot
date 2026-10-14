import FileUrlField, { FileUrlFieldProps } from './FileUrlField'

type ImageUrlFieldProps = Omit<FileUrlFieldProps, 'kind'>

/** Поле изображения: ссылка + загрузка на сервер + выбор из загруженных */
export default function ImageUrlField(props: ImageUrlFieldProps) {
  return <FileUrlField kind="images" {...props} />
}

export function isValidImageRef(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return true
  try {
    new URL(trimmed)
    return true
  } catch {
    return false
  }
}
