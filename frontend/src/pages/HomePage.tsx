import { useState, useEffect } from 'react'
import {Link} from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRightIcon,
  NewspaperIcon,
} from '@heroicons/react/24/outline'
import { newsApi } from '../api/news'
import { seasonsApi } from '../api/seasons'
import { News, Season, FormatStructure } from '../types'
import SEO from '../components/SEO'
import '../styles/pages/HomePage.css'

export default function HomePage() {
  const [featuredNews, setFeaturedNews] = useState<News[]>([])
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [news, season] = await Promise.all([
          newsApi.getFeatured(5),
          seasonsApi.getCurrent()
        ])
        setFeaturedNews(news)
        setCurrentSeason(season)
        if (season.format) {
          const parsedFormat = parseFormat(season.format)
          setFormatData(parsedFormat)
        }
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
        <SEO
            title="Евробот Россия"
            description="Официальный сайт соревнований Евробот в России. Регистрация команд, новости, правила и архив сезонов."
            url="/"
        />

        <section className="home-hero">
          <div className="home-hero-bg" />

          <div className="home-container-hero">
            <div className="hero-left-column">
              <div className="hero-left-title-image-container">
                {formatData?.title_url && (
                    <img
                        src={formatData.title_url}
                        alt={currentSeason?.name || "EUROBOT"}
                        className="hero-title-image"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                    />
                )}
                {!formatData?.title_url && (
                    <img
                        src="/images/admin-logo.png"
                        alt={currentSeason?.name || "EUROBOT"}
                        className="hero-title-image"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                    />
                )}
              </div>
              <div className="hero-left-buttons-container">
                {formatData?.title_url && (
                    <>
                      <Link
                          to="/registration"
                          className="header-home-link"
                      >
                        Зарегистрировать команду
                      </Link>
                      <Link
                          to="/competitions"
                          className="header-home-link"
                      >
                        Подробнее о соревнованиях
                      </Link>
                    </>
                )}
              </div>
            </div>
            <div className="hero-right-column">
              <div className="hero-right-text">
                <p>
                  Международные молодежные робототехнические соревнование ЕВРОБОТ -
                  это открытый чемпионат мобильных роботов, созданных
                  молодёжными командами со всего мира.
                </p>
              </div>
              <div className="hero-right-logo-image-container">
                {formatData?.logo_url && (
                    <img
                        src={formatData.logo_url}
                        alt="Логотип"
                        className="hero-logo-image"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                    />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="home-news">
          <div className="home-container">
            <div className="home-news-header">
              <div className="news-title-block">
                <h2 className="home-section-title">Новости</h2>
                <p className="home-news-subtitle">
                  Самое свежее о крупнейших робототехнических соревнованиях
                </p>
              </div>

              <Link to="/news" className="home-all-news-link">
                <span>Все новости</span>
                <ArrowRightIcon className="home-all-news-icon" />
              </Link>
            </div>

            {loading ? (
                <div className="home-news-grid">
                  {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="home-news-skeleton">
                        <div className="home-news-skeleton-image" />
                        <div className="home-news-skeleton-content">
                          <div className="home-news-skeleton-badge" />
                          <div className="home-news-skeleton-title" />
                          <div className="home-news-skeleton-text" />
                        </div>
                      </div>
                  ))}
                </div>
            ) : featuredNews.length > 0 ? (
                <div className="home-news-grid">
                  {featuredNews.slice(0, 5).map((news, index) => (
                      <motion.a
                          key={news.id}
                          href={`/news/${news.slug}`}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          viewport={{ once: true }}
                          className="home-news-card"
                      >
                        <div className="home-news-image">
                          {news.featured_image ? (
                              <img
                                  src={news.featured_image}
                                  alt={news.title}
                                  className="home-news-image-img"
                              />
                          ) : (
                              <div className="home-news-image-placeholder">
                                <NewspaperIcon className="home-news-image-placeholder-icon" />
                              </div>
                          )}
                          <div className="home-news-overlay">
                            <h3 className="home-news-title">{news.title}</h3>
                            {news.excerpt && (
                                <p className="home-news-excerpt">{news.excerpt}</p>
                            )}
                          </div>
                        </div>
                      </motion.a>
                  ))}
                </div>
            ) : (
                <div className="home-no-news">
                  Новостей пока нет
                </div>
            )}
          </div>
        </section>
      </>
  )
}