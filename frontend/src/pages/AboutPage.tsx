import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useSettingsStore } from '../store/settingsStore'
import '../styles/pages/AboutPage.css'

interface CommitteeMember {
  id: number
  name: string
  position: string
  photo_url: string
}

interface Committee {
  id: number
  name: string
  description: string
  members: CommitteeMember[]
}

export default function AboutPage() {
  const { settings } = useSettingsStore()
  const [committees, setCommittees] = useState<Committee[]>([])

  useEffect(() => {
    if (settings.about_goals) {
      try {
        const parsed = JSON.parse(settings.about_goals as string)
        if (Array.isArray(parsed)) {
          setCommittees(parsed)
        }
      } catch (error) {
        console.error('Failed to parse committees:', error)
      }
    }
  }, [settings.about_goals])

  return (
      <>
        <Helmet>
          <title>О Евробот — Евробот Россия</title>
          <meta name="description" content="История и цели соревнований Евробот. Узнайте о преимуществах участия и организационном комитете." />
        </Helmet>

        <div className="about-hero">
          <div className="container-hero-about">
            <h1 className="about-hero-title">
              О соревнованиях EUROBOT
            </h1>
            <p className="about-hero-subtitle">
              Международные соревнования по робототехнике для молодёжи,
              развивающие инженерное мышление с 1998 года
            </p>
          </div>
        </div>

        <section className="about-history">
          <div className="container-custom-about">
            <div className="about-history-grid">
              <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
              >
                <h2 className="section-title">История EUROBOT</h2>
                <div className="about-prose">
                  {settings.about_history?.trim() ? (
                      <div dangerouslySetInnerHTML={{ __html: settings.about_history }} />
                  ) : (
                      <>
                        <p>
                          EUROBOT — это ежегодные международные соревнования по робототехнике,
                          основанные во Франции в 1998 году. За более чем 25 лет существования
                          конкурс объединил тысячи молодых инженеров из более чем 50 стран мира.
                        </p>
                        <p>
                          Россия присоединилась к соревнованиям в начале 2000-х годов, и с тех пор
                          российские команды неоднократно занимали призовые места на международных
                          этапах.
                        </p>
                        <p>
                          Каждый год организаторы предлагают новую тему соревнований, что делает
                          конкурс всегда актуальным и интересным для участников.
                        </p>
                      </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {committees.length > 0 && (
            <section className="about-committees">
              <div className="container-custom-about">
                {committees.map((committee, index) => (
                    <motion.div
                        key={committee.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="about-committee-card"
                    >
                      <div className="about-committee-header">
                        <h2 className="about-committee-name">{committee.name}</h2>
                      </div>

                      <div className="about-committee-description">
                        <p>{committee.description}</p>
                      </div>

                      <div className="about-committee-members">
                        <div className="about-members-grid">
                          {committee.members.map((member, memberIndex) => (
                              <div key={member.id} className="about-member-item">
                                <div className="about-member-photo-container">
                                  {member.photo_url ? (
                                      <img
                                          src={member.photo_url}
                                          alt={member.name}
                                          className="about-member-photo"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                          }}
                                      />
                                  ) : (
                                      <div className="about-member-placeholder">
                                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </div>
                                  )}
                                  <div className="about-member-photo-error hidden">
                                    Не удалось загрузить фото
                                  </div>
                                </div>
                                <div className="about-member-info">
                                  <h3 className="about-member-fullname">{member.name}</h3>
                                  <p className="about-member-position">{member.position}</p>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                ))}
              </div>
            </section>
        )}
      </>
  )
}