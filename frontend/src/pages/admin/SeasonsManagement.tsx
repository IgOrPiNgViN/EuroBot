import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'
import { seasonsApi, SeasonCreateData, FinalizeSeasonData } from '../../api/seasons'
import { Season } from '../../types'
import { format } from 'date-fns'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'

export default function SeasonsManagement() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [formData, setFormData] = useState<Partial<SeasonCreateData>>({})
  const [saving, setSaving] = useState(false)
  
  // Finalize season modal
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [finalizingSeason, setFinalizingSeason] = useState<Season | null>(null)
  const [finalizeData, setFinalizeData] = useState<FinalizeSeasonData>({})
  const [finalizing, setFinalizing] = useState(false)

  const fetchSeasons = async () => {
    try {
      const data = await seasonsApi.getList(false, true)
      setSeasons(data)
    } catch (error) {
      console.error('Failed to fetch seasons:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeasons()
  }, [])

  const handleCreate = () => {
    setEditingSeason(null)
    setFormData({
      year: new Date().getFullYear(),
      registration_open: false,
      show_dates: true,
      show_location: true,
      show_format: true,
      show_registration_deadline: true,
      is_current: false,
      is_archived: false
    })
    setShowModal(true)
  }

  const handleEdit = (season: Season) => {
    setEditingSeason(season)
    setFormData({
      year: season.year,
      name: season.name,
      theme: season.theme || '',
      registration_open: season.registration_open,
      registration_start: season.registration_start?.split('T')[0],
      registration_end: season.registration_end?.split('T')[0],
      competition_date_start: season.competition_date_start || '',
      competition_date_end: season.competition_date_end || '',
      location: season.location || '',
      format: season.format || '',
      show_dates: season.show_dates,
      show_location: season.show_location,
      show_format: season.show_format,
      show_registration_deadline: season.show_registration_deadline,
      is_current: season.is_current,
      is_archived: season.is_archived
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number, force: boolean = false) => {
    const message = force 
      ? 'Вы уверены? Сезон будет удалён ВМЕСТЕ со всеми зарегистрированными командами!'
      : 'Удалить этот сезон?'
    
    if (!confirm(message)) return

    try {
      await seasonsApi.delete(id, force)
      setSeasons(seasons.filter(s => s.id !== id))
      toast.success('Сезон удалён')
    } catch (error: any) {
      const detail = error.response?.data?.detail || ''
      // Check if error is about teams
      if (detail.includes('команд') && !force) {
        if (confirm(`${detail}\n\nУдалить сезон вместе с командами?`)) {
          handleDelete(id, true)
        }
      } else {
        toast.error(detail || 'Ошибка при удалении')
      }
    }
  }

  const handleSetCurrent = async (season: Season) => {
    if (season.is_current) return
    
    try {
      await seasonsApi.update(season.id, { is_current: true })
      toast.success(`${season.name} установлен как текущий сезон`)
      fetchSeasons()
    } catch (error) {
      toast.error('Ошибка при обновлении')
    }
  }

  const handleOpenFinalize = (season: Season) => {
    setFinalizingSeason(season)
    setFinalizeData({
      description: '',
      cover_image: '',
      first_place: '',
      second_place: '',
      third_place: '',
      additional_info: ''
    })
    setShowFinalizeModal(true)
  }

  const handleFinalize = async () => {
    if (!finalizingSeason) return
    
    if (!confirm(`Вы уверены, что хотите завершить сезон "${finalizingSeason.name}" и отправить его в архив? Это действие необратимо.`)) {
      return
    }

    setFinalizing(true)
    try {
      await seasonsApi.finalize(finalizingSeason.id, finalizeData)
      toast.success('Сезон завершён и отправлен в архив')
      setShowFinalizeModal(false)
      fetchSeasons()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при завершении сезона')
    } finally {
      setFinalizing(false)
    }
  }

  const handleSave = async () => {
    if (!formData.year || !formData.name) {
      toast.error('Заполните обязательные поля')
      return
    }

    setSaving(true)
    try {
      if (editingSeason) {
        await seasonsApi.update(editingSeason.id, formData)
        toast.success('Сезон обновлён')
      } else {
        await seasonsApi.create(formData as SeasonCreateData)
        toast.success('Сезон создан')
      }
      setShowModal(false)
      fetchSeasons()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Управление сезонами
        </h1>
        <Button onClick={handleCreate} leftIcon={<PlusIcon className="w-5 h-5" />}>
          Новый сезон
        </Button>
      </div>

      {/* Seasons list */}
      <div className="space-y-4">
        {seasons.map((season) => (
          <motion.div
            key={season.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl shadow-sm p-6 ${
              season.is_current ? 'ring-2 ring-eurobot-gold' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="font-heading font-bold text-xl">{season.name}</h3>
                  {season.is_current && (
                    <span className="flex items-center text-eurobot-gold text-sm">
                      <StarIcon className="w-4 h-4 mr-1 fill-current" />
                      Текущий
                    </span>
                  )}
                  {season.is_archived && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      Архив
                    </span>
                  )}
                </div>
                {season.theme && (
                  <p className="text-gray-500 mt-1">Тема: {season.theme}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {!season.is_current && !season.is_archived && (
                  <button
                    onClick={() => handleSetCurrent(season)}
                    className="px-3 py-1 text-sm bg-eurobot-gold/10 text-eurobot-gold hover:bg-eurobot-gold hover:text-white rounded-lg transition-colors"
                    title="Сделать текущим"
                  >
                    <StarIcon className="w-4 h-4 inline mr-1" />
                    Сделать текущим
                  </button>
                )}
                {!season.is_archived && (
                  <button
                    onClick={() => handleOpenFinalize(season)}
                    className="px-3 py-1 text-sm bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg transition-colors"
                    title="Завершить сезон и отправить в архив"
                  >
                    <ArchiveBoxIcon className="w-4 h-4 inline mr-1" />
                    Завершить
                  </button>
                )}
                <button
                  onClick={() => handleEdit(season)}
                  className="p-2 text-gray-400 hover:text-blue-600"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(season.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Регистрация</p>
                <p className={`font-medium ${season.registration_open ? 'text-green-600' : 'text-gray-600'}`}>
                  {season.registration_open ? 'Открыта' : 'Закрыта'}
                </p>
              </div>
              {season.competition_date_start && (
                <div>
                  <p className="text-gray-500">Даты соревнований</p>
                  <p className="font-medium">
                    {season.competition_date_start}
                    {season.competition_date_end && ` — ${season.competition_date_end}`}
                  </p>
                </div>
              )}
              {season.location && (
                <div>
                  <p className="text-gray-500">Место</p>
                  <p className="font-medium">{season.location}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Соревнований</p>
                <p className="font-medium">{season.competitions.length}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {seasons.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            Сезонов пока нет
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-heading font-bold">
                {editingSeason ? 'Редактировать сезон' : 'Новый сезон'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Год"
                  type="number"
                  required
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
                <Input
                  label="Название"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="EUROBOT 2025"
                />
              </div>

              <Input
                label="Тема сезона"
                value={formData.theme || ''}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Начало регистрации"
                  type="date"
                  value={formData.registration_start || ''}
                  onChange={(e) => setFormData({ ...formData, registration_start: e.target.value })}
                />
                <Input
                  label="Конец регистрации"
                  type="date"
                  value={formData.registration_end || ''}
                  onChange={(e) => setFormData({ ...formData, registration_end: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Дата начала соревнований"
                  type="date"
                  value={formData.competition_date_start || ''}
                  onChange={(e) => setFormData({ ...formData, competition_date_start: e.target.value })}
                />
                <Input
                  label="Дата окончания"
                  type="date"
                  value={formData.competition_date_end || ''}
                  onChange={(e) => setFormData({ ...formData, competition_date_end: e.target.value })}
                />
              </div>

              <Input
                label="Место проведения"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />

              <Textarea
                label="Формат проведения"
                value={formData.format || ''}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              />

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Настройки отображения</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.registration_open}
                      onChange={(e) => setFormData({ ...formData, registration_open: e.target.checked })}
                      className="mr-2"
                    />
                    Регистрация открыта
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.is_current}
                      onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                      className="mr-2"
                    />
                    Текущий сезон
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.show_dates}
                      onChange={(e) => setFormData({ ...formData, show_dates: e.target.checked })}
                      className="mr-2"
                    />
                    Показывать даты
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.show_location}
                      onChange={(e) => setFormData({ ...formData, show_location: e.target.checked })}
                      className="mr-2"
                    />
                    Показывать место
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.show_format}
                      onChange={(e) => setFormData({ ...formData, show_format: e.target.checked })}
                      className="mr-2"
                    />
                    Показывать формат
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.is_archived}
                      onChange={(e) => setFormData({ ...formData, is_archived: e.target.checked })}
                      className="mr-2"
                    />
                    В архиве
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} isLoading={saving}>
                {editingSeason ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Finalize Season Modal */}
      {showFinalizeModal && finalizingSeason && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b bg-orange-50">
              <h2 className="text-xl font-heading font-bold flex items-center">
                <ArchiveBoxIcon className="w-6 h-6 mr-2 text-orange-600" />
                Завершить сезон: {finalizingSeason.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Заполните дополнительную информацию для архива
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Info from season (read-only) */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Данные из сезона (будут скопированы автоматически):</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Год:</span> {finalizingSeason.year}</div>
                  <div><span className="text-gray-500">Название:</span> {finalizingSeason.name}</div>
                  {finalizingSeason.theme && (
                    <div className="col-span-2"><span className="text-gray-500">Тема:</span> {finalizingSeason.theme}</div>
                  )}
                </div>
              </div>

              {/* Additional fields for archive */}
              <Textarea
                label="Описание сезона"
                value={finalizeData.description || ''}
                onChange={(e) => setFinalizeData({ ...finalizeData, description: e.target.value })}
                placeholder="Краткое описание прошедшего сезона..."
                rows={3}
              />

              <Input
                label="URL обложки"
                value={finalizeData.cover_image || ''}
                onChange={(e) => setFinalizeData({ ...finalizeData, cover_image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              {finalizeData.cover_image && (
                <div className="mt-2">
                  <img 
                    src={finalizeData.cover_image} 
                    alt="Превью обложки" 
                    className="max-h-40 rounded-lg object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Итоги сезона</p>
                <div className="space-y-3">
                  <Input
                    label="🥇 1 место"
                    value={finalizeData.first_place || ''}
                    onChange={(e) => setFinalizeData({ ...finalizeData, first_place: e.target.value })}
                    placeholder="Название команды-победителя"
                  />
                  <Input
                    label="🥈 2 место"
                    value={finalizeData.second_place || ''}
                    onChange={(e) => setFinalizeData({ ...finalizeData, second_place: e.target.value })}
                    placeholder="Название команды"
                  />
                  <Input
                    label="🥉 3 место"
                    value={finalizeData.third_place || ''}
                    onChange={(e) => setFinalizeData({ ...finalizeData, third_place: e.target.value })}
                    placeholder="Название команды"
                  />
                  <Textarea
                    label="Дополнительная информация"
                    value={finalizeData.additional_info || ''}
                    onChange={(e) => setFinalizeData({ ...finalizeData, additional_info: e.target.value })}
                    placeholder="Другие награды, особые достижения и т.д."
                    rows={3}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Количество команд будет подсчитано автоматически.
              </p>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setShowFinalizeModal(false)}>
                Отмена
              </Button>
              <Button 
                onClick={handleFinalize} 
                isLoading={finalizing}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <ArchiveBoxIcon className="w-5 h-5 mr-2" />
                Завершить и отправить в архив
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}





