import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayIcon, PhotoIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { archiveApi } from '../api/archive'
import {ArchiveSeason, ArchiveMedia, ArchiveSeasonDescriptionData} from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ReactPlayer from 'react-player'
import '../styles/pages/ArchivePage.css'

export default function ArchivePage() {
  const [seasons, setSeasons] = useState<ArchiveSeason[]>([])
  const [selectedSeason, setSelectedSeason] = useState<ArchiveSeason | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<ArchiveMedia | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const data = await archiveApi.getSeasons()
        // Обрабатываем description каждого сезона
        const processedSeasons = data.map(season => ({
          ...season,
          parsedDescription: decodeDescriptionData(season.description || '')
        }))
        setSeasons(processedSeasons)
        if (processedSeasons.length > 0) {
          setSelectedSeason(processedSeasons[0])
        }
      } catch (error) {
        console.error('Failed to fetch archive:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSeasons()
  }, [])

  function encodeDescriptionData(data: ArchiveSeasonDescriptionData): string {
    const { mainDescription = '', ...extraData } = data;

    if (Object.keys(extraData).length > 0) {
      const encodedData = JSON.stringify(extraData);
      return `{MAIN}${mainDescription}{JSON}${encodedData}`;
    }

    return mainDescription;
  }

  function decodeDescriptionData(description: string): ArchiveSeasonDescriptionData {
    if (!description) {
      return { mainDescription: '' };
    }

    const jsonMatch = description.match(/\{JSON\}(.*)$/);
    const mainMatch = description.match(/^\{MAIN\}(.*?)(?=\{JSON\}|$)/);

    if (jsonMatch && mainMatch) {
      try {
        const mainDescription = mainMatch[1];
        const jsonData = JSON.parse(jsonMatch[1]);
        return {
          mainDescription,
          ...jsonData
        };
      } catch (error) {
        console.error('Failed to parse description JSON:', error);
        return { mainDescription: description };
      }
    }

    return { mainDescription: description };
  }

  // Функция для получения логотипа и названия из описания
  const getSeasonLogoAndTitle = (season: ArchiveSeason) => {
    if (!season.parsedDescription) {
      return { logoUrl: '', titleImageUrl: '' };
    }

    return {
      logoUrl: season.parsedDescription.logoUrl || '',
      titleImageUrl: season.parsedDescription.titleImageUrl || ''
    };
  }

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  const photos = selectedSeason?.media.filter(m => m.media_type === 'photo') || []
  const videos = selectedSeason?.media.filter(m => m.media_type === 'video') || []
  const documents = selectedSeason?.media.filter(m => m.media_type === 'document') || []

  return (
      <>
        <Helmet>
          <title>Архив — Евробот Россия</title>
          <meta name="description" content="Архив прошлых сезонов соревнований Евробот: фото, видео и документы." />
        </Helmet>

        <div className="archive-hero">
          <div className="archive-container-custom">
            <h1 className="archive-hero-title">
              Архив сезонов
            </h1>
            <p className="archive-hero-subtitle">
              Материалы и результаты прошлых соревнований
            </p>
          </div>
        </div>

        <section className="archive-main">
          <div className="container-custom">
            {seasons.length === 0 ? (
                <div className="archive-empty">
                  Архив пока пуст
                </div>
            ) : (
                <div className="archive-container">
                  {/* Season Selector Sidebar */}
                  <aside className="archive-sidebar">
                    <h3 className="archive-sidebar-title">Выберите сезон</h3>
                    <div className="archive-season-list">
                      {seasons.map((season) => {
                        const { logoUrl } = getSeasonLogoAndTitle(season);
                        return (
                            <button
                                key={season.id}
                                onClick={() => setSelectedSeason(season)}
                                className={`archive-season-button ${
                                    selectedSeason?.id === season.id ? 'active' : ''
                                }`}
                            >
                              {logoUrl && (
                                  <img
                                      src={logoUrl}
                                      alt={season.name}
                                      className="archive-season-logo"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                  />
                              )}
                              <div className="archive-season-info">
                                <span className="archive-season-year">{season.year}</span>
                                <span className="archive-season-name">{season.name}</span>
                              </div>
                            </button>
                        );
                      })}
                    </div>
                  </aside>

                  {/* Content */}
                  <div className="archive-content">
                    {selectedSeason && (
                        <motion.div
                            key={selectedSeason.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                          <div className="archive-season-header">


                            {selectedSeason.cover_image && (
                                <div className="archive-cover-image">
                                  <img
                                      src={selectedSeason.cover_image}
                                      alt={selectedSeason.name}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                  />
                                </div>
                            )}

                            <div className="archive-season-branding">
                              {(() => {
                                const { logoUrl, titleImageUrl } = getSeasonLogoAndTitle(selectedSeason);
                                return (
                                    <>
                                      {logoUrl && (
                                          <div className="archive-season-logo-container">
                                            <img
                                                src={logoUrl}
                                                alt={`Логотип ${selectedSeason.name}`}
                                                className="archive-season-logo-large"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                          </div>
                                      )}
                                      {titleImageUrl && (
                                          <div className="archive-season-title-image-container">
                                            <img
                                                src={titleImageUrl}
                                                alt={selectedSeason.name}
                                                className="archive-season-title-image"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                          </div>
                                      )}
                                    </>
                                );
                              })()}
                            </div>

                            {/* Если нет изображения названия, показываем текстовое название */}
                            {(!selectedSeason.parsedDescription?.titleImageUrl) && (
                                <h2 className="archive-season-title">
                                  {selectedSeason.name}
                                </h2>
                            )}

                            {selectedSeason.theme && (
                                <p className="archive-season-theme">
                                  Тема: {selectedSeason.theme}
                                </p>
                            )}

                            {/* Основное описание из дешифрованных данных */}
                            {selectedSeason.parsedDescription?.mainDescription && (
                                <div className="archive-season-description">
                                  <h3 className="archive-description-title">О сезоне</h3>
                                  <p className="archive-description-text">
                                    {selectedSeason.parsedDescription.mainDescription}
                                  </p>
                                </div>
                            )}

                            {selectedSeason.teams_count && (
                                <p className="archive-season-teams">
                                  Участвовало команд: {selectedSeason.teams_count}
                                </p>
                            )}
                          </div>

                          {/* Results */}
                          {(selectedSeason.first_place || selectedSeason.second_place || selectedSeason.third_place) && (
                              <div className="archive-results">
                                <h3 className="archive-results-title">Итоги</h3>
                                <div className="archive-winners-list">
                                  {selectedSeason.first_place && (
                                      <div className="archive-winner-item">
                                        <span className="archive-winner-emoji">🥇</span>
                                        <span className="archive-winner-name">{selectedSeason.first_place}</span>
                                      </div>
                                  )}
                                  {selectedSeason.second_place && (
                                      <div className="archive-winner-item">
                                        <span className="archive-winner-emoji">🥈</span>
                                        <span className="archive-winner-name">{selectedSeason.second_place}</span>
                                      </div>
                                  )}
                                  {selectedSeason.third_place && (
                                      <div className="archive-winner-item">
                                        <span className="archive-winner-emoji">🥉</span>
                                        <span className="archive-winner-name">{selectedSeason.third_place}</span>
                                      </div>
                                  )}
                                  {selectedSeason.additional_info && (
                                      <p className="archive-additional-info">
                                        {selectedSeason.additional_info}
                                      </p>
                                  )}
                                </div>
                              </div>
                          )}

                          {/* Videos */}
                          {videos.length > 0 && (
                              <div className="archive-media-section">
                                <h3 className="archive-section-title archive-videos-title">
                                  <PlayIcon className="archive-section-icon" />
                                  Видео
                                </h3>
                                <div className="archive-videos-grid">
                                  {videos.map((video) => (
                                      <div
                                          key={video.id}
                                          onClick={() => setSelectedMedia(video)}
                                          className="archive-video-card"
                                      >
                                        <div className="archive-video-preview">
                                          {video.thumbnail ? (
                                              <img
                                                  src={video.thumbnail}
                                                  alt={video.title || 'Video'}
                                                  className="archive-video-thumbnail"
                                              />
                                          ) : (
                                              <div className="archive-video-placeholder">
                                                <PlayIcon className="archive-video-placeholder-icon" />
                                              </div>
                                          )}
                                          <div className="archive-video-overlay">
                                            <PlayIcon className="archive-video-overlay-icon" />
                                          </div>
                                        </div>
                                        {video.title && (
                                            <p className="archive-video-title">{video.title}</p>
                                        )}
                                      </div>
                                  ))}
                                </div>
                              </div>
                          )}

                          {/* Photos */}
                          {photos.length > 0 && (
                              <div className="archive-media-section">
                                <h3 className="archive-section-title archive-photos-title">
                                  <PhotoIcon className="archive-section-icon" />
                                  Фотографии
                                </h3>
                                <div className="archive-photos-grid">
                                  {photos.map((photo) => (
                                      <div
                                          key={photo.id}
                                          onClick={() => setSelectedMedia(photo)}
                                          className="archive-photo-card"
                                      >
                                        <img
                                            src={photo.thumbnail || photo.file_path}
                                            alt={photo.title || 'Photo'}
                                            className="archive-photo-image"
                                        />
                                      </div>
                                  ))}
                                </div>
                              </div>
                          )}

                          {/* Documents */}
                          {documents.length > 0 && (
                              <div className="archive-media-section">
                                <h3 className="archive-section-title archive-documents-title">
                                  <DocumentIcon className="archive-section-icon" />
                                  Документы
                                </h3>
                                <div className="archive-documents-list">
                                  {documents.map((doc) => (
                                      <a
                                          key={doc.id}
                                          href={doc.file_path}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="archive-document-item"
                                      >
                                        <DocumentIcon className="archive-document-icon" />
                                        <span className="archive-document-name">{doc.title || 'Документ'}</span>
                                      </a>
                                  ))}
                                </div>
                              </div>
                          )}
                        </motion.div>
                    )}
                  </div>
                </div>
            )}
          </div>
        </section>

        {/* Media Modal */}
        <AnimatePresence>
          {selectedMedia && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="archive-modal-overlay"
                  onClick={() => setSelectedMedia(null)}
              >
                <button
                    className="archive-modal-close"
                    onClick={() => setSelectedMedia(null)}
                >
                  <XMarkIcon className="archive-modal-close-icon" />
                </button>

                <div className="archive-modal-content" onClick={(e) => e.stopPropagation()}>
                  {selectedMedia.media_type === 'video' ? (
                      <div className="archive-video-player">
                        <ReactPlayer
                            url={selectedMedia.video_url || selectedMedia.file_path}
                            width="100%"
                            height="100%"
                            controls
                            playing
                        />
                      </div>
                  ) : (
                      <img
                          src={selectedMedia.file_path}
                          alt={selectedMedia.title || ''}
                          className="archive-photo-modal"
                      />
                  )}
                  {selectedMedia.title && (
                      <p className="archive-media-title">{selectedMedia.title}</p>
                  )}
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </>
  )
}