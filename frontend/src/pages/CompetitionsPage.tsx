import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  CalendarIcon,
  MapPinIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { seasonsApi } from '../api/seasons'
import { Season, FormatStructure } from '../types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'
import '../styles/pages/CompetitionsPage.css'

export default function CompetitionsPage() {
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [formatData, setFormatData] = useState<FormatStructure | null>(null)
  const [loading, setLoading] = useState(true)

  const parseFormat = (formatString: string): FormatStructure => {
    try {
      return JSON.parse(formatString);
    } catch (error) {
      console.error('Failed to parse format JSON:', error);
      return {
        logo_url: '',
        title_url: '',
        icon_url: '',
        tasks: [],
        documents: []
      };
    }
  };

    const getFormatText = (formatString: string): string => {
        try {
            const parsed = JSON.parse(formatString);
            // Если это JSON с нашими полями, но есть текстовое поле description
            if (parsed.description) {
                return parsed.description;
            }
            return '';
        } catch (error) {
            return formatString;
        }
    };

  useEffect(() => {
    const fetchSeason = async () => {
      try {
        const season = await seasonsApi.getCurrent()
        setCurrentSeason(season)
        if (season.format) {
          const parsedFormat = parseFormat(season.format)
          setFormatData(parsedFormat)
          console.log('Parsed format data:', parsedFormat)
        }
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

                <div style={{
                    backgroundColor: '#0f3d63',
                    height: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <div style={{
                        maxWidth: '1200px',
                        width: '100%',
                        padding: '0 1rem',
                        textAlign: 'center'
                    }}>
                        <h1 style={{
                            fontSize: '3rem',
                            lineHeight: '1',
                            fontWeight: 'bold',
                            fontFamily: 'var(--font-heading)',
                            color: '#F2F6FF',
                            marginBottom: '1rem'
                        }}>
                            Соревнования
                        </h1>
                    </div>
                </div>

                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '5rem 1rem',
                    textAlign: 'center'
                }}>
                    <p style={{
                        color: '#4b5563',
                        fontSize: '1.125rem',
                        lineHeight: '1.75rem'
                    }}>
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

        <section className="competitions-images-section">
          <div className="container-custom">
            <div className="competitions-images-container">
              {formatData?.logo_url && (
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="competition-logo-container"
                  >
                    <img
                        src={formatData.logo_url}
                        alt={`Логотип ${currentSeason.name}`}
                        className="competition-logo"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                    />
                  </motion.div>
              )}

              {formatData?.title_url && (
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="competition-title-container"
                  >
                    <img
                        src={formatData.title_url}
                        alt={currentSeason.name}
                        className="competition-title-image"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                    />
                  </motion.div>
              )}
            </div>

            {currentSeason.registration_open && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="competitions-registration-button-container"
                >
                  <Link to="/registration" className="competitions-registration-button">
                    Зарегистрировать команду
                  </Link>
                </motion.div>
            )}
          </div>
        </section>

        {(currentSeason.theme || formatData) && (
            <section className="competitions-theme-section">
              <div className="container-custom">
                <div className="competitions-theme-content">
                  {currentSeason.theme && (
                      <motion.h2
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          className="competitions-theme-title"
                      >
                        ТЕМА ПРЕДСТОЯЩИХ СОРЕВНОВАНИЙ:
                      </motion.h2>
                  )}

                  {currentSeason.format && (
                      <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 }}
                          className="competitions-format-text"
                      >
                          {currentSeason.theme}
                      </motion.div>
                  )}
                </div>
              </div>
            </section>
        )}

        {formatData?.tasks && formatData.tasks.length > 0 && (
            <section className="competitions-tasks-section">
              <div className="container-custom">
                <div className="competitions-tasks-content">
                  <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="competitions-tasks-title"
                  >
                    Задания сезона
                  </motion.h3>

                  <motion.ul
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                      className="competitions-tasks-list"
                  >
                    {formatData.tasks.map((task, index) => (
                        <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="competitions-task-item"
                        >
                          {formatData.icon_url ? (
                              <img
                                  src={formatData.icon_url}
                                  alt=""
                                  className="competitions-task-icon"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                              />
                          ) : (
                              <div className="competitions-task-bullet" />
                          )}
                          <span className="competitions-task-text">{task}</span>
                        </motion.li>
                    ))}
                  </motion.ul>
                </div>
              </div>
            </section>
        )}

        {/* Блок 4: Документы с фоновым изображением */}
        {formatData?.documents && formatData.documents.length > 0 && (
            <section className="competitions-documents-section">
              <div className="container-custom">
                <div className="competitions-documents-content">
                  <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="competitions-documents-title"
                  >
                    Документы сезона
                  </motion.h3>

                  <div className="competitions-documents-grid">
                    {formatData.documents.map((doc, index) => (
                        <motion.a
                            key={index}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="competitions-document-card"
                        >
                          <DocumentIcon className="competitions-document-icon" />
                          <div className="competitions-document-info">
                            <h4 className="competitions-document-name">{doc.name}</h4>
                            <span className="competitions-document-link">Скачать документ</span>
                          </div>
                        </motion.a>
                    ))}
                  </div>
                </div>
              </div>
            </section>
        )}

        <section className="competitions-info-section">
          <div className="container-custom">
            <div className="competitions-info-grid">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="competitions-info-card"
                >
                    <div className={`competitions-info-icon ${
                        currentSeason.registration_open ? 'competitions-info-icon-success' : 'competitions-info-icon-default'
                    }`}>
                        <ClipboardDocumentCheckIcon />
                    </div>
                    <h3 className="competitions-info-title">Регистрация</h3>
                    <p className={`competitions-info-text ${
                        currentSeason.registration_open ? 'competitions-info-text-success' : 'competitions-info-text-muted'
                    }`}>
                        {currentSeason.registration_open ? 'Открыта' : 'Закрыта'}
                    </p>

                    {(currentSeason.registration_start || currentSeason.registration_end) && (
                        <div className="competitions-registration-dates">
                            {currentSeason.registration_start && (
                                <p className="competitions-info-date">
                                    <span className="competitions-date-label">Начало:</span>{' '}
                                    {format(new Date(currentSeason.registration_start), 'd MMMM yyyy', { locale: ru })}
                                </p>
                            )}
                            {currentSeason.registration_end && (
                                <p className="competitions-info-date">
          <span className="competitions-date-label">
            {currentSeason.registration_open ? 'До:' : 'Закрыта:'}
          </span>{' '}
                                    {format(new Date(currentSeason.registration_end), 'd MMMM yyyy', { locale: ru })}
                                </p>
                            )}
                        </div>
                    )}
                </motion.div>

              {currentSeason.show_dates && currentSeason.competition_date_start && (
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                      className="competitions-info-card"
                  >
                    <div className="competitions-info-icon competitions-info-icon-gold">
                      <CalendarIcon />
                    </div>
                    <h3 className="competitions-info-title">Даты проведения</h3>
                    <p className="competitions-info-text">
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
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="competitions-info-card"
                  >
                    <div className="competitions-info-icon competitions-info-icon-blue">
                      <MapPinIcon />
                    </div>
                    <h3 className="competitions-info-title">Место проведения</h3>
                    <p className="competitions-info-text">{currentSeason.location}</p>
                  </motion.div>
              )}
            </div>
          </div>
        </section>

        {currentSeason.competitions.length > 0 && (
            <section className="competitions-files-section">
              <div className="container-custom">
                <h2 className="section-title">Материалы и документы</h2>

                <div className="competitions-files-list">
                  {currentSeason.competitions.map((competition, index) => (
                      <motion.div
                          key={competition.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="competition-files-card"
                      >
                        <h3 className="competition-files-title">{competition.name}</h3>

                        {competition.description && (
                            <p className="competition-files-description">{competition.description}</p>
                        )}

                        <div className="competition-files-grid">
                          {competition.rules_file && (
                              <a
                                  href={competition.rules_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="competition-file-item"
                              >
                                <DocumentTextIcon className="competition-file-icon competition-file-icon-blue" />
                                <div className="competition-file-info">
                                  <p className="competition-file-name">Правила</p>
                                  <p className="competition-file-type">PDF документ</p>
                                </div>
                              </a>
                          )}

                          {competition.field_files && competition.field_files.length > 0 && (
                              <div className="competition-file-group">
                                <div className="competition-file-group-header">
                                  <ArrowDownTrayIcon className="competition-file-group-icon competition-file-icon-green" />
                                  <p className="competition-file-group-title">Файлы поля</p>
                                </div>
                                <div className="competition-file-group-list">
                                  {competition.field_files.map((file, i) => (
                                      <a
                                          key={i}
                                          href={file}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="competition-file-link"
                                      >
                                        Скачать файл {i + 1}
                                      </a>
                                  ))}
                                </div>
                              </div>
                          )}

                          {competition.vinyl_files && competition.vinyl_files.length > 0 && (
                              <div className="competition-file-group">
                                <div className="competition-file-group-header">
                                  <ArrowDownTrayIcon className="competition-file-group-icon competition-file-icon-purple" />
                                  <p className="competition-file-group-title">Винил для печати</p>
                                </div>
                                <div className="competition-file-group-list">
                                  {competition.vinyl_files.map((file, i) => (
                                      <a
                                          key={i}
                                          href={file}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="competition-file-link"
                                      >
                                        Скачать файл {i + 1}
                                      </a>
                                  ))}
                                </div>
                              </div>
                          )}

                          {competition.drawings_3d && competition.drawings_3d.length > 0 && (
                              <div className="competition-file-group">
                                <div className="competition-file-group-header">
                                  <ArrowDownTrayIcon className="competition-file-group-icon competition-file-icon-orange" />
                                  <p className="competition-file-group-title">3D модели</p>
                                </div>
                                <div className="competition-file-group-list">
                                  {competition.drawings_3d.map((file, i) => (
                                      <a
                                          key={i}
                                          href={file}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="competition-file-link"
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