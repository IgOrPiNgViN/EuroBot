import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline'
import { seasonsApi, SeasonCreateData } from '../../api/seasons'
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

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот сезон? Это также удалит все связанные данные.')) return

    try {
      await seasonsApi.delete(id)
      setSeasons(seasons.filter(s => s.id !== id))
      toast.success('Сезон удалён')
    } catch (error) {
      toast.error('Ошибка при удалении')
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
    </div>
  )
}



