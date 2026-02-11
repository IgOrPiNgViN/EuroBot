import { FormatStructure } from '../types'

export function parseFormat(formatString: string): FormatStructure {
  try {
    return JSON.parse(formatString)
  } catch (error) {
    console.error('Failed to parse format JSON:', error)
    return {
      logo_url: '',
      title_url: '',
      icon_url: '',
      tasks: [],
      documents: []
    }
  }
}
