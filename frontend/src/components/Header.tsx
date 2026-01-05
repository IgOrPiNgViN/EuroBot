import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'

const navigation = [
  { name: 'Главная', href: '/' },
  { name: 'Соревнования', href: '/competitions' },
  { name: 'Новости', href: '/news' },
  { name: 'Архив', href: '/archive' },
  { name: 'О Евробот', href: '/about' },
  { name: 'Контакты', href: '/contacts' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-eurobot-navy sticky top-0 z-50 shadow-lg">
      <nav className="container-custom" aria-label="Main">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-eurobot-gold rounded-full flex items-center justify-center">
              <span className="text-eurobot-navy font-bold text-xl">E</span>
            </div>
            <span className="text-white font-heading font-bold text-xl hidden sm:block">
              ЕВРОБОТ
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-eurobot-gold text-eurobot-navy'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <Link
              to="/registration"
              className="btn-primary text-sm"
            >
              Регистрация команды
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-white hover:text-eurobot-gold transition-colors">
                  <UserCircleIcon className="w-6 h-6" />
                  <span className="text-sm">{user?.full_name || user?.email}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Админ-панель
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-gray-300 hover:text-white text-sm font-medium"
              >
                Войти
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-lg text-base font-medium ${
                        isActive
                          ? 'bg-eurobot-gold text-eurobot-navy'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
                
                <div className="pt-4 border-t border-white/20">
                  <Link
                    to="/registration"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full btn-primary text-center"
                  >
                    Регистрация команды
                  </Link>
                  
                  {isAuthenticated ? (
                    <>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block mt-2 px-4 py-3 text-gray-300 hover:text-white"
                        >
                          Админ-панель
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                        className="block w-full mt-2 px-4 py-3 text-left text-gray-300 hover:text-white"
                      >
                        Выйти
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block mt-2 px-4 py-3 text-gray-300 hover:text-white"
                    >
                      Войти
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}





