import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, ArchiveBoxIcon, XMarkIcon, DocumentIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { seasonsApi, SeasonCreateData, FinalizeSeasonData } from '../../api/seasons'
import { Season } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import ImageUrlField, {
  isValidImageRef,
} from '../../components/ui/ImageUrlField'
import FileUrlField from '../../components/ui/FileUrlField'
import {
  ARCHIVE_LEAGUES,
  emptyLeaguePlaces,
  encodePlaceFromForm,
  type LeaguePlacesForm,
} from '../../utils/leaguePlaces'
import '../../styles/pages/admin/SeasonsManagement.css'

interface FormatStructure {
  logo_url: string
  title_url: string
  icon_url?: string
  hero_title_url?: string
  hero_logo_url?: string
  tasks: string[]
  documents: Array<{
    url: string
    name: string
  }>
}

export default function SeasonsManagement() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [formData, setFormData] = useState<Partial<SeasonCreateData & { format_json: string }>>({})
  const [saving, setSaving] = useState(false)

  // Format fields state
  const [formatData, setFormatData] = useState<FormatStructure>({
    logo_url: '',
    title_url: '',
    icon_url: '',
    tasks: [''],
    documents: [{ url: '', name: '' }]
  })

  // Finalize season modal
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [finalizingSeason, setFinalizingSeason] = useState<Season | null>(null)
  const [finalizeData, setFinalizeData] = useState<FinalizeSeasonData>({})
  const [finalizing, setFinalizing] = useState(false)
  const [archiveLogoUrl, setArchiveLogoUrl] = useState('')
  const [archiveTitleUrl, setArchiveTitleUrl] = useState('')
  const [leaguePlaces, setLeaguePlaces] = useState<LeaguePlacesForm>(emptyLeaguePlaces())

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

  const parseFormatToJson = (formatString: string): FormatStructure => {
    try {
      return JSON.parse(formatString)
    } catch {
      // Если не JSON, создаем дефолтную структуру
      return {
        logo_url: '',
        title_url: '',
        icon_url: '',
        tasks: [''],
        documents: [{ url: '', name: '' }]
      }
    }
  }

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
    setFormatData({
      logo_url: '',
      title_url: '',
      icon_url: '',
      tasks: [''],
      documents: [{ url: '', name: '' }]
    })
    setShowModal(true)
  }

  const handleEdit = (season: Season) => {
    setEditingSeason(season)

    const formatJson = season.format ? parseFormatToJson(season.format) : {
      logo_url: '',
      title_url: '',
      icon_url: '',
      tasks: [''],
      documents: [{ url: '', name: '' }]
    }

    setFormatData(formatJson)

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

    let logoUrl = ''
    let titleUrl = ''

    if (season.format) {
      try {
        const formatJson = JSON.parse(season.format)
        logoUrl = formatJson.logo_url || ''
        titleUrl = formatJson.title_url || ''
      } catch (error) {
        console.error('Error parsing season format:', error)
      }
    }

    setFinalizeData({
      description: JSON.stringify({
        logoUrl,
        titleImageUrl: titleUrl
      }, null, 2),
      cover_image: '',
      first_place: '',
      second_place: '',
      third_place: '',
      additional_info: ''
    })

    setArchiveLogoUrl(logoUrl)
    setArchiveTitleUrl(titleUrl)
    setLeaguePlaces(emptyLeaguePlaces())
    setShowFinalizeModal(true)
  }

  const handleFinalize = async () => {
    if (!finalizingSeason) return

    if (!archiveLogoUrl || !archiveTitleUrl) {
      toast.error('Заполните логотип и название для архива (URL или загрузка файла)')
      return
    }

    if (!isValidImageRef(archiveLogoUrl)) {
      toast.error('Некорректный URL логотипа')
      return
    }

    if (!isValidImageRef(archiveTitleUrl)) {
      toast.error('Некорректный URL названия')
      return
    }

    if (!confirm(`Вы уверены, что хотите завершить сезон "${finalizingSeason.name}" и отправить его в архив? Это действие необратимо.`)) {
      return
    }

    const updatedFinalizeData: FinalizeSeasonData = {
      ...finalizeData,
      description: JSON.stringify({
        logoUrl: archiveLogoUrl,
        titleImageUrl: archiveTitleUrl
      }, null, 2),
      first_place: encodePlaceFromForm(leaguePlaces, 'first') || undefined,
      second_place: encodePlaceFromForm(leaguePlaces, 'second') || undefined,
      third_place: encodePlaceFromForm(leaguePlaces, 'third') || undefined,
    }

    setFinalizing(true)
    try {
      await seasonsApi.finalize(finalizingSeason.id, updatedFinalizeData)
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

    if (!formatData.title_url) {
      toast.error('Загрузите картинку названия сезона')
      return
    }

    setSaving(true)
    try {
      // 1. Сохраняем оригинальный format (если есть)
      let originalFormatData: Record<string, unknown> = {}
      if (editingSeason && editingSeason.format) {
        try {
          originalFormatData = JSON.parse(editingSeason.format)

          // Удаляем наши кастомные поля из оригинала, чтобы избежать дублирования
          const { logo_url: _l, title_url: _t, icon_url: _i, tasks: _tk, documents: _d, ...rest } = originalFormatData
          originalFormatData = rest
        } catch (error) {
          console.error('Error parsing original format:', error)
        }
      }

      const mergedFormatData = {
        ...originalFormatData,
        logo_url: formatData.logo_url,
        title_url: formatData.title_url,
        ...(formatData.icon_url && { icon_url: formatData.icon_url }),
        tasks: formatData.tasks.filter(task => task.trim() !== ''),
        documents: formatData.documents.filter(doc =>
            doc.url.trim() !== '' && doc.name.trim() !== ''
        )
      }

      const formatJson = JSON.stringify(mergedFormatData, null, 2)
      console.log('Final format JSON:', formatJson)

      const dataToSave: any = {
        year: formData.year,
        name: formData.name,
        theme: formData.theme || null,
        registration_open: formData.registration_open,
        registration_start: formData.registration_start || null,
        registration_end: formData.registration_end || null,
        competition_date_start: formData.competition_date_start || null,
        competition_date_end: formData.competition_date_end || null,
        location: formData.location || null,
        format: formatJson,
        show_dates: formData.show_dates,
        show_location: formData.show_location,
        show_format: formData.show_format,
        show_registration_deadline: formData.show_registration_deadline,
        is_current: formData.is_current,
        is_archived: formData.is_archived
      }

      console.log('Data to save:', dataToSave)

      if (editingSeason) {
        await seasonsApi.update(editingSeason.id, dataToSave)
        toast.success('Сезон обновлён')
      } else {
        await seasonsApi.create(dataToSave as SeasonCreateData)
        toast.success('Сезон создан')
      }
      setShowModal(false)
      fetchSeasons()
    } catch (error: any) {
      console.error('Save error:', error)
      console.error('Response data:', error.response?.data)
      toast.error(error.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }
  // Обработчики для полей формата
  const handleFormatFieldChange = (field: keyof FormatStructure, value: any) => {
    setFormatData(prev => ({ ...prev, [field]: value }))
  }

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...formatData.tasks]
    newTasks[index] = value
    setFormatData(prev => ({ ...prev, tasks: newTasks }))
  }

  const addTask = () => {
    setFormatData(prev => ({ ...prev, tasks: [...prev.tasks, ''] }))
  }

  const removeTask = (index: number) => {
    const newTasks = formatData.tasks.filter((_, i) => i !== index)
    setFormatData(prev => ({ ...prev, tasks: newTasks }))
  }

  const handleDocumentChange = (index: number, field: 'url' | 'name', value: string) => {
    setFormatData(prev => {
      const newDocuments = [...prev.documents]
      newDocuments[index] = { ...newDocuments[index], [field]: value }
      return { ...prev, documents: newDocuments }
    })
  }

  const addDocument = () => {
    setFormatData(prev => ({ ...prev, documents: [...prev.documents, { url: '', name: '' }] }))
  }

  const removeDocument = (index: number) => {
    const newDocuments = formatData.documents.filter((_, i) => i !== index)
    setFormatData(prev => ({ ...prev, documents: newDocuments }))
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
      <div className="seasons-management">
        <div className="seasons-management-header">
          <h1 className="seasons-management-title">
            Управление сезонами
          </h1>
          <Button
              onClick={handleCreate}
              leftIcon={<PlusIcon className="seasons-management-button-icon" />}
          >
            Новый сезон
          </Button>
        </div>

        {/* Seasons list */}
        <div className="seasons-management-list">
          {seasons.map((season) => (
              <motion.div
                  key={season.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`seasons-management-item ${
                      season.is_current ? 'seasons-management-item-current' : ''
                  }`}
              >
                <div className="seasons-management-item-header">
                  <div>
                    <div className="seasons-management-item-title-wrapper">
                      <h3 className="seasons-management-item-title">{season.name}</h3>
                      {season.is_current && (
                          <span className="seasons-management-current-badge">
                      <StarIcon className="seasons-management-current-icon" />
                      Текущий
                    </span>
                      )}
                      {season.is_archived && (
                          <span className="seasons-management-archive-badge">
                      Архив
                    </span>
                      )}
                    </div>
                    {season.theme && (
                        <p className="seasons-management-item-theme">Тема: {season.theme}</p>
                    )}
                  </div>

                  <div className="seasons-management-item-actions">
                    {!season.is_current && !season.is_archived && (
                        <button
                            onClick={() => handleSetCurrent(season)}
                            className="seasons-management-set-current-button"
                            title="Сделать текущим"
                        >
                          <StarIcon className="seasons-management-action-button-icon" />
                          Сделать текущим
                        </button>
                    )}
                    {!season.is_archived && (
                        <button
                            onClick={() => handleOpenFinalize(season)}
                            className="seasons-management-finalize-button"
                            title="Завершить сезон и отправить в архив"
                        >
                          <ArchiveBoxIcon className="seasons-management-action-button-icon" />
                          Завершить
                        </button>
                    )}
                    <button
                        onClick={() => handleEdit(season)}
                        className="seasons-management-edit-button"
                    >
                      <PencilIcon className="seasons-management-action-icon" />
                    </button>
                    <button
                        onClick={() => handleDelete(season.id)}
                        className="seasons-management-delete-button"
                    >
                      <TrashIcon className="seasons-management-action-icon" />
                    </button>
                  </div>
                </div>

                <div className="seasons-management-item-details">
                  <div className="seasons-management-detail">
                    <p className="seasons-management-detail-label">Регистрация</p>
                    <p className={`seasons-management-detail-value ${
                        season.registration_open ? 'seasons-management-registration-open' : 'seasons-management-registration-closed'
                    }`}>
                      {season.registration_open ? 'Открыта' : 'Закрыта'}
                    </p>
                  </div>
                  {season.competition_date_start && (
                      <div className="seasons-management-detail">
                        <p className="seasons-management-detail-label">Даты соревнований</p>
                        <p className="seasons-management-detail-value">
                          {season.competition_date_start}
                          {season.competition_date_end && ` — ${season.competition_date_end}`}
                        </p>
                      </div>
                  )}
                  {season.location && (
                      <div className="seasons-management-detail">
                        <p className="seasons-management-detail-label">Место</p>
                        <p className="seasons-management-detail-value">{season.location}</p>
                      </div>
                  )}
                  <div className="seasons-management-detail">
                    <p className="seasons-management-detail-label">Соревнований</p>
                    <p className="seasons-management-detail-value">{season.competitions.length}</p>
                  </div>
                </div>
              </motion.div>
          ))}

          {seasons.length === 0 && (
              <div className="seasons-management-empty">
                Сезонов пока нет
              </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
            <div className="seasons-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="seasons-management-modal"
              >
                <div className="seasons-management-modal-header">
                  <h2 className="seasons-management-modal-title">
                    {editingSeason ? 'Редактировать сезон' : 'Новый сезон'}
                  </h2>
                </div>

                {/* Modal Content */}
                <div className="seasons-management-modal-content">
                  <div className="seasons-management-form-section">
                    {/* Первая колонка */}
                    <div className="seasons-management-form-column">
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
                          placeholder="Евробот 2025"
                      />

                      <Input
                          label="Тема сезона"
                          value={formData.theme || ''}
                          onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                      />

                      <div className="seasons-management-form-double">
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

                      <div className="seasons-management-form-double">
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
                    </div>

                    {/* Вторая колонка - Формат */}
                    <div className="seasons-management-form-column">
                      <ImageUrlField
                          label="Логотип (необязательно)"
                          value={formatData.logo_url || ''}
                          onChange={(url) => handleFormatFieldChange('logo_url', url)}
                      />

                      <ImageUrlField
                          label="Картинка названия"
                          required
                          value={formatData.title_url || ''}
                          onChange={(url) => handleFormatFieldChange('title_url', url)}
                      />

                      <ImageUrlField
                          label="Иконка маркера перечисления (необязательно)"
                          value={formatData.icon_url || ''}
                          onChange={(url) => handleFormatFieldChange('icon_url', url)}
                      />

                      <ImageUrlField
                          label="Главная страница — картинка заголовка (необязательно)"
                          value={formatData.hero_title_url || ''}
                          onChange={(url) => handleFormatFieldChange('hero_title_url', url)}
                      />

                      <ImageUrlField
                          label="Главная страница — маскот (необязательно)"
                          value={formatData.hero_logo_url || ''}
                          onChange={(url) => handleFormatFieldChange('hero_logo_url', url)}
                      />

                      {/* Задания */}
                      <div className="seasons-management-tasks-section">
                        <div className="seasons-management-section-header">
                          <label className="seasons-management-tasks-label">
                            <DocumentTextIcon className="seasons-management-section-icon" />
                            Задания
                          </label>
                          <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={addTask}
                              className="seasons-management-add-button"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Добавить задание
                          </Button>
                        </div>

                        {formatData.tasks.map((task, index) => (
                            <div key={index} className="seasons-management-task-item">
                              <Textarea
                                  value={task}
                                  onChange={(e) => handleTaskChange(index, e.target.value)}
                                  placeholder={`Задание ${index + 1}`}
                                  rows={1}
                              />
                              {formatData.tasks.length > 1 && (
                                  <button
                                      type="button"
                                      onClick={() => removeTask(index)}
                                      className="seasons-management-remove-button"
                                      title="Удалить задание"
                                  >
                                    <XMarkIcon className="w-4 h-4" />
                                  </button>
                              )}
                            </div>
                        ))}
                      </div>
                    </div>

                    {/* Третья колонка - Документы и настройки */}
                    <div className="seasons-management-form-column">
                      {/* Документы */}
                      <div className="seasons-management-documents-section">
                        <div className="seasons-management-section-header">
                          <label className="seasons-management-documents-label">
                            <DocumentIcon className="seasons-management-section-icon" />
                            Документы
                          </label>
                          <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={addDocument}
                              className="seasons-management-add-button"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Добавить документ
                          </Button>
                        </div>

                        {formatData.documents.map((doc, index) => (
                            <div key={index} className="seasons-management-document-item">
                              <div className="seasons-management-document-fields">
                                <FileUrlField
                                    label="Документ"
                                    kind="documents"
                                    value={doc.url}
                                    onChange={(url) => handleDocumentChange(index, 'url', url)}
                                    onUploaded={({ originalName }) => {
                                      if (!doc.name) handleDocumentChange(index, 'name', originalName.replace(/\.[^.]+$/, ''))
                                    }}
                                />
                                <Input
                                    label="Название документа"
                                    value={doc.name}
                                    onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                                    placeholder="Положение о соревнованиях"
                                />
                              </div>
                              {formatData.documents.length > 1 && (
                                  <button
                                      type="button"
                                      onClick={() => removeDocument(index)}
                                      className="seasons-management-remove-button"
                                      title="Удалить документ"
                                  >
                                    <XMarkIcon className="w-4 h-4" />
                                  </button>
                              )}
                            </div>
                        ))}
                      </div>

                      {/* Настройки отображения */}
                      <div className="seasons-management-settings-section">
                        <p className="seasons-management-settings-label">Настройки отображения</p>
                        <div className="seasons-management-settings-grid">
                          <label className="seasons-management-checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.registration_open}
                                onChange={(e) => setFormData({ ...formData, registration_open: e.target.checked })}
                                className="seasons-management-checkbox"
                            />
                            Регистрация открыта
                          </label>
                          <label className="seasons-management-checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_current}
                                onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                                className="seasons-management-checkbox"
                            />
                            Текущий сезон
                          </label>
                          <label className="seasons-management-checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.show_dates}
                                onChange={(e) => setFormData({ ...formData, show_dates: e.target.checked })}
                                className="seasons-management-checkbox"
                            />
                            Показывать даты
                          </label>
                          <label className="seasons-management-checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.show_location}
                                onChange={(e) => setFormData({ ...formData, show_location: e.target.checked })}
                                className="seasons-management-checkbox"
                            />
                            Показывать место
                          </label>
                          <label className="seasons-management-checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.show_format}
                                onChange={(e) => setFormData({ ...formData, show_format: e.target.checked })}
                                className="seasons-management-checkbox"
                            />
                            Показывать формат
                          </label>
                          <label className="seasons-management-checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_archived}
                                onChange={(e) => setFormData({ ...formData, is_archived: e.target.checked })}
                                className="seasons-management-checkbox"
                            />
                            В архиве
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="seasons-management-modal-footer">
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
            <div className="seasons-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="seasons-management-finalize-modal"
              >
                <div className="seasons-management-finalize-modal-header">
                  <h2 className="seasons-management-finalize-modal-title">
                    <ArchiveBoxIcon className="seasons-management-finalize-modal-icon" />
                    Завершить сезон: {finalizingSeason.name}
                  </h2>
                  <p className="seasons-management-finalize-modal-subtitle">
                    Заполните дополнительную информацию для архива
                  </p>
                </div>

                <div className="seasons-management-finalize-modal-content">
                  {/* Info from season (read-only) */}
                  <div className="seasons-management-finalize-info">
                    <p className="seasons-management-finalize-info-label">Данные из сезона (будут скопированы автоматически):</p>
                    <div className="seasons-management-finalize-info-grid">
                      <div><span className="seasons-management-finalize-info-meta">Год:</span> {finalizingSeason.year}</div>
                      <div><span className="seasons-management-finalize-info-meta">Название:</span> {finalizingSeason.name}</div>
                      {finalizingSeason.theme && (
                          <div className="seasons-management-finalize-info-full">
                            <span className="seasons-management-finalize-info-meta">Тема:</span> {finalizingSeason.theme}
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Обязательные изображения для архива */}
                  <div className="seasons-management-archive-urls-section">
                    <p className="seasons-management-archive-urls-label">
                      Обязательные изображения для архива *
                    </p>
                    <div className="seasons-management-archive-urls-fields">
                      <ImageUrlField
                          label="Логотип *"
                          required
                          value={archiveLogoUrl}
                          onChange={setArchiveLogoUrl}
                          placeholder="https://... или загрузите файл"
                          previewAlt="Превью логотипа"
                      />

                      <ImageUrlField
                          label="Название *"
                          required
                          value={archiveTitleUrl}
                          onChange={setArchiveTitleUrl}
                          placeholder="https://... или загрузите файл"
                          previewAlt="Превью названия"
                      />
                    </div>
                  </div>

                  {/* Additional fields for archive */}
                  <Textarea
                      label="Описание сезона"
                      value={finalizeData.description || ''}
                      onChange={(e) => setFinalizeData({ ...finalizeData, description: e.target.value })}
                      placeholder="Краткое описание прошедшего сезона..."
                      rows={3}
                      readOnly
                      className="seasons-management-readonly-textarea"
                  />
                  <p className="seasons-management-hint-small">
                    Это поле заполняется автоматически на основе изображений выше
                  </p>

                  <ImageUrlField
                      label="Обложка"
                      value={finalizeData.cover_image || ''}
                      onChange={(url) => setFinalizeData({ ...finalizeData, cover_image: url })}
                      placeholder="https://... или загрузите файл"
                      previewAlt="Превью обложки"
                  />

                  <div className="seasons-management-results-section">
                    <p className="seasons-management-results-label">Итоги сезона — призовые места по лигам</p>

                    {ARCHIVE_LEAGUES.map((league) => (
                      <div key={league.key} className="seasons-management-league-block">
                        <h4 className="seasons-management-league-title">Лига {league.label}</h4>
                        <div className="seasons-management-results-fields">
                          <Input
                              label="🥇 1 место"
                              value={leaguePlaces[league.key].first}
                              onChange={(e) => setLeaguePlaces({
                                ...leaguePlaces,
                                [league.key]: { ...leaguePlaces[league.key], first: e.target.value },
                              })}
                              placeholder={`Команда — ${league.label}`}
                          />
                          <Input
                              label="🥈 2 место"
                              value={leaguePlaces[league.key].second}
                              onChange={(e) => setLeaguePlaces({
                                ...leaguePlaces,
                                [league.key]: { ...leaguePlaces[league.key], second: e.target.value },
                              })}
                              placeholder={`Команда — ${league.label}`}
                          />
                          <Input
                              label="🥉 3 место"
                              value={leaguePlaces[league.key].third}
                              onChange={(e) => setLeaguePlaces({
                                ...leaguePlaces,
                                [league.key]: { ...leaguePlaces[league.key], third: e.target.value },
                              })}
                              placeholder={`Команда — ${league.label}`}
                          />
                        </div>
                      </div>
                    ))}

                    <Textarea
                        label="Дополнительная информация"
                        value={finalizeData.additional_info || ''}
                        onChange={(e) => setFinalizeData({ ...finalizeData, additional_info: e.target.value })}
                        placeholder="Другие награды, особые достижения и т.д."
                        rows={3}
                    />
                  </div>
                  <p className="seasons-management-hint">
                    Количество команд будет подсчитано автоматически.
                  </p>
                </div>

                <div className="seasons-management-finalize-modal-footer">
                  <Button variant="ghost" onClick={() => setShowFinalizeModal(false)}>
                    Отмена
                  </Button>
                  <Button
                      onClick={handleFinalize}
                      isLoading={finalizing}
                      className="seasons-management-finalize-button-modal"
                      disabled={!archiveLogoUrl || !archiveTitleUrl}
                  >
                    <ArchiveBoxIcon className="seasons-management-button-icon" />
                    Завершить и отправить в архив
                  </Button>
                </div>
              </motion.div>
            </div>
        )}
      </div>
  )
}