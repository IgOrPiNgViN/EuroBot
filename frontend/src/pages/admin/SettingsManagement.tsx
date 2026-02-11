import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { settingsApi } from '../../api/settings'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { PlusIcon, TrashIcon, XMarkIcon, UserIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import '../../styles/pages/admin/SettingsManagement.css'

interface SettingItem {
  id: number
  key: string
  value: string | null
  value_json: any
  description: string | null
  is_public: boolean
}

interface CommitteeMember {
  id: number
  name: string
  position: string
  photo_url: string
}

interface Committee {
  id: number
  name: string
  description: string
  members: CommitteeMember[]
}

const settingLabels: Record<string, string> = {
  site_title: 'Название сайта',
  site_description: 'Описание сайта',
  site_keywords: 'Ключевые слова (SEO)',
  about_history: 'История (О нас)',
  about_goals: 'Комитеты и организаторы',
  about_organizers: 'Организаторы',
  about_team: 'Команда',
  show_advantages: 'Показывать преимущества',
  contact_emails: 'Email адреса',
  contact_phones: 'Телефоны',
  contact_address: 'Адрес',
  contact_social: 'Социальные сети',
  expert_council: 'Экспертный совет',
}

// Labels for contact email types
const emailTypeLabels: Record<string, string> = {
  technical: 'Техническая поддержка',
  registration: 'Регистрация команд',
  sponsorship: 'Спонсорство и партнёрство',
  press: 'Пресса и СМИ',
  general: 'Общие вопросы',
}

const getSettingLabel = (key: string): string => {
  return settingLabels[key] || key
}

export default function SettingsManagement() {
  const [settings, setSettings] = useState<SettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [contactEmails, setContactEmails] = useState<Record<string, string>>({})

  // Состояние для комитетов
  const [committees, setCommittees] = useState<Committee[]>([
    {
      id: 1,
      name: '',
      description: '',
      members: [{ id: 1, name: '', position: '', photo_url: '' }]
    }
  ])
  const [showCommitteeModal, setShowCommitteeModal] = useState(false)
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null)

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.getAll()
      setSettings(data as unknown as SettingItem[])

      // Initialize edited values
      const values: Record<string, string> = {}
      data.forEach((s: any) => {
        // Для about_goals нужно использовать value, а не value_json
        if (s.key === 'about_goals' && s.value) {
          values[s.key] = s.value
          try {
            const committeesData = JSON.parse(s.value)
            if (Array.isArray(committeesData)) {
              setCommittees(committeesData)
            }
          } catch (error) {
            console.error('Failed to parse committees:', error)
            // Если не получается распарсить, оставляем пустой массив
            setCommittees([{
              id: 1,
              name: '',
              description: '',
              members: [{ id: 1, name: '', position: '', photo_url: '' }]
            }])
          }
        } else {
          values[s.key] = s.value_json ? JSON.stringify(s.value_json, null, 2) : s.value || ''
        }

        // Special handling for contact_emails
        if (s.key === 'contact_emails' && s.value_json) {
          setContactEmails(s.value_json)
        }
      })
      setEditedValues(values)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])


  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      const value = editedValues[key]

      // Try to parse as JSON
      let parsedValue: string | object = value
      try {
        parsedValue = JSON.parse(value)
      } catch {
        // Not JSON, use as string
      }

      await settingsApi.update(key, parsedValue)
      toast.success('Настройка сохранена')
    } catch (error) {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(null)
    }
  }

  const handleSaveCommittees = async () => {
    setSaving('about_goals')
    try {
      const committeesJson = JSON.stringify(committees, null, 2)
      await settingsApi.update('about_goals', committeesJson)
      toast.success('Комитеты сохранены')
    } catch (error) {
      console.error('Save committees error:', error)
      toast.error('Ошибка сохранения комитетов')
    } finally {
      setSaving(null)
    }
  }

  const handleSaveContactEmails = async () => {
    setSaving('contact_emails')
    try {
      await settingsApi.update('contact_emails', contactEmails)
      toast.success('Email адреса сохранены')
    } catch (error) {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(null)
    }
  }

  const updateContactEmail = (type: string, value: string) => {
    setContactEmails(prev => ({ ...prev, [type]: value }))
  }

  // Функции для работы с комитетами
  const addCommittee = () => {
    const newCommittee: Committee = {
      id: Date.now(),
      name: '',
      description: '',
      members: [{ id: Date.now(), name: '', position: '', photo_url: '' }]
    }
    setCommittees([...committees, newCommittee])
  }

  const updateCommittee = (id: number, field: keyof Committee, value: string) => {
    setCommittees(prev =>
        prev.map(committee =>
            committee.id === id ? { ...committee, [field]: value } : committee
        )
    )
  }

  const removeCommittee = (id: number) => {
    if (committees.length <= 1) {
      toast.error('Должен быть хотя бы один комитет')
      return
    }
    setCommittees(committees.filter(c => c.id !== id))
  }

  // Функции для работы с членами комитета
  const addMember = (committeeId: number) => {
    setCommittees(prev =>
        prev.map(committee =>
            committee.id === committeeId
                ? {
                  ...committee,
                  members: [...committee.members, {
                    id: Date.now(),
                    name: '',
                    position: '',
                    photo_url: ''
                  }]
                }
                : committee
        )
    )
  }

  const updateMember = (committeeId: number, memberId: number, field: keyof CommitteeMember, value: string) => {
    setCommittees(prev =>
        prev.map(committee =>
            committee.id === committeeId
                ? {
                  ...committee,
                  members: committee.members.map(member =>
                      member.id === memberId ? { ...member, [field]: value } : member
                  )
                }
                : committee
        )
    )
  }

  const removeMember = (committeeId: number, memberId: number) => {
    setCommittees(prev =>
        prev.map(committee =>
            committee.id === committeeId
                ? {
                  ...committee,
                  members: committee.members.filter(m => m.id !== memberId)
                }
                : committee
        )
    )
  }

  useEffect(() => {
    console.log('Current committees:', committees)
  }, [committees])

  if (loading) {
    return <LoadingSpinner />
  }

  // Group settings by category
  const aboutSettings = settings.filter(s =>
      s.key.startsWith('about_') && s.key !== 'about_goals' ||
      s.key === 'show_advantages'
  )

  const contactSettings = settings.filter(s => s.key.startsWith('contact_'))
  const seoSettings = settings.filter(s => s.key.startsWith('site_'))
  const otherSettings = settings.filter(s =>
      !s.key.startsWith('about_') &&
      !s.key.startsWith('contact_') &&
      !s.key.startsWith('site_') &&
      s.key !== 'show_advantages'
  )

  const renderSettingGroup = (title: string, items: SettingItem[]) => {
    if (items.length === 0) return null

    return (
        <div className="settings-management-group">
          <h2 className="settings-management-group-title">{title}</h2>
          <div className="settings-management-group-content">
            {items.map((setting) => (
                <div key={setting.key} className="settings-management-setting">
                  <div className="settings-management-setting-header">
                    <div>
                      <label className="settings-management-setting-label">{getSettingLabel(setting.key)}</label>
                      {setting.description && (
                          <p className="settings-management-setting-description">{setting.description}</p>
                      )}
                    </div>
                    <Button
                        size="sm"
                        onClick={() => handleSave(setting.key)}
                        isLoading={saving === setting.key}
                    >
                      Сохранить
                    </Button>
                  </div>

                  {setting.value_json ? (
                      <Textarea
                          value={editedValues[setting.key] || ''}
                          onChange={(e) => setEditedValues({ ...editedValues, [setting.key]: e.target.value })}
                          rows={6}
                          className="settings-management-setting-textarea"
                          placeholder="JSON"
                      />
                  ) : (
                      <Textarea
                          value={editedValues[setting.key] || ''}
                          onChange={(e) => setEditedValues({ ...editedValues, [setting.key]: e.target.value })}
                          rows={3}
                      />
                  )}
                </div>
            ))}
          </div>
        </div>
    )
  }

  return (
      <div className="settings-management">
        <h1 className="settings-management-title">
          Настройки сайта
        </h1>

        {renderSettingGroup('SEO и общие настройки', seoSettings)}

        {/* Комитеты и организаторы */}
        <div className="settings-management-group">
          <div className="settings-management-group-header">
            <h2 className="settings-management-group-title">Комитеты и организаторы</h2>
            <div className="settings-management-group-actions">
              <Button
                  size="sm"
                  variant="outline"
                  onClick={addCommittee}
                  leftIcon={<PlusIcon className="w-4 h-4" />}
              >
                Добавить комитет
              </Button>
              <Button
                  onClick={handleSaveCommittees}
                  isLoading={saving === 'about_goals'}
              >
                Сохранить комитеты
              </Button>
            </div>
          </div>

          <div className="committees-list">
            {committees.map((committee, committeeIndex) => (
                <div key={committee.id} className="committee-card">
                  <div className="committee-card-header">
                    <div className="committee-card-title">
                      <span className="committee-number">Комитет {committeeIndex + 1}</span>
                      <Input
                          value={committee.name}
                          onChange={(e) => updateCommittee(committee.id, 'name', e.target.value)}
                          placeholder="Название комитета"
                          className="committee-name-input"
                      />
                    </div>
                    {committees.length > 1 && (
                        <button
                            onClick={() => removeCommittee(committee.id)}
                            className="committee-remove-button"
                            title="Удалить комитет"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                  </div>

                  <Textarea
                      value={committee.description}
                      onChange={(e) => updateCommittee(committee.id, 'description', e.target.value)}
                      placeholder="Описание комитета"
                      rows={2}
                      className="committee-description"
                  />

                  <div className="committee-members-section">
                    <div className="committee-members-header">
                      <h4 className="committee-members-title">
                        <UserGroupIcon className="w-5 h-5" />
                        Члены комитета
                      </h4>
                      <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addMember(committee.id)}
                          leftIcon={<PlusIcon className="w-4 h-4" />}
                      >
                        Добавить члена
                      </Button>
                    </div>

                    <div className="committee-members-list">
                      {committee.members.map((member, memberIndex) => (
                          <div key={member.id} className="committee-member-card">
                            <div className="committee-member-header">
                              <div className="committee-member-number">
                                <UserIcon className="w-4 h-4" />
                                <span>Член {memberIndex + 1}</span>
                              </div>
                              {committee.members.length > 1 && (
                                  <button
                                      onClick={() => removeMember(committee.id, member.id)}
                                      className="committee-member-remove-button"
                                      title="Удалить члена"
                                  >
                                    <XMarkIcon className="w-4 h-4" />
                                  </button>
                              )}
                            </div>

                            <div className="committee-member-fields">
                              <Input
                                  label="Имя и фамилия"
                                  value={member.name}
                                  onChange={(e) => updateMember(committee.id, member.id, 'name', e.target.value)}
                                  placeholder="Иван Иванов"
                              />
                              <Input
                                  label="Должность/позиция"
                                  value={member.position}
                                  onChange={(e) => updateMember(committee.id, member.id, 'position', e.target.value)}
                                  placeholder="Председатель комитета"
                              />
                              <Input
                                  label="URL фотографии"
                                  type="url"
                                  value={member.photo_url}
                                  onChange={(e) => updateMember(committee.id, member.id, 'photo_url', e.target.value)}
                                  placeholder="https://example.com/photo.jpg"
                              />
                              {member.photo_url && (
                                  <div className="committee-member-photo-preview">
                                    <img
                                        src={member.photo_url}
                                        alt="Превью фото"
                                        className="committee-member-photo"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                    <div className="committee-member-photo-error hidden">
                                      Не удалось загрузить фото
                                    </div>
                                  </div>
                              )}
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* Остальные about настройки */}
        {renderSettingGroup('Раздел "О нас"', aboutSettings)}

        {/* Contact Information */}
        <div className="settings-management-contact-group">
          <div className="settings-management-contact-header">
            <h2 className="settings-management-contact-title">Контактная информация</h2>
            <Button
                onClick={handleSaveContactEmails}
                isLoading={saving === 'contact_emails'}
            >
              Сохранить
            </Button>
          </div>

          <div className="settings-management-emails-grid">
            {Object.entries(emailTypeLabels).map(([type, label]) => (
                <Input
                    key={type}
                    label={label}
                    type="email"
                    value={contactEmails[type] || ''}
                    onChange={(e) => updateContactEmail(type, e.target.value)}
                    placeholder={`${type}@eurobot.ru`}
                />
            ))}
          </div>
        </div>

        {renderSettingGroup('Другие настройки', otherSettings)}

        {/* Add new setting */}
        <div className="settings-management-add-section">
          <h2 className="settings-management-add-title">Добавить настройку</h2>
          <p className="settings-management-add-description">
            Добавьте новую настройку сайта. Для JSON-значений используйте валидный формат.
          </p>
          <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const key = formData.get('key') as string
                const value = formData.get('value') as string

                if (!key) {
                  toast.error('Введите ключ')
                  return
                }

                try {
                  let parsedValue: string | object = value
                  try {
                    parsedValue = JSON.parse(value)
                  } catch {
                    // Not JSON
                  }

                  await settingsApi.update(key, parsedValue)
                  toast.success('Настройка добавлена')
                  fetchSettings()
                  ;(e.target as HTMLFormElement).reset()
                } catch (error) {
                  toast.error('Ошибка')
                }
              }}
              className="settings-management-add-form"
          >
            <Input
                name="key"
                label="Ключ"
                placeholder="setting_key"
                required
            />
            <Textarea
                name="value"
                label="Значение"
                placeholder="Значение или JSON"
                rows={3}
            />
            <Button type="submit">Добавить</Button>
          </form>
        </div>
      </div>
  )
}