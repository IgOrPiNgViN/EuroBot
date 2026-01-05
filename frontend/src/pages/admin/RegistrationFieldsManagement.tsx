import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Bars3Icon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { seasonsApi } from '../../api/seasons'
import apiClient from '../../api/client'
import { Season } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'

// Словарь типов полей на русском
const FIELD_TYPE_LABELS: Record<string, string> = {
  'text': 'Текст',
  'email': 'Email',
  'phone': 'Телефон',
  'number': 'Число',
  'select': 'Список',
  'checkbox': 'Галочка',
  'textarea': 'Текст',
  'url': 'Ссылка',
  'date': 'Дата',
  'array': 'Список'
}

// Текущие поля формы регистрации
const CURRENT_FORM_FIELDS = [
  { name: 'name', label: 'Название команды', type: 'text', required: true, section: 'main' },
  { name: 'email', label: 'Email команды', type: 'email', required: true, section: 'contact' },
  { name: 'phone', label: 'Телефон', type: 'phone', required: true, section: 'contact' },
  { name: 'organization', label: 'Организация / Школа / Университет', type: 'text', required: true, section: 'main' },
  { name: 'region', label: 'Регион', type: 'text', required: true, section: 'main' },
  { name: 'participants_count', label: 'Количество участников', type: 'number', required: true, section: 'main' }
]

interface RegistrationField {
  id: number
  season_id: number
  name: string
  label: string
  field_type: string
  options: string[] | null
  is_required: boolean
  display_order: number
  is_active: boolean
}

interface FieldFormData {
  name: string
  label: string
  field_type: string
  options: string
  is_required: boolean
  display_order: number
  is_active: boolean
}

