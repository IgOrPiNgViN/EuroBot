import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  EnvelopeIcon,
  EnvelopeOpenIcon,
  CheckCircleIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { contactsApi } from '../../api/contacts'
import { ContactMessage, ContactTopic } from '../../types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import '../../styles/pages/admin/MessagesManagement.css'

const topicLabels: Record<ContactTopic, string> = {
  technical: 'Технические вопросы',
  registration: 'Регистрация',
  sponsorship: 'Партнерство',
  press: 'Пресса',
  other: 'Другое'
}

export default function MessagesManagement() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [topicFilter, setTopicFilter] = useState<string>('')
  const [readFilter, setReadFilter] = useState<string>('')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)

  const fetchMessages = async () => {
    try {
      const filters: any = { limit: 100 }
      if (topicFilter) filters.topic = topicFilter
      if (readFilter === 'unread') filters.is_read = false
      if (readFilter === 'read') filters.is_read = true

      const data = await contactsApi.getList(filters)
      setMessages(data.items)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [topicFilter, readFilter])

  const handleMarkAsRead = async (message: ContactMessage) => {
    if (message.is_read) return

    try {
      await contactsApi.markAsRead(message.id)
      fetchMessages()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAsReplied = async (id: number) => {
    try {
      await contactsApi.markAsReplied(id)
      fetchMessages()
      toast.success('Отмечено как отвечено')
    } catch (error) {
      toast.error('Ошибка')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это сообщение?')) return

    try {
      await contactsApi.delete(id)
      setMessages(messages.filter(m => m.id !== id))
      setSelectedMessage(null)
      toast.success('Сообщение удалено')
    } catch (error) {
      toast.error('Ошибка при удалении')
    }
  }

  const openMessage = (message: ContactMessage) => {
    setSelectedMessage(message)
    handleMarkAsRead(message)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
      <div className="messages-management">
        <div className="messages-management-header">
          <div>
            <h1 className="messages-management-title">
              Сообщения
            </h1>
            {unreadCount > 0 && (
                <p className="messages-management-unread-count">{unreadCount} непрочитанных</p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="messages-management-filters">
          <div className="messages-management-filter">
            <Select
                label="Тема"
                options={[
                  { value: '', label: 'Все темы' },
                  { value: 'technical', label: 'Технические' },
                  { value: 'registration', label: 'Регистрация' },
                  { value: 'sponsorship', label: 'Партнерство' },
                  { value: 'press', label: 'Пресса' },
                  { value: 'other', label: 'Другое' }
                ]}
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
            />
          </div>
          <div className="messages-management-filter">
            <Select
                label="Статус"
                options={[
                  { value: '', label: 'Все' },
                  { value: 'unread', label: 'Непрочитанные' },
                  { value: 'read', label: 'Прочитанные' }
                ]}
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Messages list */}
        <div className="messages-management-list-container">
          {messages.length > 0 ? (
              <div className="messages-management-list">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        onClick={() => openMessage(message)}
                        className={`messages-management-message-item ${!message.is_read ? 'messages-management-message-unread' : ''}`}
                    >
                      <div className="messages-management-message-content">
                        <div className="messages-management-message-icon">
                          {message.is_read ? (
                              <EnvelopeOpenIcon className="messages-management-icon" />
                          ) : (
                              <EnvelopeIcon className="messages-management-icon" />
                          )}
                        </div>
                        <div className="messages-management-message-details">
                          <div className="messages-management-message-header">
                            <p className={`messages-management-message-name ${!message.is_read ? 'messages-management-message-name-unread' : ''}`}>
                              {message.name}
                            </p>
                            <span className="messages-management-message-topic">
                        {topicLabels[message.topic]}
                      </span>
                            {message.is_replied && (
                                <CheckCircleIcon className="messages-management-replied-icon" />
                            )}
                          </div>
                          <p className="messages-management-message-email">{message.email}</p>
                          <p className="messages-management-message-preview">{message.message}</p>
                        </div>
                      </div>
                      <div className="messages-management-message-date">
                        {format(new Date(message.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </div>
                    </div>
                ))}
              </div>
          ) : (
              <div className="messages-management-empty">
                Сообщений не найдено
              </div>
          )}
        </div>

        {/* Message detail modal */}
        {selectedMessage && (
            <div className="messages-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="messages-management-modal"
              >
                <div className="messages-management-modal-header">
                  <div className="messages-management-modal-header-content">
                    <h2 className="messages-management-modal-title">{selectedMessage.name}</h2>
                    <p className="messages-management-modal-email">{selectedMessage.email}</p>
                    {selectedMessage.phone && (
                        <p className="messages-management-modal-phone">{selectedMessage.phone}</p>
                    )}
                  </div>
                  <button
                      onClick={() => setSelectedMessage(null)}
                      className="messages-management-modal-close"
                  >
                    <XMarkIcon className="messages-management-modal-close-icon" />
                  </button>
                </div>

                <div className="messages-management-modal-content">
                  <div className="messages-management-modal-meta">
                <span className="messages-management-modal-topic">
                  {topicLabels[selectedMessage.topic]}
                </span>
                    <span className="messages-management-modal-date">
                  {format(new Date(selectedMessage.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </span>
                  </div>

                  <div className="messages-management-modal-message">
                    <p className="messages-management-modal-text">{selectedMessage.message}</p>
                  </div>
                </div>

                <div className="messages-management-modal-footer">
                  <div className="messages-management-modal-actions">
                    {!selectedMessage.is_replied && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMarkAsReplied(selectedMessage.id)}
                            leftIcon={<CheckCircleIcon className="messages-management-action-icon" />}
                            className="messages-management-mark-replied"
                        >
                          Отмечено отвечено
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(selectedMessage.id)}
                        leftIcon={<TrashIcon className="messages-management-action-icon" />}
                        className="messages-management-delete-button"
                    >
                      Удалить
                    </Button>
                  </div>
                  <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${topicLabels[selectedMessage.topic]}`}
                      className="messages-management-reply-link"
                  >
                    Ответить по email
                  </a>
                </div>
              </motion.div>
            </div>
        )}
      </div>
  )
}