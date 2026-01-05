import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { teamsApi, TeamRegisterData } from '../api/teams'
import { seasonsApi } from '../api/seasons'
import { Season } from '../types'
import { useSmartCaptcha } from '../hooks/useSmartCaptcha'
import SmartCaptcha from '../components/ui/SmartCaptcha'
import SEO from '../components/SEO'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Input from '../components/ui/Input'
import PhoneInput from '../components/ui/PhoneInput'
import Button from '../components/ui/Button'

interface RegistrationFormData {
  name: string
  email: string
  phone: string
  organization: string
  region: string
  participants_count: number
}

export default function RegistrationPage() {
  const navigate = useNavigate()
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const { isEnabled: captchaEnabled, resetCaptcha } = useSmartCaptcha()

  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormData>()

  useEffect(() => {
    const fetchSeason = async () => {
      try {
        const season = await seasonsApi.getCurrent()
        setCurrentSeason(season)
      } catch (error) {
        console.error('Failed to fetch season:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSeason()
  }, [])

  const onSubmit = async (data: RegistrationFormData) => {
    if (!currentSeason) return

    // Check captcha if enabled
    if (captchaEnabled && !captchaToken) {
      toast.error('Пожалуйста, пройдите проверку капчи')
      return
    }

    setSubmitting(true)
    try {
      await teamsApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        organization: data.organization,
        region: data.region,
        participants_count: data.participants_count,
        season_id: currentSeason.id,
        recaptcha_token: captchaToken || undefined
      } as TeamRegisterData)
      setSuccess(true)
      toast.success('Команда успешно зарегистрирована!')
      resetCaptcha()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при регистрации')
      resetCaptcha()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!currentSeason || !currentSeason.registration_open) {
    return (
      <>
        <SEO
          title="Регистрация"
          description="Регистрация команды на соревнования Евробот закрыта."
          url="/registration"
        />

        <div className="bg-eurobot-navy py-16">
          <div className="container-custom">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">
              Регистрация команды
            </h1>
          </div>
        </div>

        <div className="container-custom py-20 text-center">
          <p className="text-gray-500 text-lg mb-4">
            Регистрация на соревнования в данный момент закрыта
          </p>
          <p className="text-gray-400">
            Следите за новостями, чтобы не пропустить открытие регистрации
          </p>
        </div>
      </>
    )
  }

  if (success) {
    return (
      <>
        <SEO
          title="Регистрация успешна"
          description="Ваша команда успешно зарегистрирована на соревнования Евробот."
          url="/registration"
        />

        <div className="container-custom py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-heading font-bold text-eurobot-navy mb-4">
              Регистрация успешна!
            </h1>
            <p className="text-gray-600 mb-8">
              Ваша заявка на участие в {currentSeason.name} принята. 
              Мы отправили подтверждение на указанный email.
            </p>
            <Button onClick={() => navigate('/')}>
              Вернуться на главную
            </Button>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title="Регистрация команды"
        description={`Зарегистрируйте свою команду для участия в ${currentSeason.name}. Онлайн-регистрация на соревнования Евробот.`}
        url="/registration"
      />

      <div className="bg-eurobot-navy py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            Регистрация команды
          </h1>
          <p className="text-gray-300 text-lg">
            {currentSeason.name}
          </p>
        </div>
      </div>

      <section className="py-12">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Team name */}
                <Input
                  label="Название команды"
                  {...register('name', { required: 'Обязательное поле' })}
                  error={errors.name?.message}
                  placeholder="Введите название команды"
                  required
                />

                {/* Contact info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email команды"
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
                    required
                  />
                  <PhoneInput
                    label="Телефон"
                    {...register('phone', { required: 'Обязательное поле' })}
                    error={errors.phone?.message}
                    required
                  />
                </div>

                {/* Organization */}
                <Input
                  label="Организация / Школа / Университет"
                  {...register('organization', { required: 'Обязательное поле' })}
                  error={errors.organization?.message}
                  placeholder="Название учебного заведения"
                  required
                />

                {/* Region */}
                <Input
                  label="Регион"
                  {...register('region', { required: 'Обязательное поле' })}
                  error={errors.region?.message}
                  placeholder="Область / Край / Республика"
                  required
                />

                {/* Participants count */}
                <Input
                  label="Количество участников"
                  type="number"
                  {...register('participants_count', { 
                    required: 'Обязательное поле',
                    min: { value: 1, message: 'Минимум 1 участник' },
                    max: { value: 20, message: 'Максимум 20 участников' }
                  })}
                  error={errors.participants_count?.message}
                  placeholder="Например: 5"
                  required
                />

                {/* Yandex SmartCaptcha */}
                <SmartCaptcha
                  onVerify={(token) => setCaptchaToken(token)}
                  className="mt-4"
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={submitting}
                >
                  Зарегистрировать команду
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}



