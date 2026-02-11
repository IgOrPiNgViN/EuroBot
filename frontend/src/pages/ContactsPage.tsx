import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { contactsApi, ContactCreateData } from '../api/contacts'
import { useSettingsStore } from '../store/settingsStore'
import { useSmartCaptcha } from '../hooks/useSmartCaptcha'
import SEO from '../components/SEO'
import SmartCaptcha from '../components/ui/SmartCaptcha'
import YandexMap from '../components/YandexMap'
import Input from '../components/ui/Input'
import PhoneInput from '../components/ui/PhoneInput'
import Textarea from '../components/ui/Textarea'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import '../styles/pages/ContactsPage.css'

const topicOptions = [
  { value: 'technical', label: 'Технические вопросы' },
  { value: 'registration', label: 'Регистрация и участие' },
  { value: 'sponsorship', label: 'Спонсорство и партнерство' },
  { value: 'press', label: 'Пресса' },
  { value: 'other', label: 'Другое' }
]

export default function ContactsPage() {
  const { settings } = useSettingsStore()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const { isEnabled: captchaEnabled, resetCaptcha } = useSmartCaptcha()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactCreateData>()

  const contactEmails = settings.contact_emails as Record<string, string> | undefined

  const onSubmit = async (data: ContactCreateData) => {
    if (captchaEnabled && !captchaToken) {
      toast.error('Пожалуйста, пройдите проверку капчи')
      return
    }

    setSubmitting(true)
    try {
      await contactsApi.send({
        ...data,
        recaptcha_token: captchaToken || undefined
      })
      setSuccess(true)
      reset()
      setCaptchaToken(null)
      resetCaptcha()
      toast.success('Сообщение отправлено!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка при отправке')
      resetCaptcha()
    } finally {
      setSubmitting(false)
    }
  }

  return (
      <>
        <SEO
            title="Контакты"
            description="Свяжитесь с организаторами соревнований Евробот. Контактные данные и форма обратной связи."
            url="/contacts"
        />

        <div className="contacts-header">
          <div className="contacts-header-left">
            <h1 className="contacts-title">
              Контакты
            </h1>
            <p className="contacts-subtitle">
              Свяжитесь любым удобным способом
            </p>
          </div>
          <div className="contacts-header-right">
            <h1 className="contacts-title">
              Обратная связь
            </h1>
            <p className="contacts-subtitle">
              Заполните форму для быстрого ответа
            </p>
          </div>
        </div>

        <section className="contacts-content">
          <div className="contacts-container">
            <div className="contacts-grid">
              <div className="contacts-info-column">
                {contactEmails &&
                    (contactEmails.technical || contactEmails.registration || contactEmails.sponsorship || contactEmails.press
                        || contactEmails.general) && (
                        <div className="contacts-emails">
                          {contactEmails.technical && (
                              <div className="contacts-email-item">
                                <EnvelopeIcon className="contacts-email-icon" />
                                <div>
                                  <h3 className="contacts-email-title">Технические вопросы</h3>
                                  <a href={`mailto:${contactEmails.technical}`} className="contacts-email-link">
                                    {contactEmails.technical}
                                  </a>
                                  <p className="contacts-email-description">
                                    Вопросы по правилам, полю, роботам
                                  </p>
                                </div>
                              </div>
                          )}

                          {contactEmails.registration && (
                              <div className="contacts-email-item">
                                <EnvelopeIcon className="contacts-email-icon" />
                                <div>
                                  <h3 className="contacts-email-title">Регистрация и участие</h3>
                                  <a href={`mailto:${contactEmails.registration}`} className="contacts-email-link">
                                    {contactEmails.registration}
                                  </a>
                                  <p className="contacts-email-description">
                                    Регистрация команд, организационные вопросы
                                  </p>
                                </div>
                              </div>
                          )}

                          {contactEmails.sponsorship && (
                              <div className="contacts-email-item">
                                <EnvelopeIcon className="contacts-email-icon" />
                                <div>
                                  <h3 className="contacts-email-title">Спонсорство и партнерство</h3>
                                  <a href={`mailto:${contactEmails.sponsorship}`} className="contacts-email-link">
                                    {contactEmails.sponsorship}
                                  </a>
                                  <p className="contacts-email-description">
                                    Сотрудничество, спонсорские предложения
                                  </p>
                                </div>
                              </div>
                          )}

                          {contactEmails.press && (
                              <div className="contacts-email-item">
                                <EnvelopeIcon className="contacts-email-icon" />
                                <div>
                                  <h3 className="contacts-email-title">Пресса</h3>
                                  <a href={`mailto:${contactEmails.press}`} className="contacts-email-link">
                                    {contactEmails.press}
                                  </a>
                                  <p className="contacts-email-description">
                                    Запросы от СМИ, аккредитация
                                  </p>
                                </div>
                              </div>
                          )}

                          {contactEmails.general && (
                              <div className="contacts-email-item">
                                <EnvelopeIcon className="contacts-email-icon" />
                                <div>
                                  <h3 className="contacts-email-title">Общие вопросы</h3>
                                  <a href={`mailto:${contactEmails.general}`} className="contacts-email-link">
                                    {contactEmails.general}
                                  </a>
                                  <p className="contacts-email-description">
                                    Для любых вопросов
                                  </p>
                                </div>
                              </div>
                          )}
                        </div>
                    )}

                <div className="contacts-contact-info">
                  <div className="contacts-email-item">
                    <MapPinIcon className="contacts-contact-icon" />
                    <div>
                      <h3 className="contacts-contact-title">Адрес</h3>
                      <p className="contacts-contact-text">
                        Москва, ул. Косыгина, 17, корп. 1.
                      </p>
                    </div>
                  </div>

                  <div className="contacts-email-item">
                    <PhoneIcon className="contacts-contact-icon" />
                    <div>
                      <h3 className="contacts-contact-title">Телефон</h3>
                      <a href="tel:+74951234567" className="contacts-contact-link">
                        +7 (495) 123-45-67
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="contacts-form-column">
                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="contacts-success-card"
                    >
                      <CheckCircleIcon className="contacts-success-icon" />
                      <h3 className="contacts-success-title">Сообщение отправлено!</h3>
                      <p className="contacts-success-text">
                        Мы ответим вам в ближайшее время
                      </p>
                      <Button onClick={() => setSuccess(false)} variant="outline">
                        Отправить ещё
                      </Button>
                    </motion.div>
                ) : (
                    <div className="contacts-form-card">
                      <form onSubmit={handleSubmit(onSubmit)} className="contacts-form">
                        <Input
                            label="Ваше имя"
                            {...register('name', { required: 'Обязательное поле' })}
                            error={errors.name?.message}
                            placeholder="Иван Иванов"
                        />

                        <div className="contacts-form-grid">
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
                              label="Телефон (необязательно)"
                              {...register('phone')}
                          />
                        </div>

                        <Select
                            label="Тема обращения"
                            options={topicOptions}
                            {...register('topic', { required: 'Обязательное поле' })}
                            error={errors.topic?.message}
                            placeholder="Выберите тему"
                        />

                        <Textarea
                            label="Сообщение"
                            rows={5}
                            {...register('message', {
                              required: 'Обязательное поле',
                              minLength: { value: 10, message: 'Минимум 10 символов' }
                            })}
                            error={errors.message?.message}
                            placeholder="Опишите ваш вопрос..."
                        />

                        <SmartCaptcha
                            onVerify={(token) => setCaptchaToken(token)}
                            className="contacts-captcha"
                        />

                        <Button
                            type="submit"
                            className="contacts-submit-button"
                            isLoading={submitting}
                        >
                          Отправить сообщение
                        </Button>
                      </form>
                    </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="contacts-map-section">
          <YandexMap
              center={[55.7025, 37.5547]}
              zoom={16}
              markers={[
                {
                  coordinates: [55.7025, 37.5547],
                  title: 'EUROBOT Россия',
                  description: 'ул. Косыгина, 17, корп. 1, Москва'
                }
              ]}
              height="400px"
          />
        </section>
      </>
  )
}