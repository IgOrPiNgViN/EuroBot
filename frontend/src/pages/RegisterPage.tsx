import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { authApi, RegisterData } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import Input from '../components/ui/Input'
import PhoneInput from '../components/ui/PhoneInput'
import Button from '../components/ui/Button'

interface RegisterFormData extends RegisterData {
  confirmPassword: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>()
  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    setLoading(true)
    
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone
      })
      
      // Auto login after registration
      await login(data.email, data.password)
      
      toast.success('Регистрация успешна!')
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Регистрация — Евробот Россия</title>
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <div className="w-16 h-16 bg-eurobot-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-eurobot-navy font-bold text-3xl">E</span>
              </div>
            </Link>
            <h1 className="text-2xl font-heading font-bold text-eurobot-navy">
              Создание аккаунта
            </h1>
            <p className="text-gray-600 mt-2">
              Зарегистрируйтесь для участия в соревнованиях
            </p>
          </div>

          <div className="card p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Полное имя"
                {...register('full_name')}
                placeholder="Иван Иванов"
              />

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
                placeholder="email@example.com"
              />

              <PhoneInput
                label="Телефон"
                {...register('phone')}
              />

              <Input
                label="Пароль"
                type="password"
                {...register('password', { 
                  required: 'Обязательное поле',
                  minLength: { value: 6, message: 'Минимум 6 символов' }
                })}
                error={errors.password?.message}
                placeholder="••••••••"
              />

              <Input
                label="Подтверждение пароля"
                type="password"
                {...register('confirmPassword', { 
                  required: 'Обязательное поле',
                  validate: value => value === password || 'Пароли не совпадают'
                })}
                error={errors.confirmPassword?.message}
                placeholder="••••••••"
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={loading}
              >
                Зарегистрироваться
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-eurobot-blue hover:underline font-medium">
                Войдите
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}



