import { useState, useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'

export function useSmartCaptcha() {
  const { settings } = useSettingsStore()
  const [resetKey, setResetKey] = useState(0)

  const isEnabled = Boolean(settings.smartcaptcha_client_key)

  const resetCaptcha = useCallback(() => {
    setResetKey(prev => prev + 1)
  }, [])

  return {
    isEnabled,
    resetKey,
    resetCaptcha
  }
}

