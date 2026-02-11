import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { partnersApi, PartnerCreateData } from '../../api/partners'
import { Partner, PartnerCategory } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import '../../styles/pages/admin/PartnersManagement.css'

const categoryOptions = [
  { value: 'general', label: 'Генеральный партнёр' },
  { value: 'official', label: 'Официальный партнёр' },
  { value: 'technology', label: 'Технологический партнёр' },
  { value: 'educational', label: 'Образовательный партнёр' },
  { value: 'media', label: 'СМИ партнёр' }
]

// Парсер для URL генерального партнера
const parseGeneralPartnerUrl = (url: string): { logo: string; background?: string } => {
  if (!url) return { logo: '', background: undefined }

  // Проверяем наличие разделителя "|"
  if (url.includes('|')) {
    const [logo, background] = url.split('|').map(s => s.trim())
    return { logo, background }
  }

  // Если нет разделителя, возвращаем весь URL как логотип
  return { logo: url, background: undefined }
}

// Сборщик URL для генерального партнера
const buildGeneralPartnerUrl = (logo: string, background?: string): string => {
  if (!logo) return ''

  if (background && background.trim()) {
    return `${logo.trim()}|${background.trim()}`
  }

  return logo.trim()
}

export default function PartnersManagement() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [formData, setFormData] = useState<Partial<PartnerCreateData>>({})
  const [saving, setSaving] = useState(false)

  // Дополнительные поля для генерального партнера
  const [generalPartnerLogo, setGeneralPartnerLogo] = useState('')
  const [generalPartnerBackground, setGeneralPartnerBackground] = useState('')

  const fetchPartners = async () => {
    try {
      const data = await partnersApi.getList()
      setPartners(data)
    } catch (error) {
      console.error('Failed to fetch partners:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  const handleCreate = () => {
    setEditingPartner(null)
    setFormData({ is_active: true, display_order: 0 })
    setGeneralPartnerLogo('')
    setGeneralPartnerBackground('')
    setShowModal(true)
  }

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner)

    // Для генеральных партнеров парсим URL
    let logoUrl = partner.logo
    let backgroundUrl = undefined

    if (partner.category === 'general') {
      const parsed = parseGeneralPartnerUrl(partner.logo)
      logoUrl = parsed.logo
      backgroundUrl = parsed.background
      setGeneralPartnerLogo(parsed.logo)
      setGeneralPartnerBackground(parsed.background || '')
    } else {
      setGeneralPartnerLogo('')
      setGeneralPartnerBackground('')
    }

    setFormData({
      name: partner.name,
      category: partner.category,
      logo: logoUrl,
      website: partner.website || '',
      description: partner.description || '',
      is_active: partner.is_active,
      display_order: partner.display_order
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этого партнёра?')) return

    try {
      await partnersApi.delete(id)
      setPartners(partners.filter(p => p.id !== id))
      toast.success('Партнёр удалён')
    } catch (error) {
      toast.error('Ошибка при удалении')
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      toast.error('Заполните обязательные поля')
      return
    }

    // Проверка URL для всех партнеров
    let logoUrl = formData.logo || ''

    // Для генеральных партнеров собираем URL с разделителем
    if (formData.category === 'general') {
      if (!generalPartnerLogo) {
        toast.error('Заполните URL логотипа для генерального партнера')
        return
      }
      logoUrl = buildGeneralPartnerUrl(generalPartnerLogo, generalPartnerBackground)
    } else if (!formData.logo) {
      toast.error('Заполните URL логотипа')
      return
    }

    setSaving(true)
    try {
      const dataToSave = {
        ...formData,
        logo: logoUrl
      }

      if (editingPartner) {
        await partnersApi.update(editingPartner.id, dataToSave)
        toast.success('Партнёр обновлён')
      } else {
        await partnersApi.create(dataToSave as PartnerCreateData)
        toast.success('Партнёр добавлен')
      }
      setShowModal(false)
      fetchPartners()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  // Group partners by category
  const groupedPartners: Record<string, Partner[]> = {}
  categoryOptions.forEach(cat => {
    groupedPartners[cat.value] = partners.filter(p => p.category === cat.value)
  })

  return (
      <div className="partners-management">
        <div className="partners-management-header">
          <h1 className="partners-management-title">
            Управление партнёрами
          </h1>
          <Button onClick={handleCreate} leftIcon={<PlusIcon className="partners-management-button-icon" />}>
            Добавить партнёра
          </Button>
        </div>

        {/* Partners by category */}
        <div className="partners-management-categories">
          {categoryOptions.map((category) => (
              <div key={category.value} className="partners-management-category">
                <h3 className="partners-management-category-title">{category.label}</h3>

                {groupedPartners[category.value].length > 0 ? (
                    <div className="partners-management-grid">
                      {groupedPartners[category.value].map((partner) => (
                          <div
                              key={partner.id}
                              className={`partners-management-card ${partner.is_active ? 'partners-management-card-active' : 'partners-management-card-inactive'}`}
                          >
                            <img
                                src={parseGeneralPartnerUrl(partner.logo).logo}
                                alt={partner.name}
                                className="partners-management-logo"
                            />
                            <p className="partners-management-name">{partner.name}</p>

                            <div className="partners-management-card-actions">
                              <button
                                  onClick={() => handleEdit(partner)}
                                  className="partners-management-action-button partners-management-edit-button"
                              >
                                <PencilIcon className="partners-management-action-icon" />
                              </button>
                              <button
                                  onClick={() => handleDelete(partner.id)}
                                  className="partners-management-action-button partners-management-delete-button"
                              >
                                <TrashIcon className="partners-management-action-icon" />
                              </button>
                            </div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <p className="partners-management-empty-category">Нет партнёров в этой категории</p>
                )}
              </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
            <div className="partners-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="partners-management-modal"
              >
                <div className="partners-management-modal-header">
                  <h2 className="partners-management-modal-title">
                    {editingPartner ? 'Редактировать партнёра' : 'Новый партнёр'}
                  </h2>
                </div>

                <div className="partners-management-modal-content">
                  <Input
                      label="Название"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />

                  <Select
                      label="Категория"
                      required
                      options={categoryOptions}
                      value={formData.category || ''}
                      onChange={(e) => {
                        const category = e.target.value as PartnerCategory
                        setFormData({ ...formData, category })
                        // Сбрасываем URL при смене категории
                        if (category !== 'general') {
                          setGeneralPartnerLogo('')
                          setGeneralPartnerBackground('')
                        }
                      }}
                      placeholder="Выберите категорию"
                  />

                  {/* Для генеральных партнеров - два поля */}
                  {formData.category === 'general' ? (
                      <>
                        <Input
                            label="URL логотипа (обязательно)"
                            required
                            value={generalPartnerLogo || ''}
                            onChange={(e) => setGeneralPartnerLogo(e.target.value)}
                            placeholder="https://..."
                        />

                        <Input
                            label="URL фона (необязательно)"
                            value={generalPartnerBackground || ''}
                            onChange={(e) => setGeneralPartnerBackground(e.target.value)}
                            placeholder="https://..."
                        />

                        {generalPartnerLogo && (
                            <div className="partners-management-logo-preview">
                              <img
                                  src={generalPartnerLogo}
                                  alt="Preview логотипа"
                                  className="partners-management-logo-preview-image"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            </div>
                        )}
                      </>
                  ) : (
                      <>
                        <Input
                            label="URL логотипа"
                            required
                            value={formData.logo || ''}
                            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                            placeholder="https://..."
                        />

                        {formData.logo && (
                            <div className="partners-management-logo-preview">
                              <img
                                  src={formData.logo}
                                  alt="Preview"
                                  className="partners-management-logo-preview-image"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            </div>
                        )}
                      </>
                  )}

                  <Input
                      label="Сайт"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                  />

                  <Textarea
                      label="Описание"
                      rows={2}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />

                  <div className="partners-management-settings">
                    <label className="partners-management-checkbox-label">
                      <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="partners-management-checkbox"
                      />
                      Активен
                    </label>
                    <div className="partners-management-order">
                      <span className="partners-management-order-label">Порядок:</span>
                      <input
                          type="number"
                          value={formData.display_order || 0}
                          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                          className="partners-management-order-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="partners-management-modal-footer">
                  <Button variant="ghost" onClick={() => setShowModal(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleSave} isLoading={saving}>
                    {editingPartner ? 'Сохранить' : 'Добавить'}
                  </Button>
                </div>
              </motion.div>
            </div>
        )}
      </div>
  )
}