import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useForm, useFieldArray } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { CheckCircleIcon, UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { teamsApi, TeamRegisterData, TeamMemberData } from '../api/teams'
import { seasonsApi } from '../api/seasons'
import { Season } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Input from '../components/ui/Input'
import PhoneInput from '../components/ui/PhoneInput'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'

const leagueOptions = [
  { value: 'junior', label: 'Юниоры (до 18 лет)' },
  { value: 'senior', label: 'Основная лига (18+)' }
]

interface RegistrationFormData extends Omit<TeamRegisterData, 'members'> {
  captain_name: string
  curator_name: string
  members: TeamMemberData[]
}

export default function RegistrationPage() {
  const navigate = useNavigate()
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<RegistrationFormData>({
    defaultValues: {
      members: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members'
  })

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

    // Build members array with captain, curator, and other members
    const allMembers: TeamMemberData[] = [
      {
        full_name: data.captain_name,
        role: 'Капитан'
      },
      {
        full_name: data.curator_name,
        role: 'Куратор'
      },
      ...data.members.map(m => ({
        full_name: m.full_name,
        role: 'Участник'
      }))
    ]

    setSubmitting(true)
    try {
      await teamsApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        organization: data.organization,
        city: data.city,
        region: data.region,
        participants_count: allMembers.length,
        league: data.league,
        poster_link: data.poster_link,
        rules_accepted: data.rules_accepted,
        season_id: currentSeason.id,
        members: allMembers
      })
      setSuccess(true)
      toast.success('Команда успешно зарегистрирована!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при регистрации')
    } finally {
      setSubmitting(false)
    }
  }

  const addMember = () => {
    if (fields.length < 8) { // Max 10 total - 2 (captain + curator)
      append({ full_name: '', role: 'Участник', email: '', phone: '' })
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!currentSeason || !currentSeason.registration_open) {
    return (
      <>
        <Helmet>
          <title>Регистрация — Евробот Россия</title>
        </Helmet>

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
        <Helmet>
          <title>Регистрация успешна — Евробот Россия</title>
        </Helmet>

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
      <Helmet>
        <title>Регистрация команды — Евробот Россия</title>
        <meta name="description" content="Зарегистрируйте свою команду для участия в соревнованиях Евробот." />
      </Helmet>

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

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Город"
                    {...register('city', { required: 'Обязательное поле' })}
                    error={errors.city?.message}
                    placeholder="Город"
                    required
                  />
                  <Input
                    label="Регион"
                    {...register('region', { required: 'Обязательное поле' })}
                    error={errors.region?.message}
                    placeholder="Область / Край"
                    required
                  />
                </div>

                {/* League */}
                <Select
                  label="Лига"
                  options={leagueOptions}
                  {...register('league', { required: 'Обязательное поле' })}
                  error={errors.league?.message}
                  placeholder="Выберите лигу"
                  required
                />

                {/* Captain & Curator */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-eurobot-navy mb-4">
                    👥 Руководство команды
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="ФИО капитана"
                      {...register('captain_name', { required: 'Обязательное поле' })}
                      error={errors.captain_name?.message}
                      placeholder="Иванов Иван Иванович"
                      required
                    />
                    <Input
                      label="ФИО куратора / наставника"
                      {...register('curator_name', { required: 'Обязательное поле' })}
                      error={errors.curator_name?.message}
                      placeholder="Петров Пётр Петрович"
                      required
                    />
                  </div>
                </div>

                {/* Team Members */}
                <div className="border-t pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-eurobot-navy">
                      👥 Участники команды
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMember}
                      disabled={fields.length >= 8}
                      leftIcon={<UserPlusIcon className="w-4 h-4" />}
                    >
                      Добавить участника
                    </Button>
                  </div>
                  
                  {fields.length === 0 && (
                    <p className="text-gray-500 text-sm mb-4">
                      Добавьте участников команды (помимо капитана и куратора)
                    </p>
                  )}

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <Input
                            {...register(`members.${index}.full_name`, { required: 'Обязательное поле' })}
                            error={errors.members?.[index]?.full_name?.message}
                            placeholder="ФИО участника"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">
                    Всего участников: {fields.length + 2} (включая капитана и куратора)
                  </p>
                </div>

                {/* Poster link */}
                <div className="border-t pt-6 mt-6">
                  <Input
                    label="Ссылка на технический плакат"
                    type="url"
                    {...register('poster_link', { required: 'Обязательное поле' })}
                    error={errors.poster_link?.message}
                    placeholder="https://drive.google.com/..."
                    helperText="Ссылка на облачное хранилище с плакатом команды"
                    required
                  />
                </div>

                {/* Rules acceptance */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="rules_accepted"
                    className="mt-1 mr-3"
                    {...register('rules_accepted', { required: 'Необходимо принять правила' })}
                  />
                  <label htmlFor="rules_accepted" className="text-sm text-gray-600">
                    Я подтверждаю, что ознакомился с{' '}
                    <a href="/competitions" className="text-eurobot-blue hover:underline">
                      правилами соревнований
                    </a>{' '}
                    и принимаю их *
                  </label>
                </div>
                {errors.rules_accepted && (
                  <p className="text-sm text-red-500 -mt-4">{errors.rules_accepted.message}</p>
                )}

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



