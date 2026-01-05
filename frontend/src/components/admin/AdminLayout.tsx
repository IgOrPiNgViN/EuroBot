import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  NewspaperIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  UsersIcon,
  CircleStackIcon,
  PaperAirplaneIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  name: string
  href: string
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>
  superAdminOnly?: boolean
}

const navigation: NavItem[] = [
  { name: 'Главная', href: '/admin', icon: HomeIcon },
  { name: 'Новости', href: '/admin/news', icon: NewspaperIcon },
  { name: 'Команды', href: '/admin/teams', icon: UserGroupIcon },
  { name: 'Партнеры', href: '/admin/partners', icon: BuildingOfficeIcon },
  { name: 'Сезоны', href: '/admin/seasons', icon: CalendarIcon },
  { name: 'Поля регистрации', href: '/admin/registration-fields', icon: ClipboardDocumentListIcon },
  { name: 'Сообщения', href: '/admin/messages', icon: EnvelopeIcon },
  { name: 'Рассылки', href: '/admin/mailings', icon: PaperAirplaneIcon },
  { name: 'Настройки', href: '/admin/settings', icon: Cog6ToothIcon },
  { name: 'Администраторы', href: '/admin/admins', icon: UsersIcon, superAdminOnly: true },
  { name: 'База данных', href: '/admin/database', icon: CircleStackIcon, superAdminOnly: true },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-72 bg-eurobot-navy z-50 lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="text-white font-heading font-bold text-xl">Админ-панель</span>
                <button onClick={() => setSidebarOpen(false)} className="text-white">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {navigation
                  .filter(item => !item.superAdminOnly || user?.role === 'super_admin')
                  .map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/admin'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-eurobot-gold text-eurobot-navy'
                          : 'text-gray-300 hover:bg-white/10'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col bg-eurobot-navy">
        <div className="flex items-center h-16 px-6 border-b border-white/10">
          <Link to="/admin" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-eurobot-gold rounded-full flex items-center justify-center">
              <span className="text-eurobot-navy font-bold">E</span>
            </div>
            <span className="text-white font-heading font-bold">Админ-панель</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation
            .filter(item => !item.superAdminOnly || user?.role === 'super_admin')
            .map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/admin'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-eurobot-gold text-eurobot-navy'
                    : 'text-gray-300 hover:bg-white/10'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>На сайт</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.full_name || user?.email}
              </span>
              <div className="w-8 h-8 bg-eurobot-blue rounded-full flex items-center justify-center text-white font-medium">
                {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}



