import { useEffect, useRef } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useSmartCaptcha } from '../../hooks/useSmartCaptcha'

interface SmartCaptchaProps {
  onVerify: (token: string) => void
  className?: string
}

declare global {
  interface Window {
    smartCaptcha?: {
      render: (container: HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
      }) => number
      reset: (widgetId: number) => void
    }
  }
}

export default function SmartCaptcha({ onVerify, className = '' }: SmartCaptchaProps) {
  const { settings } = useSettingsStore()
  const { resetKey } = useSmartCaptcha()
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<number | null>(null)

  const clientKey = settings.smartcaptcha_client_key as string | undefined

  useEffect(() => {
    if (!clientKey || !containerRef.current) return

    // Load SmartCaptcha script if not loaded
    const scriptId = 'smartcaptcha-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://smartcaptcha.yandexcloud.net/captcha.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)

      script.onload = () => {
        renderCaptcha()
      }
    } else if (window.smartCaptcha) {
      renderCaptcha()
    }

    function renderCaptcha() {
      if (!containerRef.current || !window.smartCaptcha || !clientKey) return
      
      // Clear previous captcha
      containerRef.current.innerHTML = ''
      
      widgetIdRef.current = window.smartCaptcha.render(containerRef.current, {
        sitekey: clientKey,
        callback: onVerify
      })
    }
  }, [clientKey, onVerify, resetKey])

  // Reset captcha when resetKey changes
  useEffect(() => {
    if (widgetIdRef.current !== null && window.smartCaptcha) {
      window.smartCaptcha.reset(widgetIdRef.current)
    }
  }, [resetKey])

  if (!clientKey) {
    return null
  }

  return (
    <div className={className}>
      <div ref={containerRef} />
    </div>
  )
}

