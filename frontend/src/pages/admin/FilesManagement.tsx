import MediaLibrary from '../../components/ui/MediaLibrary'

export default function FilesManagement() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          Файлы
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Все изображения и документы, загруженные на сайт. Загрузите файл и скопируйте
          ссылку, чтобы вставить её куда угодно, — в формах админки файлы также можно
          загружать прямо в поле кнопкой «Загрузить».
        </p>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <MediaLibrary allowDelete />
      </div>
    </div>
  )
}
