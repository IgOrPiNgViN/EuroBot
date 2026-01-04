import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { 
  ArrowRightIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon,
  NewspaperIcon,
  TrophyIcon 
} from '@heroicons/react/24/outline'
import { newsApi } from '../api/news'
import { seasonsApi } from '../api/seasons'
import { News, Season } from '../types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function HomePage() {
  const [featuredNews, setFeaturedNews] = useState<News[]>([])
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [news, season] = await Promise.all([
          newsApi.getFeatured(5),
          seasonsApi.getCurrent()
        ])
        setFeaturedNews(news)
        setCurrentSeason(season)
      } catch (error) {
        console.error('Failed to fetch homepage data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <>
      <Helmet>
        <title>Евробот Россия — Международные соревнования по робототехнике</title>
        <meta name="description" content="Официальный сайт соревнований Евробот в России. Регистрация команд, новости, правила и архив сезонов." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-eurobot-navy via-eurobot-blue to-eurobot-navy overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container-custom relative py-20 md:py-32">
          <div className="max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-heading font-bold text-white mb-6"
            >
              ЕВРОБОТ{' '}
              <span className="text-eurobot-gold">РОССИЯ</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
            >
              Международные соревнования по робототехнике для школьников и студентов. 
              Создавай роботов, соревнуйся, побеждай!
            </motion.p>

            {currentSeason && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-8"
              >
                <p className="text-eurobot-gold font-semibold text-lg">
                  {currentSeason.name}
                </p>
                {currentSeason.theme && (
                  <p className="text-white/80">Тема: {currentSeason.theme}</p>
                )}
                {currentSeason.registration_open && (
                  <p className="text-green-400 mt-2 font-medium">
                    ✓ Регистрация открыта
                  </p>
                )}
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/registration" className="btn-primary text-lg">
                Зарегистрировать команду
              </Link>
              <Link to="/competitions" className="btn-outline border-white text-white hover:bg-white hover:text-eurobot-navy text-lg">
                Подробнее о соревнованиях
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 52.5C480 45 600 60 720 67.5C840 75 960 75 1080 67.5C1200 60 1320 45 1380 37.5L1440 30V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="section-title text-center">Быстрые ссылки</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <Link 
              to="/registration"
              className="card p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="w-14 h-14 bg-eurobot-gold/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-eurobot-gold transition-colors">
                <ClipboardDocumentListIcon className="w-7 h-7 text-eurobot-gold group-hover:text-eurobot-navy transition-colors" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Регистрация команды</h3>
              <p className="text-gray-600 text-sm">Зарегистрируйте свою команду для участия в соревнованиях</p>
            </Link>

            <Link 
              to="/news"
              className="card p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="w-14 h-14 bg-eurobot-blue/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-eurobot-blue transition-colors">
                <NewspaperIcon className="w-7 h-7 text-eurobot-blue group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Новости</h3>
              <p className="text-gray-600 text-sm">Последние новости и объявления соревнований</p>
            </Link>

            <Link 
              to="/competitions"
              className="card p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                <CalendarIcon className="w-7 h-7 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Соревнования</h3>
              <p className="text-gray-600 text-sm">Информация о текущем сезоне и правила</p>
            </Link>

            <Link 
              to="/archive"
              className="card p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                <TrophyIcon className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Архив</h3>
              <p className="text-gray-600 text-sm">Результаты и материалы прошлых сезонов</p>
            </Link>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title mb-0">Новости</h2>
            <Link 
              to="/news"
              className="text-eurobot-blue hover:text-eurobot-navy font-medium flex items-center space-x-2"
            >
              <span>Все новости</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-6 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredNews.slice(0, 3).map((news, index) => (
                <motion.article
                  key={news.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card hover:shadow-xl transition-shadow"
                >
                  {news.featured_image && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={news.featured_image} 
                        alt={news.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center space-x-3 text-sm text-gray-500 mb-3">
                      {news.category && (
                        <span className="bg-eurobot-gold/10 text-eurobot-gold px-2 py-1 rounded">
                          {news.category.name}
                        </span>
                      )}
                      {news.publish_date && (
                        <time dateTime={news.publish_date}>
                          {format(new Date(news.publish_date), 'd MMMM yyyy', { locale: ru })}
                        </time>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2 line-clamp-2">
                      <Link to={`/news/${news.slug}`} className="hover:text-eurobot-blue">
                        {news.title}
                      </Link>
                    </h3>
                    {news.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-2">{news.excerpt}</p>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Новостей пока нет
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-eurobot-navy text-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-eurobot-gold mb-2">25+</div>
              <div className="text-gray-400">Лет истории</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-eurobot-gold mb-2">50+</div>
              <div className="text-gray-400">Стран участников</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-eurobot-gold mb-2">1000+</div>
              <div className="text-gray-400">Команд ежегодно</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-eurobot-gold mb-2">5000+</div>
              <div className="text-gray-400">Участников в России</div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}



