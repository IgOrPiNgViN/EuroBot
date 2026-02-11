import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  author?: string
  keywords?: string[]
}

const DEFAULT_IMAGE = '/og-image.jpg'
const SITE_NAME = 'Евробот Россия'
const BASE_URL = 'https://eurobot.ru'

export default function SEO({
  title,
  description = 'Международные соревнования по робототехнике Евробот в России. Регистрация команд, новости, правила.',
  image = DEFAULT_IMAGE,
  url = '',
  type = 'website',
  publishedTime,
  author,
  keywords = ['Евробот', 'Eurobot', 'робототехника', 'соревнования', 'роботы', 'Россия']
}: SEOProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ru_RU" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  )
}


