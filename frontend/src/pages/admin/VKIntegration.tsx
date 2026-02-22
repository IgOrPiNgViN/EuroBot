import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import apiClient from '../../api/client'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import '../../styles/pages/admin/VKIntegration.css'

type VKMode = 'off' | 'auto' | 'manual'

interface VKIntegrationData {
  id: number
  group_id: string
  mode: VKMode
  default_category_id: number | null
  auto_publish: boolean
  check_interval_minutes: number
  fetch_count: number
  hashtag_category_map: Record<string, number> | null
  last_checked_at: string | null
  created_at: string | null
  updated_at: string | null
  imported_count: number
  has_token: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  type: string
}

interface TestResult {
  success: boolean
  group_name?: string
  posts_count?: number
  error?: string
}

interface HashtagMapping {
  hashtag: string
  categoryId: number
}

export default function VKIntegration() {
  const [integration, setIntegration] = useState<VKIntegrationData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const [groupId, setGroupId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [defaultCategoryId, setDefaultCategoryId] = useState<number | null>(null)
  const [autoPublish, setAutoPublish] = useState(true)
  const [checkInterval, setCheckInterval] = useState(10)
  const [fetchCount, setFetchCount] = useState(20)
  const [hashtagMappings, setHashtagMappings] = useState<HashtagMapping[]>([])

  const loadData = useCallback(async () => {
    try {
      const [integrationRes, categoriesRes] = await Promise.all([
        apiClient.get('/vk-integration'),
        apiClient.get('/news/categories'),
      ])

      const data = integrationRes.data
      if (data) {
        setIntegration(data)
        setGroupId(data.group_id)
        setAccessToken('')
        setDefaultCategoryId(data.default_category_id)
        setAutoPublish(data.auto_publish)
        setCheckInterval(data.check_interval_minutes)
        setFetchCount(data.fetch_count || 20)

        if (data.hashtag_category_map) {
          const mappings = Object.entries(data.hashtag_category_map).map(
            ([hashtag, categoryId]) => ({
              hashtag,
              categoryId: categoryId as number,
            })
          )
          setHashtagMappings(mappings)
        }
      }

      setCategories(categoriesRes.data || [])
    } catch (err) {
      console.error('Failed to load VK integration data', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const buildHashtagMap = (): Record<string, number> | null => {
    const valid = hashtagMappings.filter((m) => m.hashtag.trim() && m.categoryId)
    if (valid.length === 0) return null
    const map: Record<string, number> = {}
    for (const m of valid) {
      map[m.hashtag.trim().replace(/^#/, '')] = m.categoryId
    }
    return map
  }

  const handleSave = async () => {
    if (!groupId.trim()) {
      toast.error('Укажите ID группы ВКонтакте')
      return
    }
    if (!integration && !accessToken.trim()) {
      toast.error('Укажите токен доступа')
      return
    }

    setSaving(true)
    try {
      const hashtagMap = buildHashtagMap()

      if (integration) {
        const updateData: Record<string, unknown> = {
          group_id: groupId,
          default_category_id: defaultCategoryId,
          auto_publish: autoPublish,
          check_interval_minutes: checkInterval,
          fetch_count: fetchCount,
          hashtag_category_map: hashtagMap,
        }
        if (accessToken.trim()) {
          updateData.access_token = accessToken
        }
        const res = await apiClient.put('/vk-integration', updateData)
        setIntegration(res.data)
        toast.success('Настройки сохранены')
      } else {
        const res = await apiClient.post('/vk-integration', {
          group_id: groupId,
          access_token: accessToken,
          mode: 'off',
          default_category_id: defaultCategoryId,
          auto_publish: autoPublish,
          check_interval_minutes: checkInterval,
          fetch_count: fetchCount,
          hashtag_category_map: hashtagMap,
        })
        setIntegration(res.data)
        toast.success('Интеграция настроена')
      }
      setAccessToken('')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleSetMode = async (mode: VKMode) => {
    try {
      const res = await apiClient.patch(`/vk-integration/mode/${mode}`)
      setIntegration(res.data)
      const labels: Record<VKMode, string> = {
        off: 'Интеграция выключена',
        auto: 'Автоматический импорт включён',
        manual: 'Ручной режим включён',
      }
      toast.success(labels[mode])
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка переключения')
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await apiClient.post('/vk-integration/test')
      setTestResult(res.data)
    } catch (err: any) {
      setTestResult({ success: false, error: err.response?.data?.detail || 'Ошибка соединения' })
    } finally {
      setTesting(false)
    }
  }

  const handleFetchNow = async () => {
    setFetching(true)
    try {
      const res = await apiClient.post('/vk-integration/fetch-now')
      toast.success(`Импортировано: ${res.data.imported} из ${res.data.total_checked} постов`)
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка импорта')
    } finally {
      setFetching(false)
    }
  }

  const handleDeleteImported = async () => {
    if (!confirm('Удалить ВСЕ импортированные новости из ВК? Это действие необратимо.')) return
    try {
      const res = await apiClient.delete('/vk-integration/imported')
      toast.success(`Удалено: ${res.data.deleted_news} новостей`)
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка удаления')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Удалить настройки VK-интеграции? Импортированные новости сохранятся.')) return
    try {
      await apiClient.delete('/vk-integration')
      setIntegration(null)
      setGroupId('')
      setAccessToken('')
      setDefaultCategoryId(null)
      setAutoPublish(true)
      setCheckInterval(10)
      setFetchCount(20)
      setHashtagMappings([])
      setTestResult(null)
      toast.success('Интеграция удалена')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка удаления')
    }
  }

  const addHashtagMapping = () => {
    setHashtagMappings([...hashtagMappings, { hashtag: '', categoryId: categories[0]?.id || 0 }])
  }

  const removeHashtagMapping = (index: number) => {
    setHashtagMappings(hashtagMappings.filter((_, i) => i !== index))
  }

  const updateHashtagMapping = (index: number, field: 'hashtag' | 'categoryId', value: string | number) => {
    const updated = [...hashtagMappings]
    if (field === 'hashtag') {
      updated[index].hashtag = value as string
    } else {
      updated[index].categoryId = value as number
    }
    setHashtagMappings(updated)
  }

  if (loading) {
    return (
      <div className="vk-loading">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="vk-integration">
      <div className="vk-header">
        <h1 className="vk-title">Интеграция с ВКонтакте</h1>
        {integration && (
          <div className="vk-header-actions">
            <div className="vk-mode-switcher">
              {(['off', 'auto', 'manual'] as VKMode[]).map((mode) => {
                const labels: Record<VKMode, string> = {
                  off: 'Выкл',
                  auto: 'Авто',
                  manual: 'Вручную',
                }
                return (
                  <button
                    key={mode}
                    onClick={() => handleSetMode(mode)}
                    className={`vk-mode-btn ${integration.mode === mode ? `vk-mode-btn--active vk-mode-btn--${mode}` : ''}`}
                  >
                    {labels[mode]}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Status Card */}
      {integration && (
        <div className="vk-card vk-status-card">
          <div className="vk-status-grid">
            <div className="vk-status-item">
              <span className="vk-status-label">Режим</span>
              <span className={`vk-status-badge ${
                integration.mode === 'auto' ? 'vk-badge-auto' :
                integration.mode === 'manual' ? 'vk-badge-manual' :
                'vk-badge-inactive'
              }`}>
                {integration.mode === 'auto' ? 'Авто' :
                 integration.mode === 'manual' ? 'Вручную' :
                 'Выключено'}
              </span>
            </div>
            <div className="vk-status-item">
              <span className="vk-status-label">Импортировано постов</span>
              <span className="vk-status-value">{integration.imported_count}</span>
            </div>
            <div className="vk-status-item">
              <span className="vk-status-label">Последняя проверка</span>
              <span className="vk-status-value">
                {integration.last_checked_at
                  ? new Date(integration.last_checked_at).toLocaleString('ru-RU')
                  : 'Ещё не проверялось'}
              </span>
            </div>
            <div className="vk-status-item">
              <span className="vk-status-label">Токен</span>
              <span className={`vk-status-badge ${integration.has_token ? 'vk-badge-active' : 'vk-badge-inactive'}`}>
                {integration.has_token ? 'Настроен' : 'Не указан'}
              </span>
            </div>
          </div>

          <div className="vk-status-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTest}
              isLoading={testing}
              leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            >
              Тест подключения
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleFetchNow}
              isLoading={fetching}
              leftIcon={<PlayIcon className="w-4 h-4" />}
              disabled={integration.mode === 'off'}
            >
              Загрузить сейчас
            </Button>
            {integration.imported_count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteImported}
                leftIcon={<TrashIcon className="w-4 h-4" />}
              >
                Удалить все импортированные
              </Button>
            )}
          </div>

          {testResult && (
            <div className={`vk-test-result ${testResult.success ? 'vk-test-success' : 'vk-test-error'}`}>
              {testResult.success ? (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>
                    Подключено к «{testResult.group_name}» — {testResult.posts_count} постов
                  </span>
                </>
              ) : (
                <>
                  <XCircleIcon className="w-5 h-5" />
                  <span>{testResult.error}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings Form */}
      <div className="vk-card">
        <h2 className="vk-card-title">Настройки подключения</h2>

        <div className="vk-form">
          <Input
            label="ID или короткое имя группы ВК"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="например: eurobotrussia или 123456789"
            helperText="Числовой ID группы или короткое имя (из адреса vk.com/eurobotrussia)"
          />

          <Input
            label={integration ? 'Новый токен доступа (оставьте пустым, чтобы не менять)' : 'Токен доступа (access_token)'}
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="vk1.a.xxxxxxxxxxxx..."
            helperText="Сервисный ключ приложения VK или ключ доступа сообщества"
          />

          <div className="vk-form-row">
            <div className="vk-form-field">
              <label className="vk-label">Категория по умолчанию</label>
              <select
                className="vk-select"
                value={defaultCategoryId ?? ''}
                onChange={(e) =>
                  setDefaultCategoryId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Без категории</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="vk-helper">Используется, если хештег не найден в маппинге</p>
            </div>

            <div className="vk-form-field">
              <label className="vk-label">Кол-во постов для импорта</label>
              <input
                type="number"
                className="vk-input-number"
                value={fetchCount}
                onChange={(e) => setFetchCount(Math.max(1, Math.min(100, Number(e.target.value) || 20)))}
                min={1}
                max={100}
              />
              <p className="vk-helper">Сколько последних постов загружать (1–100)</p>
            </div>
          </div>

          <div className="vk-form-row">
            <div className="vk-form-field">
              <label className="vk-label">Интервал автопроверки (мин)</label>
              <input
                type="number"
                className="vk-input-number"
                value={checkInterval}
                onChange={(e) => setCheckInterval(Number(e.target.value) || 10)}
                min={1}
                max={1440}
              />
              <p className="vk-helper">Работает только в режиме «Авто»</p>
            </div>
          </div>

          <div className="vk-form-field">
            <label className="vk-checkbox-label">
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
              />
              <span>Автоматически публиковать импортированные посты</span>
            </label>
            <p className="vk-helper">
              Если выключено, посты будут сохраняться как черновики для ручной модерации
            </p>
          </div>
        </div>
      </div>

      {/* Hashtag Mapping */}
      <div className="vk-card">
        <div className="vk-card-header">
          <h2 className="vk-card-title">Маппинг хештегов на категории</h2>
          <Button variant="outline" size="sm" onClick={addHashtagMapping} leftIcon={<PlusIcon className="w-4 h-4" />}>
            Добавить
          </Button>
        </div>

        {hashtagMappings.length === 0 ? (
          <p className="vk-empty-text">
            Хештеги не настроены. Все посты будут использовать категорию по умолчанию.
            Когда в постах ВК появятся хештеги, добавьте их сюда для автоматической категоризации.
          </p>
        ) : (
          <div className="vk-hashtag-list">
            {hashtagMappings.map((mapping, index) => (
              <div key={index} className="vk-hashtag-row">
                <div className="vk-hashtag-input-wrap">
                  <span className="vk-hashtag-prefix">#</span>
                  <input
                    className="vk-hashtag-input"
                    value={mapping.hashtag}
                    onChange={(e) => updateHashtagMapping(index, 'hashtag', e.target.value)}
                    placeholder="результаты"
                  />
                </div>
                <span className="vk-hashtag-arrow">→</span>
                <select
                  className="vk-select"
                  value={mapping.categoryId}
                  onChange={(e) => updateHashtagMapping(index, 'categoryId', Number(e.target.value))}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button className="vk-remove-btn" onClick={() => removeHashtagMapping(index)}>
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save / Delete Buttons */}
      <div className="vk-actions">
        <Button variant="primary" onClick={handleSave} isLoading={saving}>
          {integration ? 'Сохранить изменения' : 'Создать интеграцию'}
        </Button>
        {integration && (
          <Button variant="ghost" onClick={handleDelete} leftIcon={<TrashIcon className="w-4 h-4" />}>
            Удалить интеграцию
          </Button>
        )}
      </div>
    </div>
  )
}
