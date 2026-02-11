import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MagnifyingGlassIcon, NewspaperIcon } from '@heroicons/react/24/outline'
import { newsApi } from '../api/news'
import { News, NewsCategory, NewsTag } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import SEO from '../components/SEO'
import '../styles/pages/NewsPage.css'

export default function NewsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [news, setNews] = useState<News[]>([])
    const [categories, setCategories] = useState<NewsCategory[]>([])
    const [tags, setTags] = useState<NewsTag[]>([])
    const [loading, setLoading] = useState(true)
    const [totalPages, setTotalPages] = useState(1)

    const page = parseInt(searchParams.get('page') || '1')
    const category = searchParams.get('category') || ''
    const tag = searchParams.get('tag') || ''
    const search = searchParams.get('search') || ''

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [newsData, categoriesData, tagsData] = await Promise.all([
                    newsApi.getList({ page, category, tag, search, limit: 9 }),
                    newsApi.getCategories(),
                    newsApi.getTags()
                ])
                setNews(newsData.items)
                setTotalPages(newsData.pages)
                setCategories(categoriesData)
                setTags(tagsData)
            } catch (error) {
                console.error('Failed to fetch news:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [page, category, tag, search])

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const searchValue = formData.get('search') as string
        setSearchParams({ search: searchValue, page: '1' })
    }

    const handleCategoryChange = (categorySlug: string) => {
        const newParams = new URLSearchParams(searchParams)
        if (categorySlug) {
            newParams.set('category', categorySlug)
        } else {
            newParams.delete('category')
        }
        newParams.set('page', '1')
        setSearchParams(newParams)
    }

    const handleTagChange = (tagSlug: string) => {
        const newParams = new URLSearchParams(searchParams)
        if (tagSlug) {
            newParams.set('tag', tagSlug)
        } else {
            newParams.delete('tag')
        }
        newParams.set('page', '1')
        setSearchParams(newParams)
    }

    const renderNewsGrid = (newsItems: News[]) => {
        const gridItems = []

        for (let i = 0; i < newsItems.length; i += 5) {
            const chunk = newsItems.slice(i, i + 5)
            gridItems.push(
                <div key={`grid-${i}`} className="news-grid">
                    {chunk.map((item, index) => (
                        <Link to={`/news/${item.slug}`} key={item.id} className="news-card">
                            <motion.article
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (i + index) * 0.05 }}
                            >
                                <div className="news-image">
                                    {item.featured_image ? (
                                        <img
                                            src={item.featured_image}
                                            alt={item.title}
                                            className="news-image-img"
                                        />
                                    ) : (
                                        <div className="news-image-placeholder">
                                            <NewspaperIcon className="news-image-placeholder-icon" />
                                        </div>
                                    )}
                                    <div className="news-overlay">
                                        <h3 className="news-title">{item.title}</h3>
                                        {item.excerpt && (
                                            <p className="news-excerpt">{item.excerpt}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.article>
                        </Link>
                    ))}
                </div>
            )
        }

        return gridItems
    }

    return (
        <>
            <SEO
                title="Новости"
                description="Новости соревнований Евробот: объявления, результаты, инструкции и события."
                url="/news"
            />

            <div className="news-hero">
                <div className="news-container">
                    <h1 className="news-hero-title">
                        Новости
                    </h1>
                    <p className="news-hero-subtitle">
                        Самое свежее о крупнейших робототехнических соревнованиях
                    </p>
                </div>
            </div>

            <section className="news-layout news-container">
                <aside className="news-sidebar">
                    <form onSubmit={handleSearch}>
                        <div className="news-search-container">
                            <input
                                name="search"
                                placeholder="Поиск..."
                                defaultValue={search}
                                className="news-search-input"
                            />
                            <button type="submit" className="news-search-button">
                                <MagnifyingGlassIcon className="news-search-icon" />
                            </button>
                        </div>
                    </form>

                    <div className="news-categories">
                        <h3>Категории</h3>
                        <ul>
                            <li>
                                <button
                                    onClick={() => handleCategoryChange('')}
                                    className={`news-category-button ${!category ? 'active' : ''}`}
                                >
                                    Все категории
                                </button>
                            </li>
                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    <button
                                        onClick={() => handleCategoryChange(cat.slug)}
                                        className={`news-category-button ${category === cat.slug ? 'active' : ''}`}
                                    >
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {tags.length > 0 && (
                        <div className="news-tags">
                            <h3>Теги</h3>
                            <div className="news-tags-container">
                                {tags.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleTagChange(tag === t.slug ? '' : t.slug)}
                                        className={`news-tag-button ${tag === t.slug ? 'active' : ''}`}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                <div className="news-content">
                    {loading ? (
                        <div className="news-loading">
                            <LoadingSpinner />
                        </div>
                    ) : news.length > 0 ? (
                        <>
                            {renderNewsGrid(news)}

                            {totalPages > 1 && (
                                <div className="news-pagination">
                                    {page > 1 && (
                                        <button
                                            onClick={() => setSearchParams({
                                                ...Object.fromEntries(searchParams),
                                                page: (page - 1).toString()
                                            })}
                                            className="news-page-button"
                                        >
                                            ←
                                        </button>
                                    )}

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum
                                        if (totalPages <= 5) {
                                            pageNum = i + 1
                                        } else if (page <= 3) {
                                            pageNum = i + 1
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i
                                        } else {
                                            pageNum = page - 2 + i
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setSearchParams({
                                                    ...Object.fromEntries(searchParams),
                                                    page: pageNum.toString()
                                                })}
                                                className={`news-page-button ${page === pageNum ? 'active' : ''}`}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    })}

                                    {page < totalPages && (
                                        <button
                                            onClick={() => setSearchParams({
                                                ...Object.fromEntries(searchParams),
                                                page: (page + 1).toString()
                                            })}
                                            className="news-page-button"
                                        >
                                            →
                                        </button>
                                    )}

                                    {totalPages > 5 && page < totalPages - 2 && (
                                        <>
                                            <span className="news-pagination-dots">...</span>
                                            <button
                                                onClick={() => setSearchParams({
                                                    ...Object.fromEntries(searchParams),
                                                    page: totalPages.toString()
                                                })}
                                                className={`news-page-button ${page === totalPages ? 'active' : ''}`}
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="news-empty">
                            <h2>Новости не найдены</h2>
                            <p>Попробуйте изменить параметры поиска или сбросить фильтры</p>
                            <button
                                onClick={() => setSearchParams({})}
                                className="news-reset-button"
                            >
                                Сбросить фильтры
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </>
    )
}