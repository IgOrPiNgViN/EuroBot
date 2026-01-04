import { Link } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon 
} from '@heroicons/react/24/outline'

export default function Footer() {
  const { settings } = useSettingsStore()
  
  const contactEmails = settings.contact_emails as Record<string, string> | undefined

  return (
    <footer className="bg-eurobot-navy text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-eurobot-gold rounded-full flex items-center justify-center">
                <span className="text-eurobot-navy font-bold text-xl">E</span>
              </div>
              <span className="font-heading font-bold text-xl">ЕВРОБОТ</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Международные соревнования по робототехнике для молодёжи. 
              Развиваем инженерное мышление с 1998 года.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/competitions" className="text-gray-400 hover:text-eurobot-gold transition-colors text-sm">
                  Соревнования
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-gray-400 hover:text-eurobot-gold transition-colors text-sm">
                  Новости
                </Link>
              </li>
              <li>
                <Link to="/archive" className="text-gray-400 hover:text-eurobot-gold transition-colors text-sm">
                  Архив
                </Link>
              </li>
              <li>
                <Link to="/registration" className="text-gray-400 hover:text-eurobot-gold transition-colors text-sm">
                  Регистрация
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-eurobot-gold transition-colors text-sm">
                  О Евробот
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact emails */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Email для связи</h3>
            <ul className="space-y-2">
              {contactEmails && (
                <>
                  <li className="flex items-center space-x-2 text-sm">
                    <EnvelopeIcon className="w-4 h-4 text-eurobot-gold" />
                    <div>
                      <span className="text-gray-500">Технические вопросы:</span>
                      <a href={`mailto:${contactEmails.technical}`} className="block text-gray-400 hover:text-eurobot-gold">
                        {contactEmails.technical}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-center space-x-2 text-sm">
                    <EnvelopeIcon className="w-4 h-4 text-eurobot-gold" />
                    <div>
                      <span className="text-gray-500">Регистрация:</span>
                      <a href={`mailto:${contactEmails.registration}`} className="block text-gray-400 hover:text-eurobot-gold">
                        {contactEmails.registration}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-center space-x-2 text-sm">
                    <EnvelopeIcon className="w-4 h-4 text-eurobot-gold" />
                    <div>
                      <span className="text-gray-500">Партнерство:</span>
                      <a href={`mailto:${contactEmails.sponsorship}`} className="block text-gray-400 hover:text-eurobot-gold">
                        {contactEmails.sponsorship}
                      </a>
                    </div>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Контакты</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-sm">
                <MapPinIcon className="w-5 h-5 text-eurobot-gold flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">
                  Москва, Россия
                </span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <PhoneIcon className="w-5 h-5 text-eurobot-gold flex-shrink-0" />
                <a href="tel:+74951234567" className="text-gray-400 hover:text-eurobot-gold">
                  +7 (495) 123-45-67
                </a>
              </li>
            </ul>
            
            {/* Social links */}
            <div className="flex space-x-4 mt-6">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-eurobot-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-eurobot-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-eurobot-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Евробот Россия. Все права защищены.
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-gray-500 hover:text-gray-400 text-sm">
                Политика конфиденциальности
              </Link>
              <Link to="/terms" className="text-gray-500 hover:text-gray-400 text-sm">
                Условия использования
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}



