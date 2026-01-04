import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { 
  CalendarIcon, 
  MapPinIcon, 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
import { seasonsApi } from '../api/seasons'
import { Season } from '../types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'

export default function CompetitionsPage() {
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSeason = async () => {
      try {
        const season = await seasonsApi.getCurrent()
        setCurrentSeason(season)
      } catch (error) {
        console.error('Failed to fetch season:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSeason()
  }, [])

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!currentSeason) {
    return (
      <>
        <Helmet>
          <title>Соревнования — Евробот Россия</title>
        </Helmet>
        
        <div className="bg-eurobot-navy py-16">
          <div className="container-custom">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">
              Соревнования
            </h1>
          </div>
        </div>

        <div className="container-custom py-20 text-center">
          <p className="text-gray-500 text-lg">
            Информация о текущем сезоне будет доступна позже
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>{currentSeason.name} — Соревнования Евробот Россия</title>
        <meta name="description" content={`Информация о соревнованиях ${currentSeason.name}. Правила, даты, регистрация.`} />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-eurobot-navy to-eurobot-blue py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="inline-block bg-eurobot-gold text-eurobot-navy px-4 py-1 rounded-full text-sm font-semibold mb-4">
              Сезон {currentSeason.year}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              {currentSeason.name}
            </h1>
            {currentSeason.theme && (
              <p className="text-xl text-gray-300">
                Тема сезона: <span className="text-eurobot-gold">{currentSeason.theme}</span>
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Info cards */}
      <section className="py-12 -mt-8">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Registration status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                currentSeason.registration_open ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <ClipboardDocumentCheckIcon className={`w-6 h-6 ${
                  currentSeason.registration_open ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <h3 className="font-semibold mb-2">Регистрация</h3>
              <p className={`text-sm ${currentSeason.registration_open ? 'text-green-600' : 'text-gray-500'}`}>
                {currentSeason.registration_open ? 'Открыта' : 'Закрыта'}
              </p>
              {currentSeason.registration_open && currentSeason.show_registration_deadline && currentSeason.registration_end && (
                <p className="text-xs text-gray-400 mt-1">
                  до {format(new Date(currentSeason.registration_end), 'd MMMM yyyy', { locale: ru })}
                </p>
              )}
            </motion.div>

            {/* Dates */}
            {currentSeason.show_dates && currentSeason.competition_date_start && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6"
              >
                <div className="w-12 h-12 bg-eurobot-gold/10 rounded-xl flex items-center justify-center mb-4">
                  <CalendarIcon className="w-6 h-6 text-eurobot-gold" />
                </div>
                <h3 className="font-semibold mb-2">Даты проведения</h3>
                <p className="text-sm text-gray-600">
                  {format(new Date(currentSeason.competition_date_start), 'd MMMM', { locale: ru })}
                  {currentSeason.competition_date_end && (
                    <> — {format(new Date(currentSeason.competition_date_end), 'd MMMM yyyy', { locale: ru })}</>
                  )}
                </p>
              </motion.div>
            )}

            {/* Location */}
            {currentSeason.show_location && currentSeason.location && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
              >
                <div className="w-12 h-12 bg-eurobot-blue/10 rounded-xl flex items-center justify-center mb-4">
                  <MapPinIcon className="w-6 h-6 text-eurobot-blue" />
                </div>
                <h3 className="font-semibold mb-2">Место проведения</h3>
                <p className="text-sm text-gray-600">{currentSeason.location}</p>
              </motion.div>
            )}

            {/* Format */}
            {currentSeason.show_format && currentSeason.format && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card p-6"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Формат</h3>
                <p className="text-sm text-gray-600">{currentSeason.format}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      {currentSeason.registration_open && (
        <section className="py-12 bg-gray-50">
          <div className="container-custom text-center">
            <h2 className="text-2xl font-heading font-bold mb-4">
              Готовы к участию?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Зарегистрируйте свою команду и станьте частью международного сообщества робототехников
            </p>
            <Link to="/registration">
              <Button size="lg">Зарегистрировать команду</Button>
            </Link>
          </div>
        </section>
      )}

      {/* Competitions and files */}
      {currentSeason.competitions.length > 0 && (
        <section className="py-12">
          <div className="container-custom">
            <h2 className="section-title">Материалы и документы</h2>
            
            <div className="space-y-6">
              {currentSeason.competitions.map((competition, index) => (
                <motion.div
                  key={competition.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card p-6"
                >
                  <h3 className="font-heading font-semibold text-xl mb-4">{competition.name}</h3>
                  
                  {competition.description && (
                    <p className="text-gray-600 mb-4">{competition.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Rules */}
                    {competition.rules_file && (
                      <a
                        href={competition.rules_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <DocumentTextIcon className="w-8 h-8 text-eurobot-blue mr-3" />
                        <div>
                          <p className="font-medium">Правила</p>
                          <p className="text-xs text-gray-500">PDF документ</p>
                        </div>
                      </a>
                    )}

                    {/* Field files */}
                    {competition.field_files && competition.field_files.length > 0 && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <ArrowDownTrayIcon className="w-6 h-6 text-green-600 mr-2" />
                          <p className="font-medium">Файлы поля</p>
                        </div>
                        <div className="space-y-1">
                          {competition.field_files.map((file, i) => (
                            <a
                              key={i}
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-eurobot-blue hover:underline"
                            >
                              Скачать файл {i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vinyl files */}
                    {competition.vinyl_files && competition.vinyl_files.length > 0 && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <ArrowDownTrayIcon className="w-6 h-6 text-purple-600 mr-2" />
                          <p className="font-medium">Винил для печати</p>
                        </div>
                        <div className="space-y-1">
                          {competition.vinyl_files.map((file, i) => (
                            <a
                              key={i}
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-eurobot-blue hover:underline"
                            >
                              Скачать файл {i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3D files */}
                    {competition.drawings_3d && competition.drawings_3d.length > 0 && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <ArrowDownTrayIcon className="w-6 h-6 text-orange-600 mr-2" />
                          <p className="font-medium">3D модели</p>
                        </div>
                        <div className="space-y-1">
                          {competition.drawings_3d.map((file, i) => (
                            <a
                              key={i}
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-eurobot-blue hover:underline"
                            >
                              Скачать модель {i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}



