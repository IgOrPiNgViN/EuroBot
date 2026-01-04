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

const categoryOptions = [
  { value: 'general', label: 'Генеральный партнёр' },
  { value: 'official', label: 'Официальный партнёр' },
  { value: 'technology', label: 'Технологический партнёр' },
  { value: 'educational', label: 'Образовательный партнёр' },
  { value: 'media', label: 'СМИ партнёр' }
]

export default function PartnersManagement() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [formData, setFormData] = useState<Partial<PartnerCreateData>>({})
  const [saving, setSaving] = useState(false)

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
    setShowModal(true)
  }

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner)
    setFormData({
      name: partner.name,
      category: partner.category,
      logo: partner.logo,
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
    if (!formData.name || !formData.logo || !formData.category) {
      toast.error('Заполните обязательные поля')
      return
    }

    setSaving(true)
    try {
      if (editingPartner) {
        await partnersApi.update(editingPartner.id, formData)
        toast.success('Партнёр обновлён')
      } else {
        await partnersApi.create(formData as PartnerCreateData)
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Управление партнёрами
        </h1>
        <Button onClick={handleCreate} leftIcon={<PlusIcon className="w-5 h-5" />}>
          Добавить партнёра
        </Button>
      </div>

      {/* Partners by category */}
      <div className="space-y-6">
        {categoryOptions.map((category) => (
          <div key={category.value} className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-heading font-semibold text-lg mb-4">{category.label}</h3>
            
            {groupedPartners[category.value].length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {groupedPartners[category.value].map((partner) => (
                  <div
                    key={partner.id}
                    className={`relative group p-4 border rounded-lg ${
                      partner.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="h-12 object-contain mx-auto mb-2"
                    />
                    <p className="text-xs text-center text-gray-600 truncate">{partner.name}</p>
                    
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <button
                        onClick={() => handleEdit(partner)}
                        className="p-1 bg-white rounded shadow text-gray-400 hover:text-blue-600"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(partner.id)}
                        className="p-1 bg-white rounded shadow text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Нет партнёров в этой категории</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-heading font-bold">
                {editingPartner ? 'Редактировать партнёра' : 'Новый партнёр'}
              </h2>
            </div>
            
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
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
                onChange={(e) => setFormData({ ...formData, category: e.target.value as PartnerCategory })}
                placeholder="Выберите категорию"
              />

              <Input
                label="URL логотипа"
                required
                value={formData.logo || ''}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://..."
              />

              {formData.logo && (
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <img
                    src={formData.logo}
                    alt="Preview"
                    className="h-12 object-contain mx-auto"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
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

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  Активен
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Порядок:</span>
                  <input
                    type="number"
                    value={formData.display_order || 0}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-16 input py-1"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3 flex-shrink-0">
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



