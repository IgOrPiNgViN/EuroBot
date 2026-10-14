import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { settingsApi } from '../api/settings'
import { useSettingsStore } from '../store/settingsStore'
import '../styles/components/OffseasonBanner.css'

/** Значения по умолчанию; всё редактируется в админке: Настройки → «Межсезонье» */
export const OFFSEASON_DEFAULTS = {
  offseason_image: '/images/offseason/new-season.jpg',
  offseason_title: 'Новый сезон уже совсем скоро!',
  offseason_text:
    'Сезон завершён — спасибо всем командам, судьям и болельщикам! ' +
    'Мы уже готовим новый сезон «ЕВРОБОТ-Россия»: тема, регламент, даты и регистрация появятся здесь совсем скоро. ' +
    'А пока собирайте команду, доставайте роботов и следите за новостями, чтобы не пропустить старт!',
  offseason_tasks_title: 'Новые задания уже в пути!',
  offseason_tasks_text:
    'Судьи придумывают для роботов свежие испытания. Задания и регламент нового сезона ' +
    'появятся здесь вместе с его стартом — заряжайте аккумуляторы!',
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

/** Красный блок «Задания сезона» для межсезонья (страница «Соревнования») */
export function OffseasonTasks() {
  const settings = useSettingsStore((st) => st.settings) as Record<string, unknown>
  const pick = (key: OffseasonKey) =>
    typeof settings[key] === 'string' && (settings[key] as string).trim()
      ? (settings[key] as string)
      : OFFSEASON_DEFAULTS[key]

  return (
    <section className="offseason-tasks">
      <motion.div
        className="offseason-tasks-content"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h3 className="offseason-tasks-heading">Задания сезона</h3>
        <div className="offseason-tasks-robots" aria-hidden="true">🤖 ⚙️ 🔧</div>
        <p className="offseason-tasks-title">{pick('offseason_tasks_title')}</p>
        <p className="offseason-tasks-text">{pick('offseason_tasks_text')}</p>
      </motion.div>
    </section>
  )
}
