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
import '../../styles/pages/admin/DatabaseManagement.css'

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

  return (
      <div className="database-management">
        {/* Header */}
        <div className="database-management-header">
          <div>
            <h1 className="database-management-title">Управление данными</h1>
            <p className="database-management-subtitle">Просмотр и удаление данных на сайте</p>
          </div>
          <Button
              onClick={handleBackup}
              variant="outline"
              leftIcon={<ArrowDownTrayIcon className="database-management-button-icon" />}
          >
            Скачать копию
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="database-management-categories">
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
                    className={`database-management-category-tab ${
                        isActive ? 'database-management-category-tab-active' : 'database-management-category-tab-inactive'
                    }`}
                >
                  <Icon className={`database-management-category-icon ${
                      isActive ? 'database-management-category-icon-active' : 'database-management-category-icon-inactive'
                  }`} />
                  <span className="database-management-category-name">{category.name}</span>
                </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="database-management-content">
          {/* Header */}
          <div className="database-management-content-header">
            <div>
              <h2 className="database-management-content-title">
                {selectedCategory.name}
              </h2>
              <p className="database-management-content-description">{selectedCategory.description}</p>
            </div>

            <div className="database-management-actions">
              {/* Search */}
              <div className="database-management-search">
                <MagnifyingGlassIcon className="database-management-search-icon" />
                <input
                    type="text"
                    placeholder="Поиск..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="database-management-search-input"
                />
              </div>

              {/* Delete All */}
              <Button
                  variant="outline"
                  onClick={() => setDeleteAll(true)}
                  disabled={totalItems === 0}
                  className="database-management-delete-all-button"
              >
                <TrashIcon className="database-management-delete-all-icon" />
                Удалить все ({totalItems})
              </Button>
            </div>
          </div>

          {/* Data List */}
          {loading ? (
              <div className="database-management-loading">
                <div className="database-management-loading-spinner" />
                <p className="database-management-loading-text">Загрузка...</p>
              </div>
          ) : filteredData.length === 0 ? (
              <div className="database-management-empty">
                <div className="database-management-empty-icon">
                  <selectedCategory.icon className="database-management-empty-icon-svg" />
                </div>
                <p className="database-management-empty-text">Нет данных</p>
                <p className="database-management-empty-hint">
                  {search ? 'Попробуйте изменить поиск' : 'Данные отсутствуют'}
                </p>
              </div>
          ) : (
              <div className="database-management-list">
                {filteredData.map((item) => (
                    <div
                        key={item.id}
                        className="database-management-item"
                    >
                      <div className="database-management-item-content">
                        {/* Main info */}
                        <div className="database-management-item-main">
                          {selectedCategory.displayColumns.slice(0, 2).map((col) => (
                              <span
                                  key={col}
                                  className={`database-management-item-field ${
                                      col === selectedCategory.displayColumns[0]
                                          ? 'database-management-item-primary'
                                          : 'database-management-item-secondary'
                                  }`}
                              >
                        {formatValue(item[col], col)}
                      </span>
                          ))}
                        </div>

                        {/* Additional info */}
                        <div className="database-management-item-additional">
                          {selectedCategory.displayColumns.slice(2).map((col) => (
                              <span key={col} className="database-management-item-additional-field">
                        {selectedCategory.columnLabels[col]}: {formatValue(item[col], col)}
                      </span>
                          ))}
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                          onClick={() => setDeleteItem(item)}
                          className="database-management-item-delete"
                          title="Удалить"
                      >
                        <TrashIcon className="database-management-item-delete-icon" />
                      </button>
                    </div>
                ))}
              </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
              <div className="database-management-pagination">
            <span className="database-management-pagination-info">
              Страница {page} из {totalPages}
            </span>
                <div className="database-management-pagination-controls">
                  <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="database-management-pagination-button"
                  >
                    <ChevronLeftIcon className="database-management-pagination-icon" />
                    Назад
                  </Button>
                  <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="database-management-pagination-button"
                  >
                    Вперёд
                    <ChevronRightIcon className="database-management-pagination-icon" />
                  </Button>
                </div>
              </div>
          )}
        </div>

        {/* Info */}
        <div className="database-management-info">
          <div className="database-management-info-icon">
            <ExclamationTriangleIcon className="database-management-info-icon-svg" />
          </div>
          <div>
            <h4 className="database-management-info-title">Как это работает?</h4>
            <p className="database-management-info-description">
              Здесь вы можете просматривать и удалять данные с сайта.
              Нажмите на иконку корзины справа от записи, чтобы удалить её.
              Перед удалением рекомендуем скачать резервную копию.
            </p>
          </div>
        </div>

        {/* Delete Single Item Modal */}
        {deleteItem && (
            <div className="database-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="database-management-modal"
              >
                <div className="database-management-modal-content">
                  <div className="database-management-delete-header">
                    <div className="database-management-delete-icon-container">
                      <TrashIcon className="database-management-delete-icon-svg" />
                    </div>
                    <div>
                      <h3 className="database-management-delete-title">
                        Удалить запись?
                      </h3>
                      <p className="database-management-delete-subtitle">
                        {selectedCategory.displayColumns[0] && formatValue(
                            deleteItem[selectedCategory.displayColumns[0]],
                            selectedCategory.displayColumns[0]
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="database-management-delete-warning">
                    <p className="database-management-delete-warning-text">
                      ⚠️ Это действие нельзя отменить. Запись будет удалена навсегда.
                    </p>
                  </div>

                  <div className="database-management-modal-actions">
                    <Button
                        variant="outline"
                        className="database-management-modal-cancel"
                        onClick={() => setDeleteItem(null)}
                        disabled={deleting}
                    >
                      Отмена
                    </Button>
                    <Button
                        className="database-management-modal-confirm"
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
            <div className="database-management-modal-overlay">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="database-management-modal"
              >
                <div className="database-management-modal-content">
                  <div className="database-management-delete-header">
                    <div className="database-management-delete-all-icon-container">
                      <ExclamationTriangleIcon className="database-management-delete-all-icon-svg" />
                    </div>
                    <div>
                      <h3 className="database-management-delete-title">
                        Удалить все {selectedCategory.name.toLowerCase()}?
                      </h3>
                      <p className="database-management-delete-subtitle">
                        Будет удалено: {totalItems} записей
                      </p>
                    </div>
                  </div>

                  <div className="database-management-delete-all-warning">
                    <p className="database-management-delete-all-warning-title">
                      ⚠️ ВНИМАНИЕ!
                    </p>
                    <p className="database-management-delete-all-warning-description">
                      Все {selectedCategory.name.toLowerCase()} будут удалены безвозвратно.
                      Рекомендуем сначала скачать резервную копию!
                    </p>
                  </div>

                  <div className="database-management-modal-actions">
                    <Button
                        variant="outline"
                        className="database-management-modal-cancel"
                        onClick={() => setDeleteAll(false)}
                        disabled={deleting}
                    >
                      Отмена
                    </Button>
                    <Button
                        className="database-management-modal-confirm"
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