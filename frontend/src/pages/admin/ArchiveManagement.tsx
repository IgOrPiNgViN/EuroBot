import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  PhotoIcon,
  PlayIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { archiveApi, ArchiveSeasonCreateData, ArchiveMediaCreateData } from '../../api/archive'
import { ArchiveSeason, ArchiveMedia, MediaType } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'

export default function ArchiveManagement() {
  const [seasons, setSeasons] = useState<ArchiveSeason[]>([])
  const [loading, setLoading] = useState(true)
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState<ArchiveSeason | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<ArchiveSeason | null>(null)
  const [seasonForm, setSeasonForm] = useState<Partial<ArchiveSeasonCreateData>>({})
  const [mediaForm, setMediaForm] = useState<Partial<ArchiveMediaCreateData>>({ media_type: 'photo' })
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingSeason, setDeletingSeason] = useState<ArchiveSeason | null>(null)

  const fetchSeasons = async () => {
    try {
      const data = await archiveApi.getSeasons()
      setSeasons(data)
    } catch (error) {
      console.error('Failed to fetch archive:', error)
      toast.error('Ошибка загрузки архива')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeasons()
  }, [])

  const handleCreateSeason = () => {
    setEditingSeason(null)
    setSeasonForm({})
    setShowSeasonModal(true)
  }

  const handleEditSeason = (season: ArchiveSeason) => {
    setEditingSeason(season)
    setSeasonForm({
      year: season.year,
      name: season.name,
      theme: season.theme || '',
      description: season.description || '',
      cover_image: season.cover_image || '',
      first_place: season.first_place || '',
      second_place: season.second_place || '',
      third_place: season.third_place || '',
      additional_info: season.additional_info || '',
      teams_count: season.teams_count || undefined
    })
    setShowSeasonModal(true)
  }

  const handleSaveSeason = async () => {
    if (!seasonForm.year || !seasonForm.name) {
      toast.error('Заполните год и название')
      return
    }

    setSaving(true)
    try {
      if (editingSeason) {
        await archiveApi.updateSeason(editingSeason.id, seasonForm)
        toast.success('Сезон обновлён')
      } else {
        await archiveApi.createSeason(seasonForm as ArchiveSeasonCreateData)
        toast.success('Сезон добавлен в архив')
      }
      setShowSeasonModal(false)
      fetchSeasons()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (season: ArchiveSeason) => {
    setDeletingSeason(season)
    setShowDeleteModal(true)
  }

  const handleDeleteSeason = async () => {
    if (!deletingSeason) return

    try {
      await archiveApi.deleteSeason(deletingSeason.id)
      toast.success('Сезон удалён из архива')
      setShowDeleteModal(false)
      setDeletingSeason(null)
      fetchSeasons()
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  const handleRestoreSeason = async () => {
    if (!deletingSeason) return

    try {
      await archiveApi.restoreSeason(deletingSeason.id)
      toast.success('Сезон восстановлен и возвращён в список сезонов')
      setShowDeleteModal(false)
      setDeletingSeason(null)
      fetchSeasons()
    } catch (error) {
      toast.error('Ошибка восстановления')
    }
  }

  const handleAddMedia = (season: ArchiveSeason) => {
    setSelectedSeason(season)
    setMediaForm({ media_type: 'photo' })
    setShowMediaModal(true)
  }

  const handleSaveMedia = async () => {
    if (!selectedSeason || !mediaForm.file_path) {
      toast.error('Укажите ссылку на файл')
      return
    }

    setSaving(true)
    try {
      await archiveApi.addMedia(selectedSeason.id, mediaForm as ArchiveMediaCreateData)
      toast.success('Медиафайл добавлен')
      setShowMediaModal(false)
      fetchSeasons()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка добавления')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMedia = async (mediaId: number) => {
    if (!confirm('Удалить этот медиафайл?')) return

    try {
      await archiveApi.deleteMedia(mediaId)
      toast.success('Медиафайл удалён')
      fetchSeasons()
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Архив сезонов</h1>
          <p className="text-gray-500">Управление архивом прошлых соревнований</p>
        </div>
        <Button onClick={handleCreateSeason}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Добавить сезон
        </Button>
      </div>

      {seasons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">Архив пуст</p>
          <Button onClick={handleCreateSeason}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Добавить первый сезон
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {seasons.map((season) => (
            <motion.div
              key={season.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {season.cover_image && (
                      <img
                        src={season.cover_image}
                        alt={season.name}
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {season.year} — {season.name}
                      </h3>
                      {season.theme && (
                        <p className="text-eurobot-gold text-sm">Тема: {season.theme}</p>
                      )}
                      {season.description && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">{season.description}</p>
                      )}
                      {season.teams_count && (
                        <p className="text-gray-500 text-sm mt-1">Команд: {season.teams_count}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddMedia(season)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Добавить медиа"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditSeason(season)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Редактировать"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(season)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Удалить"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Media grid */}
                {season.media && season.media.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Медиафайлы ({season.media.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {season.media.map((media) => (
                        <div key={media.id} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            {media.media_type === 'photo' && (
                              <img
                                src={media.thumbnail || media.file_path}
                                alt={media.title || ''}
                                className="w-full h-full object-cover"
                              />
                            )}
                            {media.media_type === 'video' && (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <PlayIcon className="w-10 h-10 text-gray-500" />
                              </div>
                            )}
                            {media.media_type === 'document' && (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <DocumentIcon className="w-10 h-10 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteMedia(media.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                          {media.title && (
                            <p className="text-xs text-gray-600 mt-1 truncate">{media.title}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Season Modal */}
      {showSeasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-heading font-bold">
                {editingSeason ? 'Редактировать сезон' : 'Добавить сезон в архив'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Год"
                  type="number"
                  required
                  value={seasonForm.year || ''}
                  onChange={(e) => setSeasonForm({ ...seasonForm, year: parseInt(e.target.value) })}
                  placeholder="2025"
                />
                <Input
                  label="Количество команд"
                  type="number"
                  value={seasonForm.teams_count || ''}
                  onChange={(e) => setSeasonForm({ ...seasonForm, teams_count: parseInt(e.target.value) || undefined })}
                />
              </div>

              <Input
                label="Название"
                required
                value={seasonForm.name || ''}
                onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
                placeholder="Евробот 2025"
              />

              <Input
                label="Тема сезона"
                value={seasonForm.theme || ''}
                onChange={(e) => setSeasonForm({ ...seasonForm, theme: e.target.value })}
                placeholder="Например: Farming Mars"
              />

              <Textarea
                label="Описание"
                value={seasonForm.description || ''}
                onChange={(e) => setSeasonForm({ ...seasonForm, description: e.target.value })}
                rows={3}
              />

              <Input
                label="URL обложки"
                value={seasonForm.cover_image || ''}
                onChange={(e) => setSeasonForm({ ...seasonForm, cover_image: e.target.value })}
                placeholder="https://..."
              />

              {/* Простые поля для призёров */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-700 mb-3">🏆 Призёры соревнований</h4>
                <div className="space-y-3">
                  <Input
                    label="🥇 1 место"
                    value={seasonForm.first_place || ''}
                    onChange={(e) => setSeasonForm({ ...seasonForm, first_place: e.target.value })}
                    placeholder="Название команды — 150 очков"
                  />
                  <Input
                    label="🥈 2 место"
                    value={seasonForm.second_place || ''}
                    onChange={(e) => setSeasonForm({ ...seasonForm, second_place: e.target.value })}
                    placeholder="Название команды — 142 очка"
                  />
                  <Input
                    label="🥉 3 место"
                    value={seasonForm.third_place || ''}
                    onChange={(e) => setSeasonForm({ ...seasonForm, third_place: e.target.value })}
                    placeholder="Название команды — 138 очков"
                  />
                  <Textarea
                    label="Дополнительная информация"
                    value={seasonForm.additional_info || ''}
                    onChange={(e) => setSeasonForm({ ...seasonForm, additional_info: e.target.value })}
                    rows={2}
                    placeholder="Например: Всего участвовало 45 команд из 12 регионов"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setShowSeasonModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveSeason} isLoading={saving}>
                {editingSeason ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Media Modal */}
      {showMediaModal && selectedSeason && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-lg"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-heading font-bold">
                Добавить медиафайл
              </h2>
              <p className="text-sm text-gray-500">в {selectedSeason.name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <Select
                label="Тип медиа"
                value={mediaForm.media_type || 'photo'}
                onChange={(e) => setMediaForm({ ...mediaForm, media_type: e.target.value as MediaType })}
                options={[
                  { value: 'photo', label: 'Фото' },
                  { value: 'video', label: 'Видео' },
                  { value: 'document', label: 'Документ' }
                ]}
              />

              <Input
                label="Название"
                value={mediaForm.title || ''}
                onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                placeholder="Название файла"
              />

              <Input
                label={mediaForm.media_type === 'video' ? 'URL видео' : 'URL файла'}
                required
                value={mediaForm.file_path || ''}
                onChange={(e) => setMediaForm({ ...mediaForm, file_path: e.target.value })}
                placeholder="https://..."
              />

              {mediaForm.media_type === 'video' && (
                <Input
                  label="URL превью (thumbnail)"
                  value={mediaForm.thumbnail || ''}
                  onChange={(e) => setMediaForm({ ...mediaForm, thumbnail: e.target.value })}
                  placeholder="https://..."
                />
              )}

              {mediaForm.media_type === 'photo' && (
                <Input
                  label="URL миниатюры"
                  value={mediaForm.thumbnail || ''}
                  onChange={(e) => setMediaForm({ ...mediaForm, thumbnail: e.target.value })}
                  placeholder="https://... (опционально)"
                />
              )}

              <Textarea
                label="Описание"
                value={mediaForm.description || ''}
                onChange={(e) => setMediaForm({ ...mediaForm, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setShowMediaModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveMedia} isLoading={saving}>
                Добавить
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete/Restore Modal */}
      {showDeleteModal && deletingSeason && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-md"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-heading font-bold text-gray-900">
                Что сделать с архивом?
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {deletingSeason.year} — {deletingSeason.name}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Выберите действие для этого архивного сезона:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleRestoreSeason}
                  className="w-full p-4 border-2 border-green-200 rounded-xl hover:bg-green-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Вернуть в сезоны</h4>
                      <p className="text-sm text-gray-500">Сезон будет восстановлен и появится в списке сезонов</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleDeleteSeason}
                  className="w-full p-4 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                      <TrashIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Удалить полностью</h4>
                      <p className="text-sm text-gray-500">Архив и все медиафайлы будут удалены навсегда</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-6 border-t">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingSeason(null)
                }}
                className="w-full"
              >
                Отмена
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
