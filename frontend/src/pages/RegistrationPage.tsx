import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { teamsApi, TeamRegisterData } from '../api/teams'
import { seasonsApi } from '../api/seasons'
import { Season, RegistrationField } from '../types'
import { useSmartCaptcha } from '../hooks/useSmartCaptcha'
import SmartCaptcha from '../components/ui/SmartCaptcha'
import SEO from '../components/SEO'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Input from '../components/ui/Input'
import PhoneInput from '../components/ui/PhoneInput'
import Button from '../components/ui/Button'
import Textarea from '../components/ui/Textarea'

interface RegistrationFormData {
  name: string
  email: string
  phone: string
  organization: string
  region: string
  participants_count: number
  league: 'junior' | 'senior'
  rules_accepted: boolean
  [key: string]: unknown // Для динамических полей
}

export default function RegistrationPage() {
  const navigate = useNavigate()
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [customFields, setCustomFields] = useState<RegistrationField[]>([])
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
        // Загружаем активные кастомные поля
        if (season?.registration_fields) {
          const activeFields = season.registration_fields
            .filter(f => f.is_active)
            .sort((a, b) => a.display_order - b.display_order)
          setCustomFields(activeFields)
        }
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

    // Собираем кастомные поля
    const customFieldsData: Record<string, unknown> = {}
    customFields.forEach(field => {
      if (data[field.name] !== undefined && data[field.name] !== '') {
        customFieldsData[field.name] = data[field.name]
      }
    })

    setSubmitting(true)
    try {
      await teamsApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        organization: data.organization,
        region: data.region,
        participants_count: data.participants_count,
        league: data.league,
        rules_accepted: data.rules_accepted,
        season_id: currentSeason.id,
        custom_fields: Object.keys(customFieldsData).length > 0 ? customFieldsData : undefined,
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

  // Рендер кастомного поля
  const renderCustomField = (field: RegistrationField) => {
    const fieldProps = {
      ...register(field.name, { required: field.is_required ? 'Обязательное поле' : false }),
    }

    switch (field.field_type) {
      case 'text':
        return (
          <Input
            key={field.id}
            label={field.label}
            {...fieldProps}
            error={(errors as Record<string, { message?: string }>)[field.name]?.message}
            required={field.is_required}
          />
        )
      case 'email':
        return (
          <Input
            key={field.id}
            label={field.label}
            type="email"
            {...register(field.name, { 
              required: field.is_required ? 'Обязательное поле' : false,
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Некорректный email'
              }
            })}
            error={(errors as Record<string, { message?: string }>)[field.name]?.message}
            required={field.is_required}
          />
        )
      case 'phone':
        return (
          <PhoneInput
            key={field.id}
            label={field.label}
            {...fieldProps}
            error={(errors as Record<string, { message?: string }>)[field.name]?.message}
            required={field.is_required}
          />
        )
      case 'number':
        return (
          <Input
            key={field.id}
            label={field.label}
            type="number"
            {...fieldProps}
            error={(errors as Record<string, { message?: string }>)[field.name]?.message}
            required={field.is_required}
          />
        )
      case 'textarea':
        return (
          <Textarea
            key={field.id}
            label={field.label}
            {...fieldProps}
            error={(errors as Record<string, { message?: string }>)[field.name]?.message}
            required={field.is_required}
          />
        )
      case 'url':
        return (
          <Input
            key={field.id}
            label={field.label}
            type="url"
            {...fieldProps}
            error={(errors as Record<string, { message?: string }>)[field.name]?.message}
            placeholder="https://..."
            required={field.is_required}
          />
        )
      case 'select':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <select
              {...fieldProps}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eurobot-blue focus:border-transparent"
            >
              <option value="">Выберите...</option>
              {(field.options as string[] || []).map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
            {(errors as Record<string, { message?: string }>)[field.name] && (
              <p className="mt-1 text-sm text-red-500">
                {(errors as Record<string, { message?: string }>)[field.name]?.message}
              </p>
            )}
          </div>
        )
      case 'checkbox':
        return (
          <div key={field.id} className="flex items-start">
            <input
              type="checkbox"
              id={field.name}
              {...fieldProps}
              className="mt-1 h-4 w-4 text-eurobot-blue border-gray-300 rounded focus:ring-eurobot-blue"
            />
            <label htmlFor={field.name} className="ml-2 text-sm text-gray-700">
              {field.label} {field.is_required && <span className="text-red-500">*</span>}
            </label>
          </div>
        )
      case 'date':
        return (
          <Input
            key={field.id}
            label={field.label}
            type="date"
            {...fieldProps}
            error={(errors as Record<string, { message?: string }>)[field.name]?.message}
            required={field.is_required}
          />
        )
      default:
        return (
          <Input
            key={field.id}
            label={field.label}
            {...fieldProps}
            error={(errors as Record<string, { message?: string }>)[field.name]?.message}
            required={field.is_required}
          />
        )
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

                {/* League selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Лига <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('league', { required: 'Выберите лигу' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eurobot-blue focus:border-transparent"
                  >
                    <option value="">Выберите лигу</option>
                    <option value="junior">Junior (младшая лига)</option>
                    <option value="senior">Senior (основная лига)</option>
                  </select>
                  {errors.league && (
                    <p className="mt-1 text-sm text-red-500">{errors.league.message}</p>
                  )}
                </div>

                {/* Rules acceptance */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="rules_accepted"
                    {...register('rules_accepted', { required: 'Необходимо принять правила' })}
                    className="mt-1 h-4 w-4 text-eurobot-blue border-gray-300 rounded focus:ring-eurobot-blue"
                  />
                  <label htmlFor="rules_accepted" className="ml-2 text-sm text-gray-700">
                    Я ознакомился с <a href="/competitions" target="_blank" className="text-eurobot-blue hover:underline">правилами соревнований</a> и принимаю их <span className="text-red-500">*</span>
                  </label>
                </div>
                {errors.rules_accepted && (
                  <p className="text-sm text-red-500">{errors.rules_accepted.message}</p>
                )}

                {/* Dynamic custom fields from admin */}
                {customFields.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Дополнительная информация
                    </h3>
                    <div className="space-y-4">
                      {customFields.map(field => renderCustomField(field))}
                    </div>
                  </div>
                )}

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



