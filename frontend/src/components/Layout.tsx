import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import PartnersSection from './PartnersSection'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'

export default function Layout() {
  const { fetchUser, accessToken } = useAuthStore()
  const { fetchSettings } = useSettingsStore()

  useEffect(() => {
    fetchSettings()
    if (accessToken) {
      fetchUser()
    }
  }, [accessToken, fetchUser, fetchSettings])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <Outlet />
      </main>

      <PartnersSection />
      <Footer />
    </div>
  )
}



