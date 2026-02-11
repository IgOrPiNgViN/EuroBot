import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import '../styles/components/Header.css'

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
  const { isAuthenticated, isAdmin, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
      <header className="header">
        <nav className="header-nav" aria-label="Main">
          <div className="header-top">
            <div className="header-top-container">
              <Link to="/" className="header-logo">
                <div className="logo-block">
                  <img
                      src='/images/admin-logo.png'
                      className='logo'
                      alt='logo'
                  />
                </div>
              </Link>

              <div className='text-block'>
                <div className='left-text'>
                  МЕЖДУНАРОДНЫЕ МОЛОДЁЖНЫЕ
                  <br />
                  РОБОТОТЕХНИЧЕСКИЕ
                  <br />
                  СОРЕВНОВАНИЯ
                </div>

                <div className='right-text'>
                  НАЦИОНАЛЬНЫЙ ОРГАНИЗАЦИОННЫЙ
                  <br />
                  КОМИТЕТ (НОК) ЕВРОБОТ РОССИЯ
                  <br />
                  info@eurobot-russia.org
                  <br />
                  +7 (906) 712‑7744
                </div>

                <div className='vk-icon'>
                  <a
                      href="https://vk.com/eurobotrussia"
                      target="_blank"
                      rel="noopener noreferrer"
                  >
                    <img src='/images/vk-logo.png' alt='VK' />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="header-bottom">
            <div className="header-bottom-container">
              <div className="header-desktop-nav">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            `header-nav-link ${isActive ? 'header-nav-link-active' : 'header-nav-link-inactive'}`
                        }
                    >
                      {item.name}
                    </NavLink>
                ))}
              </div>

              <button
                  type="button"
                  className="header-mobile-menu-button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                    <XMarkIcon className="header-menu-icon" />
                ) : (
                    <Bars3Icon className="header-menu-icon" />
                )}
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {mobileMenuOpen && (
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="header-mobile-menu"
              >
                <div className="header-mobile-content">
                  {navigation.map((item) => (
                      <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                              `header-mobile-link ${isActive ? 'header-mobile-link-active' : 'header-mobile-link-inactive'}`
                          }
                      >
                        {item.name}
                      </NavLink>
                  ))}

                  <div className="header-mobile-auth">
                    <Link
                        to="/registration"
                        onClick={() => setMobileMenuOpen(false)}
                        className="header-mobile-registration"
                    >
                      Регистрация команды
                    </Link>

                    {isAuthenticated ? (
                        <>
                          {isAdmin && (
                              <Link
                                  to="/admin"
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="header-mobile-admin-link"
                              >
                                Админ-панель
                              </Link>
                          )}
                          <button
                              onClick={() => {
                                handleLogout()
                                setMobileMenuOpen(false)
                              }}
                              className="header-mobile-logout"
                          >
                            Выйти
                          </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="header-mobile-login"
                        >
                          Войти
                        </Link>
                    )}
                  </div>
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </header>
  )
}