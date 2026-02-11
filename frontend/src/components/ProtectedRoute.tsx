import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useLoginModalStore } from '../store/loginModalStore'
import LoadingSpinner from './ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore()
  const location = useLocation()
  const openLoginModal = useLoginModalStore((s) => s.open)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLoginModal(location.pathname)
    }
  }, [isLoading, isAuthenticated, location.pathname, openLoginModal])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
