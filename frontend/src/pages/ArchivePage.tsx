import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayIcon, PhotoIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { archiveApi } from '../api/archive'
import { ArchiveSeason, ArchiveMedia } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ReactPlayer from 'react-player'

export default function ArchivePage() {
  const [seasons, setSeasons] = useState<ArchiveSeason[]>([])
  const [selectedSeason, setSelectedSeason] = useState<ArchiveSeason | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<ArchiveMedia | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const data = await archiveApi.getSeasons()
        setSeasons(data)
        if (data.length > 0) {
          setSelectedSeason(data[0])
        }
      } catch (error) {
        console.error('Failed to fetch archive:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSeasons()
  }, [])

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

      <div className="bg-eurobot-navy py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            Архив сезонов
          </h1>
          <p className="text-gray-300 text-lg">
            Материалы и результаты прошлых соревнований
          </p>
        </div>
      </div>

      <section className="py-12">
        <div className="container-custom">
          {seasons.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              Архив пока пуст
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Season selector */}
              <aside className="lg:w-64 flex-shrink-0">
                <h3 className="font-semibold text-gray-700 mb-4">Выберите сезон</h3>
                <div className="space-y-2">
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      onClick={() => setSelectedSeason(season)}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        selectedSeason?.id === season.id
                          ? 'bg-eurobot-blue text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="font-semibold">{season.year}</span>
                      <span className="block text-sm opacity-80">{season.name}</span>
                    </button>
                  ))}
                </div>
              </aside>

              {/* Content */}
              <div className="flex-grow">
                {selectedSeason && (
                  <motion.div
                    key={selectedSeason.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {/* Season header */}
                    <div className="mb-8">
                      {selectedSeason.cover_image && (
                        <div className="aspect-video rounded-xl overflow-hidden mb-6 bg-gray-100">
                          <img
                            src={selectedSeason.cover_image}
                            alt={selectedSeason.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      <h2 className="text-3xl font-heading font-bold text-eurobot-navy mb-2">
                        {selectedSeason.name}
                      </h2>
                      {selectedSeason.theme && (
                        <p className="text-eurobot-gold font-medium mb-4">
                          Тема: {selectedSeason.theme}
                        </p>
                      )}
                      {selectedSeason.description && (
                        <p className="text-gray-600">{selectedSeason.description}</p>
                      )}
                      {selectedSeason.teams_count && (
                        <p className="text-sm text-gray-500 mt-2">
                          Участвовало команд: {selectedSeason.teams_count}
                        </p>
                      )}
                    </div>

                    {/* Results */}
                    {(selectedSeason.first_place || selectedSeason.second_place || selectedSeason.third_place) && (
                      <div className="mb-8 p-6 bg-eurobot-gold/10 rounded-xl">
                        <h3 className="font-heading font-semibold text-xl mb-4">Итоги</h3>
                        <div className="space-y-3">
                          {selectedSeason.first_place && (
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🥇</span>
                              <span className="font-medium">{selectedSeason.first_place}</span>
                            </div>
                          )}
                          {selectedSeason.second_place && (
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🥈</span>
                              <span className="font-medium">{selectedSeason.second_place}</span>
                            </div>
                          )}
                          {selectedSeason.third_place && (
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🥉</span>
                              <span className="font-medium">{selectedSeason.third_place}</span>
                            </div>
                          )}
                          {selectedSeason.additional_info && (
                            <p className="text-gray-600 mt-4 pt-3 border-t border-eurobot-gold/20">
                              {selectedSeason.additional_info}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                    {videos.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-heading font-semibold text-xl mb-4 flex items-center">
                          <PlayIcon className="w-6 h-6 mr-2 text-eurobot-blue" />
                          Видео
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {videos.map((video) => (
                            <div
                              key={video.id}
                              onClick={() => setSelectedMedia(video)}
                              className="cursor-pointer group"
                            >
                              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative">
                                {video.thumbnail ? (
                                  <img
                                    src={video.thumbnail}
                                    alt={video.title || 'Video'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                    <PlayIcon className="w-16 h-16 text-gray-500" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <PlayIcon className="w-16 h-16 text-white" />
                                </div>
                              </div>
                              {video.title && (
                                <p className="mt-2 font-medium">{video.title}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photos */}
                    {photos.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-heading font-semibold text-xl mb-4 flex items-center">
                          <PhotoIcon className="w-6 h-6 mr-2 text-green-600" />
                          Фотографии
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {photos.map((photo) => (
                            <div
                              key={photo.id}
                              onClick={() => setSelectedMedia(photo)}
                              className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer group"
                            >
                              <img
                                src={photo.thumbnail || photo.file_path}
                                alt={photo.title || 'Photo'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {documents.length > 0 && (
                      <div>
                        <h3 className="font-heading font-semibold text-xl mb-4 flex items-center">
                          <DocumentIcon className="w-6 h-6 mr-2 text-purple-600" />
                          Документы
                        </h3>
                        <div className="space-y-2">
                          {documents.map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <DocumentIcon className="w-8 h-8 text-gray-400 mr-3" />
                              <span>{doc.title || 'Документ'}</span>
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

      {/* Media modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
              onClick={() => setSelectedMedia(null)}
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            
            <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              {selectedMedia.media_type === 'video' ? (
                <div className="aspect-video">
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
                  className="max-w-full max-h-[80vh] mx-auto"
                />
              )}
              {selectedMedia.title && (
                <p className="text-white text-center mt-4">{selectedMedia.title}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}





