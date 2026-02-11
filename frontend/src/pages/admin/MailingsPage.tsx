import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  PaperAirplaneIcon,
  PlusIcon,
  TrashIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { emailsApi, MassMailingCampaign, EmailStats, EmailLog, CreateCampaignData, TeamEmail } from '../../api/emails'
import { seasonsApi } from '../../api/seasons'
import { Season } from '../../types'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import '../../styles/pages/admin/MailingsPage.css'

type TabType = 'campaigns' | 'logs' | 'custom'
type RecipientMode = 'teams' | 'custom' | 'limit'

const targetTypeOptions = [
  { value: 'all_teams', label: 'Все команды' },
  { value: 'approved_teams', label: 'Подтверждённые команды' },
  { value: 'pending_teams', label: 'Ожидающие подтверждения' }
]

const statusLabels: Record<string, { label: string, color: string }> = {
  pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800' },
  sent: { label: 'Отправлено', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Ошибка', color: 'bg-red-100 text-red-800' }
}

export default function MailingsPage() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'super_admin'

  const [activeTab, setActiveTab] = useState<TabType>('campaigns')
  const [loading, setLoading] = useState(true)

  // Campaigns state
  const [campaigns, setCampaigns] = useState<MassMailingCampaign[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sending, setSending] = useState<number | null>(null)

  // Logs state
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [logsPage, setLogsPage] = useState(1)
  const [logsPages, setLogsPages] = useState(1)
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [clearingLogs, setClearingLogs] = useState(false)
  const [clearingCampaigns, setClearingCampaigns] = useState(false)

  // Custom email state
  const [customEmail, setCustomEmail] = useState({
    to: '',
    subject: '',
    body: ''
  })
  const [sendingCustom, setSendingCustom] = useState(false)

  // Seasons for campaign creation
  const [seasons, setSeasons] = useState<Season[]>([])

  // Teams emails for selection
  const [teamsEmails, setTeamsEmails] = useState<TeamEmail[]>([])
  const [loadingEmails, setLoadingEmails] = useState(false)

  // Recipient mode: teams (from target), custom (manual input), limit (last N)
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('teams')

  // Campaign form
  const [campaignForm, setCampaignForm] = useState<CreateCampaignData>({
    name: '',
    subject: '',
    body: '',
    target_type: 'approved_teams',
    target_season_id: undefined,
    custom_emails: undefined,
    recipients_limit: undefined,
    scheduled_at: undefined
  })

  // Custom emails input - array of individual emails
  const [customEmailsList, setCustomEmailsList] = useState<string[]>([''])

  // Scheduling
  const [enableSchedule, setEnableSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  // Recipients limit
  const [recipientsLimit, setRecipientsLimit] = useState<number | undefined>(undefined)

  useEffect(() => {
    loadData()
  }, [activeTab, logsPage])

  // Load teams emails when modal opens
  const loadTeamsEmails = async () => {
    setLoadingEmails(true)
    try {
      const emails = await emailsApi.getTeamsEmails()
      setTeamsEmails(emails)
    } catch (e) {
      console.error('Failed to load teams emails:', e)
      setTeamsEmails([])
    } finally {
      setLoadingEmails(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'campaigns') {
        // Load campaigns and seasons separately to handle errors
        try {
          const campaignsData = await emailsApi.getCampaigns()
          setCampaigns(campaignsData?.items || [])
        } catch (e) {
          console.error('Failed to load campaigns:', e)
          setCampaigns([])
        }

        try {
          const seasonsData = await seasonsApi.getList()
          setSeasons(seasonsData || [])
        } catch (e) {
          console.error('Failed to load seasons:', e)
          setSeasons([])
        }
      } else if (activeTab === 'logs') {
        try {
          const logsData = await emailsApi.getLogs({ page: logsPage, limit: 20 })
          setLogs(logsData?.items || [])
          setLogsPages(logsData?.pages || 1)
        } catch (e) {
          console.error('Failed to load logs:', e)
          setLogs([])
        }

        try {
          const statsData = await emailsApi.getStats()
          setStats(statsData)
        } catch (e) {
          console.error('Failed to load stats:', e)
          setStats(null)
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.subject || !campaignForm.body) {
      toast.error('Заполните все обязательные поля')
      return
    }

    // Build campaign data based on recipient mode
    let finalData: CreateCampaignData = {
      ...campaignForm,
      target_type: recipientMode === 'custom' ? 'custom_emails' : campaignForm.target_type
    }

    // Handle custom emails
    if (recipientMode === 'custom') {
      const emails = customEmailsList.filter(e => e.trim() && e.includes('@'))
      if (emails.length === 0) {
        toast.error('Укажите хотя бы один email')
        return
      }
      finalData.custom_emails = emails
    }

    // Handle limit
    if (recipientMode === 'limit' && recipientsLimit && recipientsLimit > 0) {
      finalData.recipients_limit = recipientsLimit
    }

    // Handle scheduling
    if (enableSchedule && scheduleDate && scheduleTime) {
      finalData.scheduled_at = `${scheduleDate}T${scheduleTime}:00`
    }

    setCreating(true)
    try {
      await emailsApi.createCampaign(finalData)
      toast.success('Рассылка создана')
      setShowCreateModal(false)
      resetForm()
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при создании')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setCampaignForm({
      name: '',
      subject: '',
      body: '',
      target_type: 'approved_teams',
      target_season_id: undefined,
      custom_emails: undefined,
      recipients_limit: undefined,
      scheduled_at: undefined
    })
    setRecipientMode('teams')
    setCustomEmailsList([''])
    setEnableSchedule(false)
    setScheduleDate('')
    setScheduleTime('')
    setRecipientsLimit(undefined)
  }

  // Custom email field handlers
  const addEmailField = () => {
    setCustomEmailsList([...customEmailsList, ''])
  }

  const removeEmailField = (index: number) => {
    if (customEmailsList.length > 1) {
      setCustomEmailsList(customEmailsList.filter((_, i) => i !== index))
    }
  }

  const updateEmailField = (index: number, value: string) => {
    const updated = [...customEmailsList]
    updated[index] = value
    setCustomEmailsList(updated)
  }

  const addEmailFromTeam = (email: string) => {
    if (!customEmailsList.includes(email)) {
      // Replace empty field or add new
      const emptyIndex = customEmailsList.findIndex(e => !e.trim())
      if (emptyIndex !== -1) {
        updateEmailField(emptyIndex, email)
      } else {
        setCustomEmailsList([...customEmailsList, email])
      }
    }
  }

  const removeEmailFromList = (email: string) => {
    const filtered = customEmailsList.filter(e => e !== email)
    setCustomEmailsList(filtered.length > 0 ? filtered : [''])
  }

  const openCreateModal = () => {
    resetForm()
    loadTeamsEmails()
    setShowCreateModal(true)
  }

  const handleSendCampaign = async (campaign: MassMailingCampaign) => {
    if (!confirm(`Вы уверены, что хотите отправить рассылку "${campaign.name}" для ${campaign.total_recipients} получателей?`)) {
      return
    }

    setSending(campaign.id)
    try {
      const result = await emailsApi.sendCampaign(campaign.id)
      toast.success(result.message)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при отправке')
    } finally {
      setSending(null)
    }
  }

  const handleDeleteCampaign = async (campaign: MassMailingCampaign) => {
    if (!confirm(`Удалить рассылку "${campaign.name}"?`)) {
      return
    }

    try {
      await emailsApi.deleteCampaign(campaign.id)
      toast.success('Рассылка удалена')
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при удалении')
    }
  }

  const handleSendCustomEmail = async () => {
    const recipients = customEmail.to.split(',').map(e => e.trim()).filter(e => e)

    if (recipients.length === 0) {
      toast.error('Укажите получателей')
      return
    }
    if (!customEmail.subject || !customEmail.body) {
      toast.error('Заполните тему и текст письма')
      return
    }

    setSendingCustom(true)
    try {
      const result = await emailsApi.sendCustom({
        to: recipients,
        subject: customEmail.subject,
        body: customEmail.body
      })
      toast.success(result.message)
      setCustomEmail({ to: '', subject: '', body: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при отправке')
    } finally {
      setSendingCustom(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleClearLogs = async () => {
    if (!confirm('Вы уверены, что хотите очистить всю историю отправок? Это действие нельзя отменить.')) {
      return
    }

    setClearingLogs(true)
    try {
      const result = await emailsApi.clearLogs()
      toast.success(result.message)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при очистке истории')
    } finally {
      setClearingLogs(false)
    }
  }

  const handleClearCampaigns = async () => {
    if (!confirm('Вы уверены, что хотите удалить все рассылки? Это действие нельзя отменить.')) {
      return
    }

    setClearingCampaigns(true)
    try {
      const result = await emailsApi.clearCampaigns()
      toast.success(result.message)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при удалении рассылок')
    } finally {
      setClearingCampaigns(false)
    }
  }

  return (
      <div className="mailings-page">
        <div className="mailings-page-header">
          <h1 className="mailings-page-title">
            Рассылки
          </h1>
          {isSuperAdmin && activeTab === 'campaigns' && (
              <div className="mailings-page-header-actions">
                {campaigns.length > 0 && (
                    <Button
                        variant="outline"
                        color="red"
                        onClick={handleClearCampaigns}
                        isLoading={clearingCampaigns}
                        leftIcon={<TrashIcon className="mailings-page-button-icon" />}
                    >
                      Очистить все
                    </Button>
                )}
                <Button
                    onClick={openCreateModal}
                    leftIcon={<PlusIcon className="mailings-page-button-icon" />}
                >
                  Создать рассылку
                </Button>
              </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mailings-page-tabs">
          <nav className="mailings-page-tabs-nav">
            <button
                onClick={() => setActiveTab('campaigns')}
                className={`mailings-page-tab ${activeTab === 'campaigns' ? 'mailings-page-tab-active' : 'mailings-page-tab-inactive'}`}
            >
              <EnvelopeIcon className="mailings-page-tab-icon" />
              Кампании рассылок
            </button>
            <button
                onClick={() => setActiveTab('logs')}
                className={`mailings-page-tab ${activeTab === 'logs' ? 'mailings-page-tab-active' : 'mailings-page-tab-inactive'}`}
            >
              <ChartBarIcon className="mailings-page-tab-icon" />
              История отправок
            </button>
            <button
                onClick={() => setActiveTab('custom')}
                className={`mailings-page-tab ${activeTab === 'custom' ? 'mailings-page-tab-active' : 'mailings-page-tab-inactive'}`}
            >
              <PaperAirplaneIcon className="mailings-page-tab-icon" />
              Отправить письмо
            </button>
          </nav>
        </div>

        {loading ? (
            <div className="mailings-page-loading">
              <LoadingSpinner />
            </div>
        ) : (
            <>
              {/* Campaigns Tab */}
              {activeTab === 'campaigns' && (
                  <div className="mailings-page-campaigns">
                    {campaigns.length === 0 ? (
                        <div className="mailings-page-empty">
                          <EnvelopeIcon className="mailings-page-empty-icon" />
                          <p className="mailings-page-empty-text">Нет созданных рассылок</p>
                          {isSuperAdmin && (
                              <Button
                                  onClick={openCreateModal}
                                  variant="outline"
                                  className="mailings-page-empty-button"
                              >
                                Создать первую рассылку
                              </Button>
                          )}
                        </div>
                    ) : (
                        campaigns.map((campaign) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mailings-page-campaign-card"
                            >
                              <div className="mailings-page-campaign-content">
                                <div className="mailings-page-campaign-header">
                                  <div className="mailings-page-campaign-info">
                                    <div className="mailings-page-campaign-title-container">
                                      <h3 className="mailings-page-campaign-name">{campaign.name}</h3>
                                      {campaign.is_sent ? (
                                          <span className="mailings-page-campaign-status mailings-page-campaign-status-sent">
                                <CheckCircleIcon className="mailings-page-status-icon" />
                                Отправлено
                              </span>
                                      ) : campaign.is_scheduled && campaign.scheduled_at ? (
                                          <span className="mailings-page-campaign-status mailings-page-campaign-status-scheduled">
                                <CalendarDaysIcon className="mailings-page-status-icon" />
                                Запланировано на {formatDate(campaign.scheduled_at)}
                              </span>
                                      ) : (
                                          <span className="mailings-page-campaign-status mailings-page-campaign-status-draft">
                                <ClockIcon className="mailings-page-status-icon" />
                                Черновик
                              </span>
                                      )}
                                    </div>
                                    <p className="mailings-page-campaign-subject">
                                      <strong>Тема:</strong> {campaign.subject}
                                    </p>
                                    <p className="mailings-page-campaign-preview">
                                      {campaign.body}
                                    </p>
                                    <div className="mailings-page-campaign-meta">
                            <span className="mailings-page-campaign-meta-item">
                              <EnvelopeIcon className="mailings-page-meta-icon" />
                              {campaign.total_recipients} получателей
                            </span>
                                      {campaign.is_sent && (
                                          <>
                                <span className="mailings-page-campaign-meta-item mailings-page-campaign-meta-success">
                                  <CheckCircleIcon className="mailings-page-meta-icon" />
                                  Успешно: {campaign.sent_count}
                                </span>
                                            {campaign.failed_count > 0 && (
                                                <span className="mailings-page-campaign-meta-item mailings-page-campaign-meta-failed">
                                    <XCircleIcon className="mailings-page-meta-icon" />
                                    Ошибок: {campaign.failed_count}
                                  </span>
                                            )}
                                          </>
                                      )}
                                      <span className="mailings-page-campaign-meta-item">
                              Создано: {formatDate(campaign.created_at)}
                            </span>
                                      {campaign.sent_at && (
                                          <span className="mailings-page-campaign-meta-item">
                                Отправлено: {formatDate(campaign.sent_at)}
                              </span>
                                      )}
                                    </div>
                                  </div>

                                  {isSuperAdmin && !campaign.is_sent && (
                                      <div className="mailings-page-campaign-actions">
                                        <Button
                                            size="sm"
                                            onClick={() => handleSendCampaign(campaign)}
                                            isLoading={sending === campaign.id}
                                            leftIcon={<PaperAirplaneIcon className="mailings-page-action-icon" />}
                                        >
                                          Отправить
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            color="red"
                                            onClick={() => handleDeleteCampaign(campaign)}
                                            leftIcon={<TrashIcon className="mailings-page-action-icon" />}
                                        >
                                          Удалить
                                        </Button>
                                      </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                        ))
                    )}
                  </div>
              )}

              {/* Logs Tab */}
              {activeTab === 'logs' && (
                  <div className="mailings-page-logs">
                    {/* Header with clear button */}
                    {isSuperAdmin && logs.length > 0 && (
                        <div className="mailings-page-logs-header">
                          <Button
                              variant="outline"
                              color="red"
                              size="sm"
                              onClick={handleClearLogs}
                              isLoading={clearingLogs}
                              leftIcon={<TrashIcon className="mailings-page-action-icon" />}
                          >
                            Очистить историю
                          </Button>
                        </div>
                    )}

                    {/* Stats */}
                    {stats && (
                        <div className="mailings-page-stats">
                          <div className="mailings-page-stat-card">
                            <div className="mailings-page-stat-value">{stats.total}</div>
                            <div className="mailings-page-stat-label">Всего писем</div>
                          </div>
                          <div className="mailings-page-stat-card">
                            <div className="mailings-page-stat-value mailings-page-stat-value-success">{stats.sent}</div>
                            <div className="mailings-page-stat-label">Отправлено</div>
                          </div>
                          <div className="mailings-page-stat-card">
                            <div className="mailings-page-stat-value mailings-page-stat-value-failed">{stats.failed}</div>
                            <div className="mailings-page-stat-label">Ошибок</div>
                          </div>
                          <div className="mailings-page-stat-card">
                            <div className="mailings-page-stat-value mailings-page-stat-value-pending">{stats.pending}</div>
                            <div className="mailings-page-stat-label">В очереди</div>
                          </div>
                        </div>
                    )}

                    {/* Logs table */}
                    <div className="mailings-page-logs-table-container">
                      <table className="mailings-page-logs-table">
                        <thead className="mailings-page-logs-table-head">
                        <tr>
                          <th className="mailings-page-logs-table-header mailings-page-logs-table-recipient">
                            Получатель
                          </th>
                          <th className="mailings-page-logs-table-header">
                            Тема
                          </th>
                          <th className="mailings-page-logs-table-header mailings-page-logs-table-type">
                            Тип
                          </th>
                          <th className="mailings-page-logs-table-header mailings-page-logs-table-status">
                            Статус / Ошибка
                          </th>
                          <th className="mailings-page-logs-table-header mailings-page-logs-table-date">
                            Дата
                          </th>
                        </tr>
                        </thead>
                        <tbody className="mailings-page-logs-table-body">
                        {logs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="mailings-page-logs-empty">
                                Нет записей
                              </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="mailings-page-logs-table-row">
                                  <td className="mailings-page-logs-table-cell mailings-page-logs-table-email">
                                    {log.to_email}
                                  </td>
                                  <td className="mailings-page-logs-table-cell">
                                    {log.subject}
                                  </td>
                                  <td className="mailings-page-logs-table-cell mailings-page-logs-table-type-cell">
                                    {log.email_type}
                                  </td>
                                  <td className="mailings-page-logs-table-cell">
                            <span className={`mailings-page-logs-status ${statusLabels[log.status]?.color || 'mailings-page-logs-status-default'}`}>
                              {statusLabels[log.status]?.label || log.status}
                            </span>
                                    {log.error_message && (
                                        <div className="mailings-page-logs-error">
                                          {log.error_message}
                                        </div>
                                    )}
                                  </td>
                                  <td className="mailings-page-logs-table-cell mailings-page-logs-table-date-cell">
                                    {formatDate(log.created_at)}
                                  </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {logsPages > 1 && (
                        <div className="mailings-page-logs-pagination">
                          <Button
                              variant="outline"
                              size="sm"
                              disabled={logsPage === 1}
                              onClick={() => setLogsPage(p => p - 1)}
                              className="mailings-page-pagination-button"
                          >
                            Назад
                          </Button>
                          <span className="mailings-page-pagination-info">
                    {logsPage} из {logsPages}
                  </span>
                          <Button
                              variant="outline"
                              size="sm"
                              disabled={logsPage === logsPages}
                              onClick={() => setLogsPage(p => p + 1)}
                              className="mailings-page-pagination-button"
                          >
                            Вперёд
                          </Button>
                        </div>
                    )}
                  </div>
              )}

              {/* Custom Email Tab */}
              {activeTab === 'custom' && (
                  <div className="mailings-page-custom">
                    <h2 className="mailings-page-custom-title">Отправить письмо</h2>
                    <div className="mailings-page-custom-form">
                      <Input
                          label="Получатели"
                          value={customEmail.to}
                          onChange={(e) => setCustomEmail({ ...customEmail, to: e.target.value })}
                          placeholder="email1@example.com, email2@example.com"
                          helperText="Разделяйте несколько адресов запятой"
                      />
                      <Input
                          label="Тема письма"
                          value={customEmail.subject}
                          onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                          placeholder="Тема сообщения"
                      />
                      <Textarea
                          label="Текст письма"
                          value={customEmail.body}
                          onChange={(e) => setCustomEmail({ ...customEmail, body: e.target.value })}
                          placeholder="Напишите текст письма..."
                          rows={8}
                      />
                      <Button
                          onClick={handleSendCustomEmail}
                          isLoading={sendingCustom}
                          leftIcon={<PaperAirplaneIcon className="mailings-page-button-icon" />}
                          className="mailings-page-custom-send-button"
                      >
                        Отправить
                      </Button>
                    </div>
                  </div>
              )}
            </>
        )}

        {/* Create Campaign Modal */}
        {showCreateModal && (
            <div className="mailings-page-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mailings-page-modal mailings-page-create-modal"
              >
                <div className="mailings-page-modal-header">
                  <h2 className="mailings-page-modal-title">
                    Создать рассылку
                  </h2>
                </div>
                <div className="mailings-page-modal-content mailings-page-modal-two-columns">
                  {/* Первая колонка */}
                  <div className="mailings-page-modal-column-left">
                    <Input
                        label="Название рассылки"
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                        placeholder="Например: Напоминание о регистрации"
                        required
                    />

                    {/* Recipient Mode Selection */}
                    <div className="mailings-page-recipient-modes">
                      <label className="mailings-page-recipient-modes-label">
                        Способ выбора получателей
                      </label>
                      <div className="mailings-page-recipient-modes-grid">
                        <button
                            type="button"
                            onClick={() => setRecipientMode('teams')}
                            className={`mailings-page-recipient-mode-card ${recipientMode === 'teams' ? 'mailings-page-recipient-mode-active' : ''}`}
                        >
                          <UserGroupIcon className="mailings-page-recipient-mode-icon" />
                          <div className="mailings-page-recipient-mode-title">По категории</div>
                          <div className="mailings-page-recipient-mode-description">Выбрать по статусу команды</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRecipientMode('limit')}
                            className={`mailings-page-recipient-mode-card ${recipientMode === 'limit' ? 'mailings-page-recipient-mode-active' : ''}`}
                        >
                          <ChartBarIcon className="mailings-page-recipient-mode-icon" />
                          <div className="mailings-page-recipient-mode-title">Последние N</div>
                          <div className="mailings-page-recipient-mode-description">Ограничить количество</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRecipientMode('custom')}
                            className={`mailings-page-recipient-mode-card ${recipientMode === 'custom' ? 'mailings-page-recipient-mode-active' : ''}`}
                        >
                          <EnvelopeIcon className="mailings-page-recipient-mode-icon" />
                          <div className="mailings-page-recipient-mode-title">Свои email</div>
                          <div className="mailings-page-recipient-mode-description">Ввести адреса вручную</div>
                        </button>
                      </div>
                    </div>

                    {/* Teams selection mode */}
                    {recipientMode === 'teams' && (
                        <div className="mailings-page-recipient-section">
                          <Select
                              label="Целевая аудитория"
                              value={campaignForm.target_type}
                              onChange={(e) => setCampaignForm({ ...campaignForm, target_type: e.target.value as CreateCampaignData['target_type'] })}
                              options={targetTypeOptions}
                          />
                          <Select
                              label="Сезон (необязательно)"
                              value={campaignForm.target_season_id?.toString() || ''}
                              onChange={(e) => setCampaignForm({
                                ...campaignForm,
                                target_season_id: e.target.value ? parseInt(e.target.value) : undefined
                              })}
                              options={[
                                { value: '', label: 'Все сезоны' },
                                ...seasons.map(s => ({ value: s.id.toString(), label: s.name }))
                              ]}
                          />
                        </div>
                    )}

                    {/* Limit mode */}
                    {recipientMode === 'limit' && (
                        <div className="mailings-page-recipient-section">
                          <Select
                              label="Целевая аудитория"
                              value={campaignForm.target_type}
                              onChange={(e) => setCampaignForm({ ...campaignForm, target_type: e.target.value as CreateCampaignData['target_type'] })}
                              options={targetTypeOptions}
                          />
                          <Input
                              type="number"
                              label="Количество последних зарегистрированных"
                              value={recipientsLimit?.toString() || ''}
                              onChange={(e) => setRecipientsLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="Например: 50"
                              min={1}
                          />
                          <p className="mailings-page-recipient-hint">
                            Письмо получат последние N зарегистрированных команд из выбранной категории
                          </p>
                        </div>
                    )}

                    {/* Custom emails mode */}
                    {recipientMode === 'custom' && (
                        <div className="mailings-page-recipient-section">
                          <div>
                            <label className="mailings-page-custom-emails-label">
                              Email адреса ({customEmailsList.filter(e => e.trim()).length})
                            </label>
                            <div className="mailings-page-custom-emails-list">
                              {customEmailsList.map((email, index) => (
                                  <div key={index} className="mailings-page-custom-email-row">
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => updateEmailField(index, e.target.value)}
                                        placeholder="example@email.com"
                                        className="mailings-page-custom-email-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeEmailField(index)}
                                        disabled={customEmailsList.length === 1 && !email}
                                        className="mailings-page-custom-email-remove"
                                    >
                                      <TrashIcon className="mailings-page-custom-email-remove-icon" />
                                    </button>
                                  </div>
                              ))}
                            </div>
                            <button
                                type="button"
                                onClick={addEmailField}
                                className="mailings-page-add-email-button"
                            >
                              <PlusIcon className="mailings-page-add-email-icon" />
                              Добавить ещё email
                            </button>
                          </div>

                          {/* Quick select from registered teams */}
                          {teamsEmails.length > 0 && (
                              <div className="mailings-page-teams-select">
                                <label className="mailings-page-teams-select-label">
                                  Быстрый выбор из зарегистрированных ({teamsEmails.length}):
                                </label>
                                <div className="mailings-page-teams-list">
                                  {loadingEmails ? (
                                      <div className="mailings-page-teams-loading">Загрузка...</div>
                                  ) : (
                                      teamsEmails.map((team) => {
                                        const isSelected = customEmailsList.includes(team.email)
                                        return (
                                            <div
                                                key={team.id}
                                                className={`mailings-page-team-item ${isSelected ? 'mailings-page-team-item-selected' : ''}`}
                                            >
                                              <div className="mailings-page-team-info">
                                                <div className="mailings-page-team-name">{team.name}</div>
                                                <div className="mailings-page-team-email">{team.email}</div>
                                              </div>
                                              {isSelected ? (
                                                  <button
                                                      type="button"
                                                      onClick={() => removeEmailFromList(team.email)}
                                                      className="mailings-page-team-remove-button"
                                                  >
                                                    Убрать
                                                  </button>
                                              ) : (
                                                  <button
                                                      type="button"
                                                      onClick={() => addEmailFromTeam(team.email)}
                                                      className="mailings-page-team-add-button"
                                                  >
                                                    Добавить
                                                  </button>
                                              )}
                                            </div>
                                        )
                                      })
                                  )}
                                </div>
                              </div>
                          )}
                        </div>
                    )}
                  </div>

                  {/* Вторая колонка */}
                  <div className="mailings-page-modal-column-right">
                    {/* Scheduling */}
                    <div className="mailings-page-scheduling">
                      <label className="mailings-page-scheduling-label">
                        <input
                            type="checkbox"
                            checked={enableSchedule}
                            onChange={(e) => setEnableSchedule(e.target.checked)}
                            className="mailings-page-scheduling-checkbox"
                        />
                        <CalendarDaysIcon className="mailings-page-scheduling-icon" />
                        <span className="mailings-page-scheduling-title">Запланировать отправку</span>
                      </label>

                      {enableSchedule && (
                          <div className="mailings-page-schedule-fields">
                            <Input
                                type="date"
                                label="Дата отправки"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <Input
                                type="time"
                                label="Время отправки"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                            />
                          </div>
                      )}
                    </div>

                    <Input
                        label="Тема письма"
                        value={campaignForm.subject}
                        onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                        placeholder="Тема вашего письма"
                        required
                    />
                    <Textarea
                        label="Текст письма"
                        value={campaignForm.body}
                        onChange={(e) => setCampaignForm({ ...campaignForm, body: e.target.value })}
                        placeholder="Напишите текст рассылки..."
                        rows={8}
                        required
                    />

                    <div className="mailings-page-warning">
                      <div className="mailings-page-warning-content">
                        <ExclamationTriangleIcon className="mailings-page-warning-icon" />
                        <div className="mailings-page-warning-text">
                          <p className="mailings-page-warning-title">Важно!</p>
                          <p>
                            {enableSchedule
                                ? 'Рассылка будет отправлена автоматически в указанное время.'
                                : 'После создания рассылку нужно будет вручную отправить.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mailings-page-modal-footer">
                  <Button
                      variant="ghost"
                      onClick={() => setShowCreateModal(false)}
                      className="mailings-page-modal-cancel"
                  >
                    Отмена
                  </Button>
                  <Button
                      onClick={handleCreateCampaign}
                      isLoading={creating}
                      className="mailings-page-modal-confirm"
                  >
                    {enableSchedule ? 'Запланировать' : 'Создать'}
                  </Button>
                </div>
              </motion.div>
            </div>
        )}
      </div>
  )
}