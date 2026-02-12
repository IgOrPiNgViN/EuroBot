import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { newsApi, NewsCreateData } from '../../api/news'
import { News, NewsCategory } from '../../types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import '../../styles/pages/admin/NewsManagement.css'

type PublishMode = 'draft' | 'now' | 'scheduled'

export default function NewsManagement() {
  const [news, setNews] = useState<News[]>([])
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [formData, setFormData] = useState<Partial<NewsCreateData>>({})
  const [saving, setSaving] = useState(false)
  const [publishMode, setPublishMode] = useState<PublishMode>('draft')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const fetchNews = async () => {
    try {
      const [newsData, categoriesData] = await Promise.all([
        newsApi.getListAdmin({ limit: 50 }),
        newsApi.getCategories()
      ])
      setNews(newsData.items)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const handleCreate = () => {
    setEditingNews(null)
    setFormData({
      is_published: false,
      is_featured: false
    })
    setPublishMode('draft')
    setScheduledDate('')
    setScheduledTime('')
    setShowModal(true)
  }

  const handleEdit = (item: News) => {
    setEditingNews(item)
    setFormData({
      title: item.title,
      excerpt: item.excerpt || '',
      content: item.content,
      featured_image: item.featured_image || '',
      video_url: item.video_url || '',
      category_id: item.category?.id,
      is_published: item.is_published,
      is_featured: item.is_featured,
      meta_title: item.meta_title || '',
      meta_description: item.meta_description || ''
    })

    // Определяем режим публикации
    if (item.scheduled_publish_at && !item.is_published) {
      setPublishMode('scheduled')
      const scheduledDt = new Date(item.scheduled_publish_at)
      setScheduledDate(format(scheduledDt, 'yyyy-MM-dd'))
      setScheduledTime(format(scheduledDt, 'HH:mm'))
    } else if (item.is_published) {
      setPublishMode('now')
      setScheduledDate('')
      setScheduledTime('')
    } else {
      setPublishMode('draft')
      setScheduledDate('')
      setScheduledTime('')
    }

    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту новость?')) return

    try {
      await newsApi.delete(id)
      setNews(news.filter(n => n.id !== id))
      toast.success('Новость удалена')
    } catch (error) {
      toast.error('Ошибка при удалении')
    }
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Заполните обязательные поля')
      return
    }

    const saveData = { ...formData }

    if (publishMode === 'now') {
      saveData.is_published = true
      saveData.scheduled_publish_at = null
    } else if (publishMode === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        toast.error('Укажите дату и время отложенной публикации')
        return
      }
      const scheduledDateTimeStr = `${scheduledDate}T${scheduledTime}:00`
      if (new Date(scheduledDateTimeStr) <= new Date()) {
        toast.error('Дата отложенной публикации должна быть в будущем')
        return
      }
      saveData.is_published = false
      saveData.scheduled_publish_at = scheduledDateTimeStr
    } else {
      saveData.is_published = false
      saveData.scheduled_publish_at = null
    }

    setSaving(true)
    try {
      if (editingNews) {
        await newsApi.update(editingNews.id, saveData)
        toast.success('Новость обновлена')
      } else {
        await newsApi.create(saveData as NewsCreateData)
        toast.success('Новость создана')
      }
      setShowModal(false)
      fetchNews()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const getNewsStatus = (item: News) => {
    if (item.is_published) {
      return { label: 'Опубликовано', color: 'bg-green-100 text-green-800' }
    }
    if (item.scheduled_publish_at) {
      return { label: 'Запланировано', color: 'bg-blue-100 text-blue-700' }
    }
    return { label: 'Черновик', color: 'bg-gray-100 text-gray-800' }
  }

  const getMinDate = () => format(new Date(), 'yyyy-MM-dd')

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Управление новостями
        </h1>
        <Button onClick={handleCreate} leftIcon={<PlusIcon className="w-5 h-5" />}>
          Добавить новость
        </Button>
      </div>

      {/* News list */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Заголовок</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Категория</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {news.map((item) => {
              const status = getNewsStatus(item)
              return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {item.featured_image && (
                      <img
                        src={item.featured_image}
                        alt=""
                        className="w-10 h-10 rounded object-cover mr-3"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                      {item.is_featured && (
                        <span className="text-xs text-eurobot-gold">★ Избранное</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.category?.name || '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${status.color}`}>
                      {item.scheduled_publish_at && !item.is_published && (
                        <ClockIcon className="w-3.5 h-3.5" />
                      )}
                      {status.label}
                    </span>
                    {item.scheduled_publish_at && !item.is_published && (
                      <span className="text-[0.7rem] text-blue-600 font-medium">
                        {format(new Date(item.scheduled_publish_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.publish_date && format(new Date(item.publish_date), 'dd.MM.yyyy', { locale: ru })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end space-x-2">
                    <a
                      href={`/news/${item.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>

        {news.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Новостей пока нет
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
                {editingNews ? 'Редактировать новость' : 'Новая новость'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <Input
                label="Заголовок"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <Textarea
                label="Краткое описание"
                value={formData.excerpt || ''}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              />

              <Textarea
                label="Содержание"
                required
                rows={8}
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                helperText="Поддерживается HTML"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="URL изображения"
                  value={formData.featured_image || ''}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                />
                <Input
                  label="URL видео"
                  value={formData.video_url || ''}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                />
              </div>

              <Select
                label="Категория"
                options={categories.map(c => ({ value: c.id.toString(), label: c.name }))}
                value={formData.category_id?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) || undefined })}
                placeholder="Выберите категорию"
              />

              {/* Блок публикации */}
              <div className="news-management-publish-section">
                <label className="news-management-publish-label">
                  <CalendarIcon className="news-management-publish-label-icon" />
                  Публикация
                </label>

                <div className="news-management-publish-options">
                  <label
                    className={`news-management-publish-option ${publishMode === 'draft' ? 'news-management-publish-option-active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="publishMode"
                      value="draft"
                      checked={publishMode === 'draft'}
                      onChange={() => setPublishMode('draft')}
                      className="news-management-publish-radio"
                    />
                    <div className="news-management-publish-option-content">
                      <span className="news-management-publish-option-title">Черновик</span>
                      <span className="news-management-publish-option-desc">Сохранить без публикации</span>
                    </div>
                  </label>

                  <label
                    className={`news-management-publish-option ${publishMode === 'now' ? 'news-management-publish-option-active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="publishMode"
                      value="now"
                      checked={publishMode === 'now'}
                      onChange={() => setPublishMode('now')}
                      className="news-management-publish-radio"
                    />
                    <div className="news-management-publish-option-content">
                      <span className="news-management-publish-option-title">Опубликовать сейчас</span>
                      <span className="news-management-publish-option-desc">Новость сразу станет видна</span>
                    </div>
                  </label>

                  <label
                    className={`news-management-publish-option ${publishMode === 'scheduled' ? 'news-management-publish-option-active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="publishMode"
                      value="scheduled"
                      checked={publishMode === 'scheduled'}
                      onChange={() => setPublishMode('scheduled')}
                      className="news-management-publish-radio"
                    />
                    <div className="news-management-publish-option-content">
                      <ClockIcon className="news-management-publish-option-icon" />
                      <span className="news-management-publish-option-title">Отложить публикацию</span>
                      <span className="news-management-publish-option-desc">Опубликовать в указанное время</span>
                    </div>
                  </label>
                </div>

                {/* Дата и время для отложенной публикации */}
                {publishMode === 'scheduled' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="news-management-schedule-picker"
                  >
                    <div className="news-management-schedule-fields">
                      <div className="news-management-schedule-field">
                        <label className="news-management-schedule-field-label">
                          <CalendarIcon className="news-management-schedule-field-icon" />
                          Дата
                        </label>
                        <input
                          type="date"
                          value={scheduledDate}
                          min={getMinDate()}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="news-management-schedule-input"
                        />
                      </div>
                      <div className="news-management-schedule-field">
                        <label className="news-management-schedule-field-label">
                          <ClockIcon className="news-management-schedule-field-icon" />
                          Время
                        </label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="news-management-schedule-input"
                        />
                      </div>
                    </div>
                    {scheduledDate && scheduledTime && (
                      <div className="news-management-schedule-preview">
                        Новость будет опубликована: <strong>{format(new Date(`${scheduledDate}T${scheduledTime}:00`), "d MMMM yyyy 'в' HH:mm", { locale: ru })}</strong>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="mr-2"
                />
                Избранное (на главной)
              </label>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Meta Title (SEO)"
                  value={formData.meta_title || ''}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                />
                <Input
                  label="Meta Description (SEO)"
                  value={formData.meta_description || ''}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} isLoading={saving}>
                {editingNews ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
