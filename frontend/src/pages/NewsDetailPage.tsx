import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, CalendarIcon, EyeIcon, TagIcon } from '@heroicons/react/24/outline'
import { newsApi } from '../api/news'
import { News } from '../types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ReactPlayer from 'react-player'
import SEO from '../components/SEO'

// Функция для получения embed URL из Rutube
const getRutubeEmbedUrl = (url: string): string | null => {
  // Форматы: rutube.ru/video/ID/ или rutube.ru/play/embed/ID
  const patterns = [
    /rutube\.ru\/video\/([a-zA-Z0-9]+)/,
    /rutube\.ru\/play\/embed\/([a-zA-Z0-9]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return `https://rutube.ru/play/embed/${match[1]}`
    }
  }
  return null
}

// Проверка, является ли URL Rutube
const isRutubeUrl = (url: string): boolean => {
  return url.includes('rutube.ru')
}

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [news, setNews] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      if (!slug) return
      
      setLoading(true)
      try {
        const data = await newsApi.getBySlug(slug)
        setNews(data)
      } catch (err) {
        setError('Новость не найдена')
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [slug])

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (error || !news) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Новость не найдена'}</h1>
        <Link to="/news" className="text-eurobot-blue hover:underline">
          ← Вернуться к новостям
        </Link>
      </div>
    )
  }

  return (
    <>
      <SEO
        title={news.meta_title || news.title}
        description={news.meta_description || news.excerpt || 'Новость соревнований Евробот'}
        image={news.featured_image || undefined}
        url={`/news/${news.slug}`}
        type="article"
        publishedTime={news.publish_date || undefined}
        keywords={news.tags?.map(t => t.name) || []}
      />

      <article>
        {/* Header with image */}
        {news.featured_image && (
          <div className="relative h-[40vh] min-h-[300px] max-h-[500px]">
            <img
              src={news.featured_image}
              alt={news.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-eurobot-navy/80 to-transparent" />
          </div>
        )}

        <div className="container-custom py-12">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
              to="/news"
              className="inline-flex items-center text-eurobot-blue hover:text-eurobot-navy mb-6"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Все новости
            </Link>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
              {news.category && (
                <span className="bg-eurobot-gold/10 text-eurobot-gold px-3 py-1 rounded-full">
                  {news.category.name}
                </span>
              )}
              {news.publish_date && (
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  <time dateTime={news.publish_date}>
                    {format(new Date(news.publish_date), 'd MMMM yyyy', { locale: ru })}
                  </time>
                </div>
              )}
              <div className="flex items-center">
                <EyeIcon className="w-4 h-4 mr-1" />
                {news.views_count} просмотров
              </div>
            </div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-heading font-bold text-eurobot-navy mb-6"
            >
              {news.title}
            </motion.h1>

            {/* Tags */}
            {news.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {news.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/news?tag=${tag.slug}`}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200"
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Video */}
            {news.video_url && (
              <div className="mb-8 aspect-video rounded-xl overflow-hidden bg-black">
                {isRutubeUrl(news.video_url) ? (
                  <iframe
                    src={getRutubeEmbedUrl(news.video_url) || news.video_url}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="clipboard-write; autoplay"
                    allowFullScreen
                  />
                ) : (
                  <ReactPlayer
                    url={news.video_url}
                    width="100%"
                    height="100%"
                    controls
                  />
                )}
              </div>
            )}

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-eurobot-navy prose-a:text-eurobot-blue"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />

            {/* Gallery */}
            {news.gallery && (
              <div className="mt-12">
                <h3 className="text-xl font-heading font-semibold mb-4">Галерея</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {JSON.parse(news.gallery).map((url: string, index: number) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`Фото ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </>
  )
}




