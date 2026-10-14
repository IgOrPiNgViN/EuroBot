import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayIcon, PhotoIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { archiveApi } from '../api/archive'
import {ArchiveSeason, ArchiveSeasonDescriptionData} from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface ProcessedArchiveSeason extends ArchiveSeason {
  parsedDescription: ArchiveSeasonDescriptionData
}
import ReactPlayer from 'react-player'
import '../styles/pages/ArchivePage.css'
import {
  ARCHIVE_LEAGUES,
  hasLeagueTags,
  parseLeaguePlaces,
} from '../utils/leaguePlaces'

function getUrlBasename(url: string): string {
  try {
    const u = new URL(url, window.location.origin)
    const pathname = u.pathname || ''
    const base = pathname.split('/').filter(Boolean).pop() || ''
    return decodeURIComponent(base)
  } catch {
    const pathname = (url || '').split('?')[0].split('#')[0]
    const base = pathname.split('/').filter(Boolean).pop() || ''
    try {
      return decodeURIComponent(base)
    } catch {
      return base
    }
  }
}

function getProtocolDisplayName(doc: ArchiveSeason['media'][number]): string {
  const stripTrailingCopyIndex = (name: string): string =>
    name.replace(/\s*\(\d+\)(?=\.pdf$)/i, '').trim()

  const title = (doc.title || '').trim()
  if (title.toLowerCase().startsWith('соревнования евробот')) return stripTrailingCopyIndex(title)

  const fromPath = getUrlBasename(doc.file_path || '')
  const normalized = fromPath.toLowerCase()

  // Force exact filenames for 2023–2025 finals (as in local project root)
  if (normalized === 'competition_final_2023.pdf') return 'Соревнования Евробот_ Российский финал 19-21.05.2023.pdf'
  if (normalized === 'competition_final_2024.pdf') return 'Соревнования Евробот_ Российский финал 24-27.05.2024.pdf'
  if (normalized === 'competition_final_2025.pdf') return 'Соревнования Евробот_ Российский финал 2-4.05.2025.pdf'

  const fallback = fromPath || title || 'Итоговый PDF'
  return stripTrailingCopyIndex(fallback)
}

