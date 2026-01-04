import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { newsApi, NewsCreateData } from '../../api/news'
import { News, NewsCategory } from '../../types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'

export default function NewsManagement() {
  const [news, setNews] = useState<News[]>([])
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [formData, setFormData] = useState<Partial<NewsCreateData>>({})
  const [saving, setSaving] = useState(false)

  const fetchNews = async () => {
    try {
      const [newsData, categoriesData] = await Promise.all([
        newsApi.getList({ limit: 50 }),
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

    setSaving(true)
    try {
      if (editingNews) {
        await newsApi.update(editingNews.id, formData)
        toast.success('Новость обновлена')
      } else {
        await newsApi.create(formData as NewsCreateData)
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
            {news.map((item) => (
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.is_published
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.is_published ? 'Опубликовано' : 'Черновик'}
                  </span>
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
            ))}
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

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="mr-2"
                  />
                  Опубликовать
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="mr-2"
                  />
                  Избранное (на главной)
                </label>
              </div>

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



