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
  EyeIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'
import { seasonsApi } from '../../api/seasons'
import { settingsApi } from '../../api/settings'
import { teamsApi } from '../../api/teams'
import apiClient from '../../api/client'
import { Season } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import '../../styles/pages/admin/RegistrationFieldsManagement.css'

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
  const [showPreview, setShowPreview] = useState(true)
  const [formType, setFormType] = useState<'new' | 'old'>('new')
  const [formTypeSaving, setFormTypeSaving] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvResult, setCsvResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)

  const fetchFormType = async () => {
    try {
      const value = await settingsApi.get('registration_form_type')
      if (value === 'old') setFormType('old')
      else setFormType('new')
    } catch {
      setFormType('new')
    }
  }

  const handleFormTypeToggle = async (type: 'new' | 'old') => {
    setFormTypeSaving(true)
    try {
      await settingsApi.update('registration_form_type', type)
      setFormType(type)
      toast.success(type === 'old' ? 'Включена старая форма регистрации' : 'Включена новая форма регистрации')
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setFormTypeSaving(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await teamsApi.downloadCsvTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'teams_template.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Ошибка скачивания шаблона')
    }
  }

  const handleCsvUpload = async () => {
    if (!csvFile || !selectedSeasonId) return

    setCsvUploading(true)
    setCsvResult(null)
    try {
      const result = await teamsApi.importCsv(csvFile, selectedSeasonId)
      setCsvResult(result)
      if (result.imported > 0) {
        toast.success(`Импортировано команд: ${result.imported}`)
      }
      if (result.skipped > 0) {
        toast(`Пропущено: ${result.skipped}`, { icon: '⚠️' })
      }
      setCsvFile(null)
      const fileInput = document.getElementById('csv-file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка импорта CSV')
    } finally {
      setCsvUploading(false)
    }
  }

  useEffect(() => {
    fetchSeasons()
    fetchFormType()
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
          options: (field as Record<string, unknown>).options || null
        })
      }
      toast.success('Стандартные поля добавлены!')
      fetchFields(selectedSeasonId)
    } catch (error) {
      toast.error('Ошибка добавления полей')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId)

  return (
      <div className="registration-fields-management">
        <div className="registration-fields-header">
          <div>
            <h1 className="registration-fields-title">
              Поля регистрации команд
            </h1>
            <p className="registration-fields-subtitle">
              Просмотр и настройка формы регистрации команд
            </p>
          </div>
        </div>

        {/* Form Type Toggle */}
        <div className="registration-form-type-toggle">
          <h3 className="registration-form-type-title">Тип формы регистрации</h3>
          <p className="registration-form-type-description">
            Выберите, какая форма регистрации будет отображаться на сайте
          </p>
          <div className="registration-form-type-options">
            <button
                className={`registration-form-type-option ${formType === 'new' ? 'registration-form-type-option-active' : ''}`}
                onClick={() => handleFormTypeToggle('new')}
                disabled={formTypeSaving}
            >
              <div className="registration-form-type-option-indicator">
                <div className={`registration-form-type-option-dot ${formType === 'new' ? 'registration-form-type-option-dot-active' : ''}`} />
              </div>
              <div className="registration-form-type-option-content">
                <span className="registration-form-type-option-label">Новая форма</span>
                <span className="registration-form-type-option-desc">
                  Форма регистрации на нашем сайте с кастомными полями
                </span>
              </div>
            </button>
            <button
                className={`registration-form-type-option ${formType === 'old' ? 'registration-form-type-option-active' : ''}`}
                onClick={() => handleFormTypeToggle('old')}
                disabled={formTypeSaving}
            >
              <div className="registration-form-type-option-indicator">
                <div className={`registration-form-type-option-dot ${formType === 'old' ? 'registration-form-type-option-dot-active' : ''}`} />
              </div>
              <div className="registration-form-type-option-content">
                <span className="registration-form-type-option-label">Старая форма (eurobotrussia.ru)</span>
                <span className="registration-form-type-option-desc">
                  Перенаправление на форму старого сайта eurobotrussia.ru/eurobot2026#reg
                </span>
              </div>
            </button>
          </div>
          {formTypeSaving && (
              <p className="registration-form-type-saving">Сохранение...</p>
          )}
        </div>

        {/* CSV Import — visible when old form is selected */}
        {formType === 'old' && (
          <div className="csv-import-section">
            <div className="csv-import-header">
              <TableCellsIcon className="csv-import-header-icon" />
              <div>
                <h3 className="csv-import-title">Импорт участников из CSV</h3>
                <p className="csv-import-description">
                  Загрузите список команд, зарегистрированных на старом сайте
                </p>
              </div>
            </div>

            <div className="csv-import-body">
              <div className="csv-import-template">
                <p className="csv-import-template-text">
                  Скачайте шаблон CSV с правильными заголовками столбцов. Разделитель — точка с запятой (;), кодировка — UTF-8.
                </p>
                <button
                  className="csv-import-template-button"
                  onClick={handleDownloadTemplate}
                >
                  <ArrowDownTrayIcon className="csv-import-button-icon" />
                  Скачать шаблон
                </button>
              </div>

              <div className="csv-import-upload">
                <div className="csv-import-season-select">
                  <Select
                    label="Сезон для импорта"
                    options={seasons.map(s => ({ value: s.id.toString(), label: s.name }))}
                    value={selectedSeasonId?.toString() || ''}
                    onChange={(e) => setSelectedSeasonId(parseInt(e.target.value))}
                  />
                </div>

                <div className="csv-import-file-area">
                  <label htmlFor="csv-file-input" className="csv-import-file-label">
                    <ArrowUpTrayIcon className="csv-import-file-icon" />
                    <span className="csv-import-file-text">
                      {csvFile ? csvFile.name : 'Выберите CSV файл'}
                    </span>
                    {csvFile && (
                      <span className="csv-import-file-size">
                        {(csvFile.size / 1024).toFixed(1)} КБ
                      </span>
                    )}
                  </label>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="csv-import-file-input"
                    onChange={(e) => {
                      setCsvFile(e.target.files?.[0] || null)
                      setCsvResult(null)
                    }}
                  />
                </div>

                <Button
                  onClick={handleCsvUpload}
                  isLoading={csvUploading}
                  disabled={!csvFile || !selectedSeasonId || csvUploading}
                  leftIcon={<ArrowUpTrayIcon className="csv-import-button-icon" />}
                >
                  Импортировать
                </Button>
              </div>

              {csvResult && (
                <div className="csv-import-result">
                  <div className="csv-import-result-stats">
                    <div className="csv-import-stat csv-import-stat-success">
                      <span className="csv-import-stat-number">{csvResult.imported}</span>
                      <span className="csv-import-stat-label">импортировано</span>
                    </div>
                    <div className="csv-import-stat csv-import-stat-warning">
                      <span className="csv-import-stat-number">{csvResult.skipped}</span>
                      <span className="csv-import-stat-label">пропущено</span>
                    </div>
                  </div>
                  {csvResult.errors.length > 0 && (
                    <div className="csv-import-errors">
                      <p className="csv-import-errors-title">Подробности:</p>
                      <ul className="csv-import-errors-list">
                        {csvResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Form Preview */}
        <div className="registration-fields-preview-container">
          <button
              onClick={() => setShowPreview(!showPreview)}
              className="registration-fields-preview-toggle"
          >
            <div className="registration-fields-preview-header">
              <EyeIcon className="registration-fields-preview-icon" />
              <span className="registration-fields-preview-title">Текущая форма регистрации</span>
              <span className="registration-fields-preview-count">({CURRENT_FORM_FIELDS.length} полей)</span>
            </div>
            <span className="registration-fields-preview-toggle-text">
            {showPreview ? 'Скрыть' : 'Показать'}
          </span>
          </button>

          {showPreview && (
              <div className="registration-fields-preview-content">
                <div className="registration-fields-preview-grid">
                  {/* Main info */}
                  <div className="registration-fields-preview-section">
                    <h4 className="registration-fields-preview-section-title">📋 Основная информация</h4>
                    {CURRENT_FORM_FIELDS.filter(f => f.section === 'main').map(field => (
                        <div key={field.name} className="registration-fields-preview-field">
                          <span className="registration-fields-preview-field-label">{field.label}</span>
                          <div className="registration-fields-preview-field-meta">
                            {field.required && <span className="registration-fields-required-indicator">*</span>}
                            <span className="registration-fields-field-type-badge">
                        {FIELD_TYPE_LABELS[field.type] || field.type}
                      </span>
                          </div>
                        </div>
                    ))}
                  </div>

                  {/* Contact */}
                  <div className="registration-fields-preview-section">
                    <h4 className="registration-fields-preview-section-title">📞 Контактные данные</h4>
                    {CURRENT_FORM_FIELDS.filter(f => f.section === 'contact').map(field => (
                        <div key={field.name} className="registration-fields-preview-field">
                          <span className="registration-fields-preview-field-label">{field.label}</span>
                          <div className="registration-fields-preview-field-meta">
                            {field.required && <span className="registration-fields-required-indicator">*</span>}
                            <span className="registration-fields-field-type-badge">
                        {FIELD_TYPE_LABELS[field.type] || field.type}
                      </span>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                <div className="registration-fields-preview-info">
                  <p className="registration-fields-preview-info-text">
                    ℹ️ Эти поля зашиты в код формы регистрации. Для добавления новых полей используйте раздел ниже.
                  </p>
                </div>
              </div>
          )}
        </div>

        {/* Season Selector */}
        <div className="registration-fields-season-selector">
          <h3 className="registration-fields-season-title">Дополнительные поля для сезона</h3>
          <div className="registration-fields-season-controls">
            <div className="registration-fields-season-dropdown">
              <Select
                  label="Сезон"
                  options={seasons.map(s => ({ value: s.id.toString(), label: s.name }))}
                  value={selectedSeasonId?.toString() || ''}
                  onChange={(e) => setSelectedSeasonId(parseInt(e.target.value))}
              />
            </div>

            <div className="registration-fields-season-buttons">
              {fields.length === 0 && (
                  <Button
                      variant="outline"
                      onClick={handleAddDefaultFields}
                      leftIcon={<DocumentTextIcon className="registration-fields-button-icon" />}
                  >
                    Добавить стандартные поля
                  </Button>
              )}
              <Button
                  onClick={handleCreate}
                  leftIcon={<PlusIcon className="registration-fields-button-icon" />}
              >
                Добавить поле
              </Button>
            </div>
          </div>
        </div>

        {/* Info */}
        {selectedSeason && (
            <div className={`registration-fields-season-info ${selectedSeason.registration_open ? 'registration-fields-season-open' : 'registration-fields-season-closed'}`}>
              <p className="registration-fields-season-info-text">
                {selectedSeason.registration_open
                    ? '✅ Регистрация открыта — изменения применятся сразу к форме'
                    : '⚠️ Регистрация закрыта — можете спокойно настраивать поля'}
              </p>
            </div>
        )}

        {/* Fields List */}
        <div className="registration-fields-list-container">
          {fields.length > 0 ? (
              <div className="registration-fields-list">
                {fields.sort((a, b) => a.display_order - b.display_order).map((field, _index) => (
                    <motion.div
                        key={field.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`registration-fields-item ${!field.is_active ? 'registration-fields-item-inactive' : ''}`}
                    >
                      <div className="registration-fields-drag-handle">
                        <Bars3Icon className="registration-fields-drag-icon" />
                      </div>

                      <div className="registration-fields-content">
                        <div className="registration-fields-header-info">
                          <span className="registration-fields-label">{field.label}</span>
                          {field.is_required && (
                              <span className="registration-fields-required">*обязательное</span>
                          )}
                        </div>
                        <div className="registration-fields-meta">
                    <span className="registration-fields-name">
                      {field.name}
                    </span>
                          <span className="registration-fields-type">
                      {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                    </span>
                          {field.options && field.options.length > 0 && (
                              <span className="registration-fields-options-count">
                        ({field.options.length} опций)
                      </span>
                          )}
                        </div>
                      </div>

                      <div className="registration-fields-actions">
                        <button
                            onClick={() => handleToggleActive(field)}
                            className={`registration-fields-toggle-button ${field.is_active ? 'registration-fields-toggle-active' : 'registration-fields-toggle-inactive'}`}
                            title={field.is_active ? 'Активно' : 'Отключено'}
                        >
                          {field.is_active
                              ? <CheckCircleIcon className="registration-fields-toggle-icon" />
                              : <XCircleIcon className="registration-fields-toggle-icon" />
                          }
                        </button>
                        <button
                            onClick={() => handleEdit(field)}
                            className="registration-fields-edit-button"
                        >
                          <PencilIcon className="registration-fields-action-icon" />
                        </button>
                        <button
                            onClick={() => handleDelete(field.id)}
                            className="registration-fields-delete-button"
                        >
                          <TrashIcon className="registration-fields-action-icon" />
                        </button>
                      </div>
                    </motion.div>
                ))}
              </div>
          ) : (
              <div className="registration-fields-empty">
                <DocumentTextIcon className="registration-fields-empty-icon" />
                <p className="registration-fields-empty-text">Поля регистрации не настроены</p>
                <Button
                    onClick={handleAddDefaultFields}
                    leftIcon={<PlusIcon className="registration-fields-button-icon" />}
                    className="registration-fields-empty-button"
                >
                  Добавить стандартные поля
                </Button>
              </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
            <div className="registration-fields-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="registration-fields-modal"
              >
                <div className="registration-fields-modal-header">
                  <h2 className="registration-fields-modal-title">
                    {editingField ? 'Редактировать поле' : 'Новое поле'}
                  </h2>
                </div>

                <div className="registration-fields-modal-content">
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
                      <div className="registration-fields-options-section">
                        <label className="registration-fields-options-label">
                          Варианты выбора
                        </label>
                        <textarea
                            value={formData.options}
                            onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                            className="registration-fields-options-textarea"
                            rows={4}
                            placeholder="value1:Отображаемый текст 1&#10;value2:Отображаемый текст 2"
                        />
                        <p className="registration-fields-options-hint">
                          По одному варианту на строку. Формат: значение:подпись
                        </p>
                      </div>
                  )}

                  <div className="registration-fields-checkboxes">
                    <label className="registration-fields-checkbox-label">
                      <input
                          type="checkbox"
                          checked={formData.is_required}
                          onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                          className="registration-fields-checkbox"
                      />
                      <span className="registration-fields-checkbox-text">Обязательное поле</span>
                    </label>

                    <label className="registration-fields-checkbox-label">
                      <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="registration-fields-checkbox"
                      />
                      <span className="registration-fields-checkbox-text">Активно</span>
                    </label>
                  </div>

                  <Input
                      label="Порядок отображения"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="registration-fields-modal-footer">
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