export default function ArchivePage() {
  const [seasons, setSeasons] = useState<ProcessedArchiveSeason[]>([])
  const [selectedSeason, setSelectedSeason] = useState<ProcessedArchiveSeason | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<ArchiveSeason['media'][number] | null>(null)
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

  function getVideoThumbnail(video: ArchiveSeason['media'][number]): string | null {
    if (video.thumbnail) return video.thumbnail
    const url = video.video_url || video.file_path || ''
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]+)/)
    if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`
    return null
  }

  function isVkVideo(video: ArchiveSeason['media'][number]): boolean {
    const url = video.video_url || video.file_path || ''
    return url.includes('vk.com') || url.includes('vkvideo.ru')
  }

  function decodeDescriptionData(description: string): ArchiveSeasonDescriptionData {
    if (!description) {
      return { mainDescription: '' };
    }

    // Закрытие сезона раньше сохраняло только JSON с картинками, без текста
    const trimmed = description.trim();
    if (trimmed.startsWith('{') && !trimmed.startsWith('{MAIN}')) {
      try {
        return { mainDescription: '', ...JSON.parse(trimmed) };
      } catch {
        /* обычный текст, начинающийся с фигурной скобки */
      }
    }

    const jsonMatch = description.match(/\{JSON\}([\s\S]*)$/);
    const mainMatch = description.match(/^\{MAIN\}([\s\S]*?)(?=\{JSON\}|$)/);

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

  // Разбирает строку вида "PRO: ... | OPEN: ... | JUNIOR: ... | STARTER: ..."
  const parseLeagueResult = (raw: string | null | undefined) => parseLeaguePlaces(raw)

  // Функция для получения логотипа и названия из описания
  const getSeasonLogoAndTitle = (season: ProcessedArchiveSeason) => {
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
  const protocolDocuments = documents.filter((doc) => {
    if (!selectedSeason || selectedSeason.year < 2023 || selectedSeason.year > 2025) return false
    const title = (doc.title || '').toLowerCase().trim()
    const base = getUrlBasename(doc.file_path || '').toLowerCase()
    return title.startsWith('соревнования евробот') || base.startsWith('competition_final_')
  })
  const protocolDocumentIds = new Set(protocolDocuments.map((d) => d.id))
  const otherDocuments = documents.filter((d) => !protocolDocumentIds.has(d.id))
  const documentsOrdered = [...protocolDocuments, ...otherDocuments]

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
                                <div className="archive-season-theme">
                                  <span className="archive-season-theme-label">Тема сезона</span>
                                  <p className="archive-season-theme-text">{selectedSeason.theme}</p>
                                </div>
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
                          {(selectedSeason.first_place || selectedSeason.second_place || selectedSeason.third_place) && (() => {
                            const first = parseLeagueResult(selectedSeason.first_place)
                            const second = parseLeagueResult(selectedSeason.second_place)
                            const third = parseLeagueResult(selectedSeason.third_place)
                            const hasLeagues =
                              hasLeagueTags(selectedSeason.first_place) ||
                              hasLeagueTags(selectedSeason.second_place) ||
                              hasLeagueTags(selectedSeason.third_place)

                            if (hasLeagues) {
                              return (
                                <div className="archive-results">
                                  <h3 className="archive-results-title">Итоги</h3>
                                  <div className="archive-leagues-grid">
                                    {ARCHIVE_LEAGUES.map(({ key, label }) => {
                                      const p1 = first[key]
                                      const p2 = second[key]
                                      const p3 = third[key]
                                      if (!p1 && !p2 && !p3) return null
                                      return (
                                        <div key={key} className="archive-league-block">
                                          <div className="archive-league-title">{label.toUpperCase()}</div>
                                          <div className="archive-winners-list">
                                            {p1 && <div className="archive-winner-item"><span className="archive-winner-emoji">🥇</span><span className="archive-winner-name">{p1}</span></div>}
                                            {p2 && <div className="archive-winner-item"><span className="archive-winner-emoji">🥈</span><span className="archive-winner-name">{p2}</span></div>}
                                            {p3 && <div className="archive-winner-item"><span className="archive-winner-emoji">🥉</span><span className="archive-winner-name">{p3}</span></div>}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                  {selectedSeason.additional_info && (
                                    <p className="archive-additional-info">{selectedSeason.additional_info}</p>
                                  )}
                                </div>
                              )
                            }

                            return (
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
                                    <p className="archive-additional-info">{selectedSeason.additional_info}</p>
                                  )}
                                </div>
                              </div>
                            )
                          })()}

                          {/* Documents */}
                          {documentsOrdered.length > 0 && (
                              <div className="archive-media-section">
                                <h3 className="archive-section-title archive-documents-title">
                                  <DocumentIcon className="archive-section-icon" />
                                  Документы
                                </h3>
                                <div className="archive-documents-list">
                                  {documentsOrdered.map((doc) => (
                                      <a
                                          key={doc.id}
                                          href={doc.file_path || '#'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="archive-document-item"
                                      >
                                        <DocumentIcon className="archive-document-icon" />
                                        <span className="archive-document-name">
                                          {protocolDocumentIds.has(doc.id) ? getProtocolDisplayName(doc) : (doc.title || 'Документ')}
                                        </span>
                                      </a>
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
                                          {(() => {
                                            const thumb = getVideoThumbnail(video)
                                            if (thumb) {
                                              return <img src={thumb} alt={video.title || 'Video'} className="archive-video-thumbnail" />
                                            }
                                            if (isVkVideo(video)) {
                                              return (
                                                <div className="archive-video-placeholder archive-video-placeholder-vk">
                                                  <span className="archive-video-placeholder-vk-label">VK</span>
                                                </div>
                                              )
                                            }
                                            return (
                                              <div className="archive-video-placeholder">
                                                <PlayIcon className="archive-video-placeholder-icon" />
                                              </div>
                                            )
                                          })()}
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
                        {(() => {
                          const url = selectedMedia.video_url || selectedMedia.file_path || ''
                          const isVk = url.includes('vk.com') || url.includes('vkvideo.ru')
                          if (isVk) {
                            const m = url.match(/video(-?\d+)_(\d+)/)
                            const embedUrl = m
                              ? `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}&hd=2`
                              : url
                            return (
                              <iframe
                                src={embedUrl}
                                width="100%"
                                height="100%"
                                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                                frameBorder="0"
                                allowFullScreen
                              />
                            )
                          }
                          return (
                            <ReactPlayer
                              url={url}
                              width="100%"
                              height="100%"
                              controls
                              playing
                            />
                          )
                        })()}
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