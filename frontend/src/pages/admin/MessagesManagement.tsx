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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Сообщения
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} непрочитанных</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-wrap gap-4">
        <div className="w-48">
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
        <div className="w-48">
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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {messages.length > 0 ? (
          <div className="divide-y">
            {messages.map((message) => (
              <div
                key={message.id}
                onClick={() => openMessage(message)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !message.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${message.is_read ? 'text-gray-400' : 'text-blue-500'}`}>
                      {message.is_read ? (
                        <EnvelopeOpenIcon className="w-5 h-5" />
                      ) : (
                        <EnvelopeIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium ${!message.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {message.name}
                        </p>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                          {topicLabels[message.topic]}
                        </span>
                        {message.is_replied && (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{message.email}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{message.message}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {format(new Date(message.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Сообщений не найдено
          </div>
        )}
      </div>

      {/* Message detail modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-lg"
          >
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-xl font-heading font-bold">{selectedMessage.name}</h2>
                <p className="text-gray-500">{selectedMessage.email}</p>
                {selectedMessage.phone && (
                  <p className="text-gray-500">{selectedMessage.phone}</p>
                )}
              </div>
              <button onClick={() => setSelectedMessage(null)}>
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                  {topicLabels[selectedMessage.topic]}
                </span>
                <span className="text-sm text-gray-400">
                  {format(new Date(selectedMessage.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-between">
              <div className="flex space-x-2">
                {!selectedMessage.is_replied && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMarkAsReplied(selectedMessage.id)}
                    leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                  >
                    Отмечено отвечено
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(selectedMessage.id)}
                  leftIcon={<TrashIcon className="w-4 h-4" />}
                  className="text-red-600 hover:bg-red-50"
                >
                  Удалить
                </Button>
              </div>
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${topicLabels[selectedMessage.topic]}`}
                className="btn-primary text-sm"
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



