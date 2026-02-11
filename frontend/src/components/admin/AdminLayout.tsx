import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
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
  ClipboardDocumentListIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import '../../styles/components/admin/AdminLayout.css'

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
  { name: 'Архив', href: '/admin/archive', icon: ArchiveBoxIcon },
  { name: 'Поля регистрации', href: '/admin/registration-fields', icon: ClipboardDocumentListIcon },
  { name: 'Сообщения', href: '/admin/messages', icon: EnvelopeIcon },
  { name: 'Рассылки', href: '/admin/mailings', icon: PaperAirplaneIcon },
  { name: 'Настройки', href: '/admin/settings', icon: Cog6ToothIcon },
  { name: 'Администраторы', href: '/admin/admins', icon: UsersIcon, superAdminOnly: true },
  { name: 'База данных', href: '/admin/database', icon: CircleStackIcon, superAdminOnly: true },
]

// Заголовок для всех страниц
const DEFAULT_TITLE = 'Админ-панель | EUROBOT'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
      <div className="admin-layout">
        {/* Настройка мета-тегов и заголовка */}
        <Helmet>
          <title>{DEFAULT_TITLE}</title>
          <meta name="description" content="Административная панель EUROBOT" />
          <meta property="og:title" content={DEFAULT_TITLE} />
          <meta property="og:site_name" content="EUROBOT" />
          <meta property="og:type" content="website" />

          {/* Иконки */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        </Helmet>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
              <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="admin-layout-mobile-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
                <motion.aside
                    initial={{ x: -280 }}
                    animate={{ x: 0 }}
                    exit={{ x: -280 }}
                    className="admin-layout-mobile-sidebar"
                >
                  <div className="admin-layout-mobile-header">
                    <span className="admin-layout-mobile-title">Админ-панель</span>
                    <button onClick={() => setSidebarOpen(false)} className="admin-layout-mobile-close">
                      <XMarkIcon className="admin-layout-icon" />
                    </button>
                  </div>
                  <nav className="admin-layout-mobile-nav">
                    {navigation
                        .filter(item => !item.superAdminOnly || user?.role === 'super_admin')
                        .map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                end={item.href === '/admin'}
                                className={({ isActive }) =>
                                    `admin-layout-nav-link ${isActive ? 'admin-layout-nav-link-active' : 'admin-layout-nav-link-inactive'}`
                                }
                                onClick={() => setSidebarOpen(false)}
                            >
                              <item.icon className="admin-layout-nav-icon" />
                              <span>{item.name}</span>
                            </NavLink>
                        ))}
                  </nav>
                  {/* Добавлен футер для мобильного меню */}
                  <div className="admin-layout-mobile-footer">
                    <Link
                        to="/"
                        className="admin-layout-footer-link"
                        onClick={() => setSidebarOpen(false)}
                    >
                      <ChevronLeftIcon className="admin-layout-nav-icon" />
                      <span>На сайт</span>
                    </Link>
                    <button
                        onClick={() => {
                          setSidebarOpen(false)
                          handleLogout()
                        }}
                        className="admin-layout-logout-button"
                    >
                      <ArrowLeftOnRectangleIcon className="admin-layout-nav-icon" />
                      <span>Выйти</span>
                    </button>
                  </div>
                </motion.aside>
              </>
          )}
        </AnimatePresence>

        {/* Desktop sidebar */}
        <aside className="admin-layout-desktop-sidebar">
          <div className="admin-layout-desktop-header">
            <Link to="/admin" className="admin-layout-desktop-logo">
              <img
                  src="/images/admin-logo.png"
                  alt="Eurobot Logo"
                  className="admin-layout-logo-image"
              />
              <span className="admin-layout-desktop-title">Админ-панель</span>
            </Link>
          </div>

          <nav className="admin-layout-desktop-nav">
            {navigation
                .filter(item => !item.superAdminOnly || user?.role === 'super_admin')
                .map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        end={item.href === '/admin'}
                        className={({ isActive }) =>
                            `admin-layout-nav-link ${isActive ? 'admin-layout-nav-link-active' : 'admin-layout-nav-link-inactive'}`
                        }
                    >
                      <item.icon className="admin-layout-nav-icon" />
                      <span>{item.name}</span>
                    </NavLink>
                ))}
          </nav>

          <div className="admin-layout-desktop-footer">
            <Link
                to="/"
                className="admin-layout-footer-link"
            >
              <ChevronLeftIcon className="admin-layout-nav-icon" />
              <span>На сайт</span>
            </Link>
            <button
                onClick={handleLogout}
                className="admin-layout-logout-button"
            >
              <ArrowLeftOnRectangleIcon className="admin-layout-nav-icon" />
              <span>Выйти</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="admin-layout-main-container">
          {/* Top bar */}
          <header className="admin-layout-topbar">
            <div className="admin-layout-topbar-content">
              <button
                  onClick={() => setSidebarOpen(true)}
                  className="admin-layout-mobile-menu-button"
              >
                <Bars3Icon className="admin-layout-icon" />
              </button>

              <div className="admin-layout-topbar-spacer" />

              <div className="admin-layout-user-info">
              <span className="admin-layout-user-name">
                {user?.full_name || user?.email}
              </span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="admin-layout-content">
            <Outlet />
          </main>
        </div>
      </div>
  )
}