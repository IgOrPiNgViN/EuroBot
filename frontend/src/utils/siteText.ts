import { useSettingsStore } from '../store/settingsStore'

/**
 * Тексты и контакты, которые раньше были зашиты в код.
 * Редактируются в админке: Настройки → «Контакты и тексты сайта».
 * Если поле в админке пустое — используется значение по умолчанию.
 */
export const SITE_TEXT_FIELDS = [
  { key: 'contact_phone', label: 'Телефон', default: '+7 (906) 712‑7744', multiline: false },
  { key: 'contact_main_email', label: 'Основной email', default: 'eurobotrussia@yandex.ru', multiline: false },
  { key: 'contact_address', label: 'Адрес', default: 'Москва, Каширское ш. 31 (НИЯУ МИФИ)', multiline: false },
  { key: 'contact_vk', label: 'Ссылка на ВКонтакте', default: 'https://vk.com/eurobotrussia', multiline: false },
  {
    key: 'contact_max',
    label: 'Ссылка на MAX',
    default: 'https://max.ru/join/DeyL3IUDfbMmMpjQ-obL6jdiLvpqmqVcb3ZYicemQDc',
    multiline: false,
  },
  {
    key: 'home_hero_text',
    label: 'Текст на главной (справа от заголовка)',
    default:
      'Всероссийские молодежные робототехнические соревнования «ЕВРОБОТ-Россия» с международным участием — ' +
      'это открытый чемпионат мобильных роботов, созданных молодёжными командами.',
    multiline: true,
  },
] as const

export type SiteTextKey = (typeof SITE_TEXT_FIELDS)[number]['key']

export const SITE_TEXT_DEFAULTS = Object.fromEntries(
  SITE_TEXT_FIELDS.map((f) => [f.key, f.default])
) as Record<SiteTextKey, string>

/** Значения текстов сайта с учётом настроек из админки */
export function useSiteText(): Record<SiteTextKey, string> {
  const settings = useSettingsStore((s) => s.settings) as Record<string, unknown>
  const result = { ...SITE_TEXT_DEFAULTS }
  for (const field of SITE_TEXT_FIELDS) {
    const value = settings[field.key]
    if (typeof value === 'string' && value.trim()) result[field.key] = value
  }
  return result
}

/** "+7 (906) 712-77-44" → "tel:+79067127744" */
export function phoneHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  return `tel:${digits.startsWith('8') && digits.length === 11 ? '+7' + digits.slice(1) : digits}`
}
