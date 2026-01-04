import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Layout from './components/Layout'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'))
const CompetitionsPage = lazy(() => import('./pages/CompetitionsPage'))
const ArchivePage = lazy(() => import('./pages/ArchivePage'))
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactsPage = lazy(() => import('./pages/ContactsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminNews = lazy(() => import('./pages/admin/NewsManagement'))
const AdminTeams = lazy(() => import('./pages/admin/TeamsManagement'))
const AdminPartners = lazy(() => import('./pages/admin/PartnersManagement'))
const AdminSeasons = lazy(() => import('./pages/admin/SeasonsManagement'))
const AdminMessages = lazy(() => import('./pages/admin/MessagesManagement'))
const AdminSettings = lazy(() => import('./pages/admin/SettingsManagement'))
const AdminAdmins = lazy(() => import('./pages/admin/AdminsManagement'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:slug" element={<NewsDetailPage />} />
          <Route path="competitions" element={<CompetitionsPage />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="registration" element={<RegistrationPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="seasons" element={<AdminSeasons />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="admins" element={<AdminAdmins />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App



