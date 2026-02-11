import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  UserGroupIcon,
  NewspaperIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { adminApi } from '../../api/settings'
import { DashboardStats } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getDashboard()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-500">Ошибка загрузки данных</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">
        Панель управления
      </h1>

      {/* Current season info */}
      {stats.current_season && (
        <div className="mb-8 p-6 bg-eurobot-navy text-white rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Текущий сезон</p>
              <h2 className="text-2xl font-heading font-bold">{stats.current_season.name}</h2>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              stats.current_season.registration_open
                ? 'bg-green-500 text-white'
                : 'bg-gray-500 text-white'
            }`}>
              {stats.current_season.registration_open ? 'Регистрация открыта' : 'Регистрация закрыта'}
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Команды</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totals.teams}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          {stats.pending.teams > 0 && (
            <p className="text-sm text-orange-500 mt-2 flex items-center">
              <ExclamationCircleIcon className="w-4 h-4 mr-1" />
              {stats.pending.teams} ожидают подтверждения
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Новости</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totals.news}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <NewspaperIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Партнеры</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totals.partners}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Сообщения</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totals.messages}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <EnvelopeIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          {stats.pending.messages > 0 && (
            <p className="text-sm text-orange-500 mt-2 flex items-center">
              <ExclamationCircleIcon className="w-4 h-4 mr-1" />
              {stats.pending.messages} непрочитанных
            </p>
          )}
        </motion.div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">Быстрые действия</h3>
          <div className="space-y-3">
            <Link
              to="/admin/news"
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Добавить новость</span>
              <p className="text-sm text-gray-500">Создать новую публикацию</p>
            </Link>
            <Link
              to="/admin/teams"
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Управление командами</span>
              <p className="text-sm text-gray-500">Просмотр и модерация заявок</p>
            </Link>
            <Link
              to="/admin/seasons"
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Настройки сезона</span>
              <p className="text-sm text-gray-500">Управление текущим сезоном</p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold text-lg mb-4 flex items-center">
            <UserGroupIcon className="w-10 h-10 mr-2 text-blue-500" />
            Статистика по командам
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Новых регистраций за неделю</span>
              <span className="text-2xl font-bold text-green-600">+{stats.recent.teams_week}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Всего команд</span>
              <span className="text-2xl font-bold text-gray-900">{stats.totals.teams}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}





