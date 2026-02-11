import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useLoginModalStore } from '../store/loginModalStore'
import Input from './ui/Input'
import Button from './ui/Button'
import '../styles/components/LoginModal.css'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginModal() {
  const navigate = useNavigate()
  const { login, isLoading, isAuthenticated, isAdmin } = useAuthStore()
  const { isOpen, redirectTo, close } = useLoginModalStore()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LoginFormData>()

  // If user becomes authenticated while modal is open, redirect and close
  useEffect(() => {
    if (isOpen && isAuthenticated && isAdmin) {
      close()
      navigate(redirectTo || '/admin', { replace: true })
    }
  }, [isAuthenticated, isAdmin, isOpen, redirectTo, close, navigate])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      reset()
    }
  }, [isOpen, reset])

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      await login(data.email, data.password)
      toast.success('Добро пожаловать!')
      // redirect will happen in the useEffect above
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа. Проверьте email и пароль.')
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="login-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="login-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <button className="login-modal-close" onClick={close}>
              <XMarkIcon className="login-modal-close-icon" />
            </button>

            <div className="login-modal-header">
              <img src="/images/admin-logo.png" alt="EUROBOT" className="login-modal-logo" />
              <h2 className="login-modal-title">Вход в админ-панель</h2>
              <p className="login-modal-subtitle">Введите данные для доступа</p>
            </div>

            {error && (
              <div className="login-modal-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="login-modal-form">
              <Input
                label="Email"
                type="email"
                {...register('email', {
                  required: 'Обязательное поле',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Некорректный email'
                  }
                })}
                error={errors.email?.message}
                placeholder="admin@eurobot.ru"
              />

              <Input
                label="Пароль"
                type="password"
                {...register('password', { required: 'Обязательное поле' })}
                error={errors.password?.message}
                placeholder="••••••••"
              />

              <Button
                type="submit"
                className="login-modal-submit"
                isLoading={isLoading}
              >
                Войти
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
