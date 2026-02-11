import { Link } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import '../styles/components/Footer.css'

export default function Footer() {
  const { settings } = useSettingsStore()

  const contactEmails = settings.contact_emails as Record<string, string> | undefined

  return (
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-top-title">
              КОНТАКТЫ:
            </div>
            <div className="footer-top-text">
              Председатель орг. комитета: 8 (906) 712 77-44
            </div>
            <div className="footer-top-text">
              msalmina@yandex.ru
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-container">
              <div className="footer-bottom-title">
                EUROBOT RUSSIA
              </div>
              <div className="footer-bottom-text">
                © НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ НАЦИОНАЛЬНЫЙ ОРГАНИЗАЦИОННЫЙ
              </div>
              <div className="footer-bottom-text">
                КОМИТЕТ МЕЖДУНАРОДНЫХ РОБОТОТЕХНИЧЕСКИХ СОРЕВНОВАНИЙ "ЕВРОБОТ"
              </div>

              <div className="footer-vk-icon">
                <a
                    href="https://vk.com/eurobotrussia"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                  <img src="/images/vk-logo.png" alt="VK" />
                </a>
              </div>

            </div>
          </div>

          <div className="footer-admin">
            <div className="footer-admin-container">
              <Link
                  to="/admin"
                  className="admin-panel-button"
              >
                Админ-панель
              </Link>
            </div>
          </div>
        </div>
      </footer>
  )
}