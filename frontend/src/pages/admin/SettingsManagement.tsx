import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { settingsApi } from '../../api/settings'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'

interface SettingItem {
  id: number
  key: string
  value: string | null
  value_json: any
  description: string | null
  is_public: boolean
}

// Russian labels for setting keys
const settingLabels: Record<string, string> = {
  site_title: 'Название сайта',
  site_description: 'Описание сайта',
  site_keywords: 'Ключевые слова (SEO)',
  about_history: 'История (О нас)',
  about_goals: 'Цели и задачи',
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

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.getAll()
      setSettings(data as unknown as SettingItem[])
      
      // Initialize edited values
      const values: Record<string, string> = {}
      data.forEach((s: any) => {
        values[s.key] = s.value_json ? JSON.stringify(s.value_json, null, 2) : s.value || ''
        
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

  if (loading) {
    return <LoadingSpinner />
  }

  // Group settings by category
  const aboutSettings = settings.filter(s => s.key.startsWith('about_') || s.key === 'show_advantages')
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
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-heading font-semibold mb-4">{title}</h2>
        <div className="space-y-6">
          {items.map((setting) => (
            <div key={setting.key} className="border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <label className="font-medium text-gray-900">{getSettingLabel(setting.key)}</label>
                  {setting.description && (
                    <p className="text-sm text-gray-500">{setting.description}</p>
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
                  className="font-mono text-sm"
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
    <div>
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">
        Настройки сайта
      </h1>

      {renderSettingGroup('SEO и общие настройки', seoSettings)}
      {renderSettingGroup('Раздел "О нас"', aboutSettings)}
      
      {/* Contact Information - Special Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold">Контактная информация</h2>
          <Button
            onClick={handleSaveContactEmails}
            isLoading={saving === 'contact_emails'}
          >
            Сохранить
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-heading font-semibold mb-4">Добавить настройку</h2>
        <p className="text-sm text-gray-500 mb-4">
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
          className="space-y-4"
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



