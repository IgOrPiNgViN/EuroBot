import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { settingsApi } from '../api/settings'
import '../styles/components/OffseasonBanner.css'

/** Значения по умолчанию; всё редактируется в админке: Настройки → «Межсезонье» */
export const OFFSEASON_DEFAULTS = {
  offseason_image: '/images/offseason/new-season.jpg',
  offseason_title: 'Новый сезон уже совсем скоро!',
  offseason_text:
    'Сезон завершён — спасибо всем командам, судьям и болельщикам! ' +
    'Сейчас мы готовим новый сезон «ЕВРОБОТ-Россия»: правила, даты и регистрация появятся здесь. ' +
    'Собирайте команду, доставайте роботов и следите за новостями, чтобы не пропустить старт.',
} as const

export type OffseasonKey = keyof typeof OFFSEASON_DEFAULTS

interface OffseasonBannerProps {
  /** Компактный вариант — без отступов секции (например, под hero на главной) */
  compact?: boolean
}

export default function OffseasonBanner({ compact = false }: OffseasonBannerProps) {
  const [content, setContent] = useState<Record<OffseasonKey, string>>({ ...OFFSEASON_DEFAULTS })

  useEffect(() => {
    settingsApi
      .getPublic()
      .then((settings) => {
        const s = settings as unknown as Record<string, unknown>
        setContent((prev) => {
          const next = { ...prev }
          for (const key of Object.keys(OFFSEASON_DEFAULTS) as OffseasonKey[]) {
            if (typeof s[key] === 'string' && (s[key] as string).trim()) next[key] = s[key] as string
          }
          return next
        })
      })
      .catch(() => {
        /* остаются значения по умолчанию */
      })
  }, [])

  return (
    <section className={`offseason ${compact ? 'offseason-compact' : ''}`}>
      <motion.div
        className="offseason-card"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {content.offseason_image && (
          <div className="offseason-image-wrap">
            <img src={content.offseason_image} alt={content.offseason_title} className="offseason-image" />
          </div>
        )}
        <div className="offseason-body">
          <span className="offseason-badge">Межсезонье</span>
          <h2 className="offseason-title">{content.offseason_title}</h2>
          <p className="offseason-text">{content.offseason_text}</p>
          <div className="offseason-actions">
            <Link to="/news" className="offseason-button offseason-button-primary">
              Следить за новостями
            </Link>
            <Link to="/archive" className="offseason-button offseason-button-secondary">
              Итоги прошлых сезонов
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
