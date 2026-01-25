import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { newsApi } from '../api/news'
import { News, NewsCategory, NewsTag } from '../types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import SEO from '../components/SEO'

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
    setSearchParams({ search: searchValue })
  }

  const handleCategoryChange = (categorySlug: string) => {
    if (categorySlug) {
      setSearchParams({ category: categorySlug })
    } else {
      searchParams.delete('category')
      setSearchParams(searchParams)
    }
  }

  const handleTagChange = (tagSlug: string) => {
    if (tagSlug) {
      setSearchParams({ tag: tagSlug })
    } else {
      searchParams.delete('tag')
      setSearchParams(searchParams)
    }
  }

  return (
    <>
      <SEO
        title="Новости"
        description="Новости соревнований Евробот: объявления, результаты, инструкции и события."
        url="/news"
      />

      <div className="bg-eurobot-navy py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            Новости
          </h1>
          <p className="text-gray-300 text-lg">
            Актуальные новости и объявления соревнований Евробот
          </p>
        </div>
      </div>

      <section className="py-12">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <Input
                    name="search"
                    placeholder="Поиск..."
                    defaultValue={search}
                    className="pr-10"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </form>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Категории</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => handleCategoryChange('')}
                      className={`text-sm ${!category ? 'text-eurobot-blue font-medium' : 'text-gray-600 hover:text-eurobot-blue'}`}
                    >
                      Все категории
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => handleCategoryChange(cat.slug)}
                        className={`text-sm ${category === cat.slug ? 'text-eurobot-blue font-medium' : 'text-gray-600 hover:text-eurobot-blue'}`}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Теги</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleTagChange(tag === t.slug ? '' : t.slug)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          tag === t.slug
                            ? 'bg-eurobot-blue text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* News grid */}
            <div className="flex-grow">
              {loading ? (
                <LoadingSpinner />
              ) : news.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {news.map((item, index) => (
                      <Link to={`/news/${item.slug}`} key={item.id}>
                        <motion.article
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="card hover:shadow-xl transition-shadow cursor-pointer h-full"
                        >
                          {item.featured_image && (
                            <div className="aspect-video overflow-hidden rounded-t-xl">
                              <img
                                src={item.featured_image}
                                alt={item.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                              {item.category && (
                                <span className="bg-eurobot-gold/10 text-eurobot-gold px-2 py-0.5 rounded">
                                  {item.category.name}
                                </span>
                              )}
                              {item.publish_date && (
                                <time dateTime={item.publish_date}>
                                  {format(new Date(item.publish_date), 'd MMM yyyy', { locale: ru })}
                                </time>
                              )}
                            </div>
                            <h2 className="font-heading font-semibold text-lg mb-2 line-clamp-2 hover:text-eurobot-blue transition-colors">
                              {item.title}
                            </h2>
                            {item.excerpt && (
                              <p className="text-gray-600 text-sm line-clamp-2">{item.excerpt}</p>
                            )}
                          </div>
                        </motion.article>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-10 space-x-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            page === p
                              ? 'bg-eurobot-blue text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Новости не найдены</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchParams({})}
                  >
                    Сбросить фильтры
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}




