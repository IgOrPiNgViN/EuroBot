import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import ReactPlayer from 'react-player'
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

// Функция для получения embed URL из Rutube
const getRutubeEmbedUrl = (url: string): string | null => {
  const patterns = [
    /rutube\.ru\/video\/([a-zA-Z0-9]+)/,
    /rutube\.ru\/play\/embed\/([a-zA-Z0-9]+)/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return `https://rutube.ru/play/embed/${match[1]}`
    }
  }
  return null
}

const isRutubeUrl = (url: string): boolean => url.includes('rutube.ru')

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
      <div className="news-management">
        <div className="news-management-header">
          <h1 className="news-management-title">
            Управление новостями
          </h1>
          <Button onClick={handleCreate} leftIcon={<PlusIcon className="news-management-button-icon" />}>
            Добавить новость
          </Button>
        </div>

        {/* News list */}
        <div className="news-management-list-container">
          <table className="news-management-table">
            <thead className="news-management-table-head">
            <tr>
              <th className="news-management-table-header">Заголовок</th>
              <th className="news-management-table-header">Категория</th>
              <th className="news-management-table-header">Статус</th>
              <th className="news-management-table-header">Дата</th>
              <th className="news-management-table-header news-management-table-header-actions">Действия</th>
            </tr>
            </thead>
            <tbody className="news-management-table-body">
            {news.map((item) => (
                <tr key={item.id} className="news-management-table-row">
                  <td className="news-management-table-cell">
                    <div className="news-management-news-info">
                      {item.featured_image && (
                          <img
                              src={item.featured_image}
                              alt=""
                              className="news-management-news-image"
                          />
                      )}
                      <div>
                        <p className="news-management-news-title">{item.title}</p>
                        {item.is_featured && (
                            <span className="news-management-featured-badge">★ Избранное</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="news-management-table-cell news-management-news-category">
                    {item.category?.name || '—'}
                  </td>
                  <td className="news-management-table-cell">
                  <span className={`news-management-status-badge ${item.is_published ? 'news-management-status-published' : 'news-management-status-draft'}`}>
                    {item.is_published ? 'Опубликовано' : 'Черновик'}
                  </span>
                  </td>
                  <td className="news-management-table-cell news-management-news-date">
                    {item.publish_date && format(new Date(item.publish_date), 'dd.MM.yyyy', { locale: ru })}
                  </td>
                  <td className="news-management-table-cell">
                    <div className="news-management-actions">
                      <a
                          href={`/news/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="news-management-action-button news-management-preview-button"
                      >
                        <EyeIcon className="news-management-action-icon" />
                      </a>
                      <button
                          onClick={() => handleEdit(item)}
                          className="news-management-action-button news-management-edit-button"
                      >
                        <PencilIcon className="news-management-action-icon" />
                      </button>
                      <button
                          onClick={() => handleDelete(item.id)}
                          className="news-management-action-button news-management-delete-button"
                      >
                        <TrashIcon className="news-management-action-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>

          {news.length === 0 && (
              <div className="news-management-empty">
                Новостей пока нет
              </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
            <div className="news-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="news-management-modal"
              >
                <div className="news-management-modal-header">
                  <h2 className="news-management-modal-title">
                    {editingNews ? 'Редактировать новость' : 'Новая новость'}
                  </h2>
                </div>

                <div className="news-management-modal-content">
                  <div className="news-management-modal-two-columns">
                    {/* Первая колонка */}
                    <div className="news-management-modal-column-left">
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
                          rows={6}
                          value={formData.content || ''}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          helperText="Поддерживается HTML"
                      />
                    </div>

                    {/* Вторая колонка */}
                    <div className="news-management-modal-column-right">
                      <div className="news-management-modal-grid">
                        <Input
                            label="URL изображения"
                            value={formData.featured_image || ''}
                            onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                        />
                        <Input
                            label="URL видео"
                            value={formData.video_url || ''}
                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                            helperText="YouTube, Vimeo, Rutube и др."
                        />
                      </div>

                      {/* Video Preview */}
                      {formData.video_url && (isRutubeUrl(formData.video_url) || ReactPlayer.canPlay(formData.video_url)) && (
                          <div className="news-management-preview-section">
                            <label className="news-management-preview-label">
                              Превью видео
                            </label>
                            <div className="news-management-video-preview">
                              {isRutubeUrl(formData.video_url) ? (
                                  <iframe
                                      src={getRutubeEmbedUrl(formData.video_url) || formData.video_url}
                                      width="100%"
                                      height="100%"
                                      frameBorder="0"
                                      allow="clipboard-write; autoplay"
                                      allowFullScreen
                                      className="news-management-video-iframe"
                                  />
                              ) : (
                                  <ReactPlayer
                                      url={formData.video_url}
                                      width="100%"
                                      height="100%"
                                      controls
                                      light
                                  />
                              )}
                            </div>
                          </div>
                      )}

                      {/* Image Preview */}
                      {formData.featured_image && (
                          <div className="news-management-preview-section">
                            <label className="news-management-preview-label">
                              Превью изображения
                            </label>
                            <img
                                src={formData.featured_image}
                                alt="Preview"
                                className="news-management-image-preview"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                          </div>
                      )}

                      <Select
                          label="Категория"
                          options={categories.map(c => ({ value: c.id.toString(), label: c.name }))}
                          value={formData.category_id?.toString() || ''}
                          onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) || undefined })}
                          placeholder="Выберите категорию"
                      />

                      <div className="news-management-checkboxes">
                        <label className="news-management-checkbox-label">
                          <input
                              type="checkbox"
                              checked={formData.is_published}
                              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                              className="news-management-checkbox"
                          />
                          Опубликовать
                        </label>
                        <label className="news-management-checkbox-label">
                          <input
                              type="checkbox"
                              checked={formData.is_featured}
                              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                              className="news-management-checkbox"
                          />
                          Избранное (на главной)
                        </label>
                      </div>

                      <div className="news-management-modal-grid">
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
                  </div>
                </div>

                <div className="news-management-modal-footer">
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