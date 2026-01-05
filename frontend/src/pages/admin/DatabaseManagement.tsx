import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  TrashIcon,
  UserGroupIcon,
  NewspaperIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import apiClient from '../../api/client'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

// Категории данных с понятными названиями
const DATA_CATEGORIES = [
  {
    id: 'teams',
    name: 'Команды',
    description: 'Зарегистрированные команды на соревнования',
    icon: UserGroupIcon,
    color: 'blue',
    tableName: 'teams',
    displayColumns: ['name', 'email', 'organization', 'region', 'status', 'created_at'],
    columnLabels: {
      name: 'Название',
      email: 'Email',
      organization: 'Организация',
      region: 'Регион',
      status: 'Статус',
      created_at: 'Дата регистрации'
    }
  },
  {
    id: 'news',
    name: 'Новости',
    description: 'Опубликованные новости на сайте',
    icon: NewspaperIcon,
    color: 'green',
    tableName: 'news',
    displayColumns: ['title', 'is_published', 'created_at'],
    columnLabels: {
      title: 'Заголовок',
      is_published: 'Опубликовано',
      created_at: 'Дата'
    }
  },
  {
    id: 'messages',
    name: 'Сообщения',
    description: 'Сообщения с формы обратной связи',
    icon: EnvelopeIcon,
    color: 'purple',
    tableName: 'contact_messages',
    displayColumns: ['name', 'email', 'subject', 'is_read', 'created_at'],
    columnLabels: {
      name: 'Имя',
      email: 'Email',
      subject: 'Тема',
      is_read: 'Прочитано',
      created_at: 'Дата'
    }
  }
]

interface DataItem {
  id: number
  [key: string]: any
}

export default function DatabaseManagement() {
  const [selectedCategory, setSelectedCategory] = useState(DATA_CATEGORIES[0])
  const [data, setData] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState('')
  
  // Удаление
  const [deleteItem, setDeleteItem] = useState<DataItem | null>(null)
  const [deleteAll, setDeleteAll] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [selectedCategory, page])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/database/tables/${selectedCategory.tableName}`, {
        params: { page, limit: 10 }
      })
      setData(response.data.data || [])
      setTotalPages(response.data.pages || 1)
      setTotalItems(response.data.total || 0)
    } catch (error) {
      toast.error('Ошибка загрузки данных')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    
    setDeleting(true)
    try {
      await apiClient.delete(`/database/tables/${selectedCategory.tableName}/${deleteItem.id}`)
      toast.success('Запись удалена')
      setDeleteItem(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    setDeleting(true)
    try {
      await apiClient.delete(`/database/tables/${selectedCategory.tableName}/clear`)
      toast.success(`Все ${selectedCategory.name.toLowerCase()} удалены`)
      setDeleteAll(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления')
    } finally {
      setDeleting(false)
    }
  }

  const handleBackup = async () => {
    try {
      const response = await apiClient.get('/database/backup', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `eurobot_backup_${new Date().toISOString().slice(0, 10)}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Резервная копия скачана!')
    } catch (error) {
      toast.error('Ошибка создания копии')
    }
  }

  const formatValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'boolean') return value ? '✓ Да' : '✗ Нет'
    if (column === 'status') {
      const statusMap: Record<string, string> = {
        pending: '⏳ На рассмотрении',
        approved: '✓ Одобрено',
        rejected: '✗ Отклонено'
      }
      return statusMap[value] || value
    }
    if (column === 'created_at' || column.includes('_at')) {
      return new Date(value).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
    return String(value).slice(0, 50) + (String(value).length > 50 ? '...' : '')
  }

  const filteredData = search
    ? data.filter(item => 
        Object.values(item).some(v => 
          String(v).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data

  const getColorClasses = (color: string) => ({
    bg: `bg-${color}-50`,
    border: `border-${color}-200`,
    icon: `bg-${color}-100 text-${color}-600`,
    button: `hover:border-${color}-400`
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление данными</h1>
          <p className="text-gray-500">Просмотр и удаление данных на сайте</p>
        </div>
        <Button 
          onClick={handleBackup} 
          variant="outline"
          leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
        >
          Скачать копию
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-3">
        {DATA_CATEGORIES.map((category) => {
          const Icon = category.icon
          const isActive = selectedCategory.id === category.id
          
          return (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category)
                setPage(1)
                setSearch('')
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                isActive 
                  ? 'border-eurobot-blue bg-blue-50 text-eurobot-blue' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-eurobot-blue' : 'text-gray-400'}`} />
              <span className="font-medium">{category.name}</span>
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedCategory.name}
              </h2>
              <p className="text-sm text-gray-500">{selectedCategory.description}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-eurobot-blue focus:border-transparent"
                />
              </div>
              
              {/* Delete All */}
              <Button 
                variant="outline" 
                onClick={() => setDeleteAll(true)}
                disabled={totalItems === 0}
                className="!text-red-600 !border-red-200 hover:!bg-red-50"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Удалить все ({totalItems})
              </Button>
            </div>
          </div>
        </div>

        {/* Data List */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-eurobot-blue border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Загрузка...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <selectedCategory.icon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Нет данных</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Попробуйте изменить поиск' : 'Данные отсутствуют'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredData.map((item) => (
              <div 
                key={item.id} 
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  {/* Main info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {selectedCategory.displayColumns.slice(0, 2).map((col) => (
                      <span 
                        key={col} 
                        className={col === selectedCategory.displayColumns[0] 
                          ? 'font-medium text-gray-900' 
                          : 'text-gray-500'
                        }
                      >
                        {formatValue(item[col], col)}
                      </span>
                    ))}
                  </div>
                  
                  {/* Additional info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    {selectedCategory.displayColumns.slice(2).map((col) => (
                      <span key={col} className="text-sm text-gray-400">
                        {selectedCategory.columnLabels[col]}: {formatValue(item[col], col)}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Delete button */}
                <button
                  onClick={() => setDeleteItem(item)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Страница {page} из {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Назад
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Вперёд
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-medium text-blue-900">Как это работает?</h4>
          <p className="text-sm text-blue-700 mt-1">
            Здесь вы можете просматривать и удалять данные с сайта. 
            Нажмите на иконку корзины справа от записи, чтобы удалить её.
            Перед удалением рекомендуем скачать резервную копию.
          </p>
        </div>
      </div>

      {/* Delete Single Item Modal */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <TrashIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Удалить запись?
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {selectedCategory.displayColumns[0] && formatValue(
                      deleteItem[selectedCategory.displayColumns[0]], 
                      selectedCategory.displayColumns[0]
                    )}
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  ⚠️ Это действие нельзя отменить. Запись будет удалена навсегда.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteItem(null)}
                  disabled={deleting}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 !bg-red-600 hover:!bg-red-700"
                  onClick={handleDelete}
                  isLoading={deleting}
                >
                  Да, удалить
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete All Modal */}
      {deleteAll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Удалить все {selectedCategory.name.toLowerCase()}?
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Будет удалено: {totalItems} записей
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ ВНИМАНИЕ!
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Все {selectedCategory.name.toLowerCase()} будут удалены безвозвратно. 
                  Рекомендуем сначала скачать резервную копию!
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteAll(false)}
                  disabled={deleting}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 !bg-red-600 hover:!bg-red-700"
                  onClick={handleDeleteAll}
                  isLoading={deleting}
                >
                  Да, удалить всё
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