const FIELD_TYPES = [
  { value: 'text', label: 'Текстовое поле' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Телефон' },
  { value: 'number', label: 'Число' },
  { value: 'select', label: 'Выпадающий список' },
  { value: 'checkbox', label: 'Чекбокс' },
  { value: 'textarea', label: 'Многострочный текст' },
  { value: 'url', label: 'Ссылка (URL)' },
  { value: 'date', label: 'Дата' }
]

// Предустановленные поля (базовые)
const DEFAULT_FIELDS = [
  { name: 'name', label: 'Название команды', field_type: 'text', is_required: true },
  { name: 'email', label: 'Email команды', field_type: 'email', is_required: true },
  { name: 'phone', label: 'Телефон', field_type: 'phone', is_required: true },
  { name: 'organization', label: 'Организация / Школа / Университет', field_type: 'text', is_required: true },
  { name: 'region', label: 'Регион', field_type: 'text', is_required: true },
  { name: 'participants_count', label: 'Количество участников', field_type: 'number', is_required: true }
]

export default function RegistrationFieldsManagement() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [fields, setFields] = useState<RegistrationField[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingField, setEditingField] = useState<RegistrationField | null>(null)
  const [formData, setFormData] = useState<FieldFormData>({
    name: '',
    label: '',
    field_type: 'text',
    options: '',
    is_required: false,
    display_order: 0,
    is_active: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSeasons()
  }, [])

  useEffect(() => {
    if (selectedSeasonId) {
      fetchFields(selectedSeasonId)
    }
  }, [selectedSeasonId])

  const fetchSeasons = async () => {
    try {
      const data = await seasonsApi.getList(false, true)
      setSeasons(data)
      // Select current season by default
      const current = data.find(s => s.is_current)
      if (current) {
        setSelectedSeasonId(current.id)
      } else if (data.length > 0) {
        setSelectedSeasonId(data[0].id)
      }
    } catch (error) {
      toast.error('Ошибка загрузки сезонов')
    } finally {
      setLoading(false)
    }
  }

  const fetchFields = async (seasonId: number) => {
    try {
      const response = await apiClient.get(`/seasons/${seasonId}/fields`)
      setFields(response.data)
    } catch (error) {
      console.error('Failed to fetch fields:', error)
    }
  }

  const handleCreate = () => {
    setEditingField(null)
    setFormData({
      name: '',
      label: '',
      field_type: 'text',
      options: '',
      is_required: false,
      display_order: fields.length,
      is_active: true
    })
    setShowModal(true)
  }

  const handleEdit = (field: RegistrationField) => {
    setEditingField(field)
    setFormData({
      name: field.name,
      label: field.label,
      field_type: field.field_type,
      options: field.options?.join('\n') || '',
      is_required: field.is_required,
      display_order: field.display_order,
      is_active: field.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это поле?')) return

    try {
      await apiClient.delete(`/seasons/fields/${id}`)
      toast.success('Поле удалено')
      if (selectedSeasonId) fetchFields(selectedSeasonId)
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.label) {
      toast.error('Заполните название и подпись поля')
      return
    }

    if (!selectedSeasonId) return

    setSaving(true)
    try {
      const payload = {
        ...formData,
        options: formData.options.trim() ? formData.options.split('\n').filter(o => o.trim()) : null
      }

      if (editingField) {
        await apiClient.patch(`/seasons/fields/${editingField.id}`, payload)
        toast.success('Поле обновлено')
      } else {
        await apiClient.post(`/seasons/${selectedSeasonId}/fields`, payload)
        toast.success('Поле добавлено')
      }
      
      setShowModal(false)
      fetchFields(selectedSeasonId)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (field: RegistrationField) => {
    try {
      await apiClient.patch(`/seasons/fields/${field.id}`, {
        is_active: !field.is_active
      })
      if (selectedSeasonId) fetchFields(selectedSeasonId)
    } catch (error) {
      toast.error('Ошибка обновления')
    }
  }

  const handleAddDefaultFields = async () => {
    if (!selectedSeasonId) return
    if (!confirm('Добавить стандартные поля регистрации? Это добавит базовые поля, необходимые для регистрации команды.')) return

    try {
      for (let i = 0; i < DEFAULT_FIELDS.length; i++) {
        const field = DEFAULT_FIELDS[i]
        await apiClient.post(`/seasons/${selectedSeasonId}/fields`, {
          ...field,
          display_order: i,
          is_active: true,
          options: field.options || null
        })
      }
      toast.success('Стандартные поля добавлены!')
      fetchFields(selectedSeasonId)
    } catch (error) {
      toast.error('Ошибка добавления полей')
    }
  }

  const [showPreview, setShowPreview] = useState(true)

  if (loading) {
    return <LoadingSpinner />
  }

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Поля регистрации команд
          </h1>
          <p className="text-gray-500">
            Просмотр и настройка формы регистрации команд
          </p>
        </div>
      </div>

      {/* Current Form Preview */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <EyeIcon className="w-5 h-5 text-eurobot-blue" />
            <span className="font-semibold text-gray-900">Текущая форма регистрации</span>
            <span className="text-sm text-gray-500">({CURRENT_FORM_FIELDS.length} полей)</span>
          </div>
          <span className="text-gray-400 text-sm">
            {showPreview ? 'Скрыть' : 'Показать'}
          </span>
        </button>
        
        {showPreview && (
          <div className="border-t p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main info */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 text-sm mb-3">📋 Основная информация</h4>
                {CURRENT_FORM_FIELDS.filter(f => f.section === 'main').map(field => (
                  <div key={field.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-700">{field.label}</span>
                    <div className="flex items-center gap-1">
                      {field.required && <span className="text-red-500">*</span>}
                      <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                        {FIELD_TYPE_LABELS[field.type] || field.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 text-sm mb-3">📞 Контактные данные</h4>
                {CURRENT_FORM_FIELDS.filter(f => f.section === 'contact').map(field => (
                  <div key={field.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-700">{field.label}</span>
                    <div className="flex items-center gap-1">
                      {field.required && <span className="text-red-500">*</span>}
                      <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                        {FIELD_TYPE_LABELS[field.type] || field.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                ℹ️ Эти поля зашиты в код формы регистрации. Для добавления новых полей используйте раздел ниже.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Season Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Дополнительные поля для сезона</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-64">
            <Select
              label="Сезон"
              options={seasons.map(s => ({ value: s.id.toString(), label: s.name }))}
              value={selectedSeasonId?.toString() || ''}
              onChange={(e) => setSelectedSeasonId(parseInt(e.target.value))}
            />
          </div>
          
          <div className="flex gap-2 ml-auto">
            {fields.length === 0 && (
              <Button
                variant="outline"
                onClick={handleAddDefaultFields}
                leftIcon={<DocumentTextIcon className="w-5 h-5" />}
              >
                Добавить стандартные поля
              </Button>
            )}
            <Button
              onClick={handleCreate}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Добавить поле
            </Button>
          </div>
        </div>
      </div>

      {/* Info */}
      {selectedSeason && (
        <div className={`rounded-xl p-4 mb-6 ${
          selectedSeason.registration_open 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <p className={`text-sm ${
            selectedSeason.registration_open ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {selectedSeason.registration_open 
              ? '✅ Регистрация открыта — изменения применятся сразу к форме' 
              : '⚠️ Регистрация закрыта — можете спокойно настраивать поля'}
          </p>
        </div>
      )}

      {/* Fields List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {fields.length > 0 ? (
          <div className="divide-y">
            {fields.sort((a, b) => a.display_order - b.display_order).map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 flex items-center gap-4 ${
                  !field.is_active ? 'bg-gray-50 opacity-60' : ''
                }`}
              >
                <div className="text-gray-400 cursor-move">
                  <Bars3Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{field.label}</span>
                    {field.is_required && (
                      <span className="text-red-500 text-xs">*обязательное</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {field.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                    </span>
                    {field.options && field.options.length > 0 && (
                      <span className="text-xs text-gray-400">
                        ({field.options.length} опций)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(field)}
                    className={`p-2 rounded-lg ${
                      field.is_active 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={field.is_active ? 'Активно' : 'Отключено'}
                  >
                    {field.is_active 
                      ? <CheckCircleIcon className="w-5 h-5" />
                      : <XCircleIcon className="w-5 h-5" />
                    }
                  </button>
                  <button
                    onClick={() => handleEdit(field)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Поля регистрации не настроены</p>
            <Button
              onClick={handleAddDefaultFields}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Добавить стандартные поля
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-heading font-bold">
                {editingField ? 'Редактировать поле' : 'Новое поле'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <Input
                label="Системное имя поля"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                placeholder="например: team_size"
                helperText="Только латинские буквы, цифры и _"
                required
              />

              <Input
                label="Подпись (что увидит пользователь)"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="например: Количество участников"
                required
              />

              <Select
                label="Тип поля"
                options={FIELD_TYPES}
                value={formData.field_type}
                onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
              />

              {formData.field_type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Варианты выбора
                  </label>
                  <textarea
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eurobot-blue focus:border-transparent"
                    rows={4}
                    placeholder="value1:Отображаемый текст 1&#10;value2:Отображаемый текст 2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    По одному варианту на строку. Формат: значение:подпись
                  </p>
                </div>
              )}

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Обязательное поле</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Активно</span>
                </label>
              </div>

              <Input
                label="Порядок отображения"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} isLoading={saving}>
                {editingField ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

