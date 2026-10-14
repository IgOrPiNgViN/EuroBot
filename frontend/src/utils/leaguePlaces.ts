export const ARCHIVE_LEAGUES = [
  { key: 'pro', label: 'Pro', tag: 'PRO' },
  { key: 'open', label: 'Open', tag: 'OPEN' },
  { key: 'junior', label: 'Junior', tag: 'JUNIOR' },
  { key: 'starter', label: 'Starter', tag: 'STARTER' },
] as const

export type LeagueKey = (typeof ARCHIVE_LEAGUES)[number]['key']

export type LeaguePlaceSlot = {
  first: string
  second: string
  third: string
}

export type LeaguePlacesForm = Record<LeagueKey, LeaguePlaceSlot>

export type LeaguePlacesMap = Record<LeagueKey, string>

const emptySlot = (): LeaguePlaceSlot => ({ first: '', second: '', third: '' })

export const emptyLeaguePlaces = (): LeaguePlacesForm => ({
  pro: emptySlot(),
  open: emptySlot(),
  junior: emptySlot(),
  starter: emptySlot(),
})

export function emptyLeaguePlacesMap(): LeaguePlacesMap {
  return { pro: '', open: '', junior: '', starter: '' }
}

export function encodeLeaguePlaces(places: LeaguePlacesMap): string {
  const parts: string[] = []
  for (const league of ARCHIVE_LEAGUES) {
    const value = places[league.key]?.trim()
    if (value) parts.push(`${league.tag}: ${value}`)
  }
  return parts.join(' | ')
}

export function parseLeaguePlaces(raw: string | null | undefined): LeaguePlacesMap {
  const result = emptyLeaguePlacesMap()
  if (!raw) return result

  let matched = false
  for (const league of ARCHIVE_LEAGUES) {
    const match = raw.match(new RegExp(`${league.tag}:\\s*([^|]+)`, 'i'))
    if (match) {
      result[league.key] = match[1].trim()
      matched = true
    }
  }

  if (matched) return result

  // Legacy single-string value — keep in Open so it is not lost
  result.open = raw
  return result
}

export function hasLeagueTags(raw: string | null | undefined): boolean {
  if (!raw) return false
  return ARCHIVE_LEAGUES.some((league) => new RegExp(`${league.tag}:`, 'i').test(raw))
}

export function encodePlaceFromForm(form: LeaguePlacesForm, place: keyof LeaguePlaceSlot): string {
  const map = emptyLeaguePlacesMap()
  for (const league of ARCHIVE_LEAGUES) {
    map[league.key] = form[league.key][place]
  }
  return encodeLeaguePlaces(map)
}

export function parsePlacesIntoForm(
  first: string | null | undefined,
  second: string | null | undefined,
  third: string | null | undefined
): LeaguePlacesForm {
  const firstMap = parseLeaguePlaces(first)
  const secondMap = parseLeaguePlaces(second)
  const thirdMap = parseLeaguePlaces(third)
  const form = emptyLeaguePlaces()

  for (const league of ARCHIVE_LEAGUES) {
    form[league.key] = {
      first: firstMap[league.key],
      second: secondMap[league.key],
      third: thirdMap[league.key],
    }
  }

  return form
}
