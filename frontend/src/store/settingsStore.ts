import { create } from 'zustand'
import { SiteSettings } from '../types'
import { settingsApi } from '../api/settings'

interface SettingsState {
  settings: SiteSettings
  isLoading: boolean
  fetchSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {},
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const settings = await settingsApi.getPublic()
      set({ settings, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  }
}))



