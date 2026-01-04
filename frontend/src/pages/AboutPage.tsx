import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { 
  AcademicCapIcon, 
  LightBulbIcon, 
  UserGroupIcon, 
  GlobeAltIcon,
  TrophyIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import { useSettingsStore } from '../store/settingsStore'

const advantages = [
  {
    icon: LightBulbIcon,
    title: 'Практические навыки',
    description: 'Участники получают реальный опыт проектирования, программирования и механики'
  },
  {
    icon: UserGroupIcon,
    title: 'Командная работа',
    description: 'Развитие навыков коммуникации и совместной работы над сложными проектами'
  },
  {
    icon: GlobeAltIcon,
    title: 'Международный опыт',
    description: 'Возможность участия в международных соревнованиях и обмен опытом'
  },
  {
    icon: TrophyIcon,
    title: 'Признание',
    description: 'Призёры получают дипломы, сертификаты и ценные призы'
  },
  {
    icon: AcademicCapIcon,
    title: 'Образование',
    description: 'Подготовка к поступлению в технические вузы и будущей карьере'
  },
  {
    icon: RocketLaunchIcon,
    title: 'Вдохновение',
    description: 'Мотивация для изучения STEM-дисциплин и инноваций'
  }
]

export default function AboutPage() {
  const { settings } = useSettingsStore()
  
  const showAdvantages = settings.show_advantages !== 'false'
  const executiveCommittee = settings.executive_committee as Array<{name: string; role: string; photo?: string}> | undefined
  const expertCouncil = settings.expert_council as Array<{name: string; role: string; photo?: string}> | undefined

  return (
    <>
      <Helmet>
        <title>О Евробот — Евробот Россия</title>
        <meta name="description" content="История и цели соревнований Евробот. Узнайте о преимуществах участия и организационном комитете." />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-eurobot-navy to-eurobot-blue py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              О соревнованиях <span className="text-eurobot-gold">EUROBOT</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Международные соревнования по робототехнике для молодёжи, 
              развивающие инженерное мышление с 1998 года
            </p>
          </motion.div>
        </div>
      </section>

      {/* History */}
      <section className="py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="section-title">История EUROBOT</h2>
              <div className="prose prose-lg text-gray-600">
                {settings.about_history ? (
                  <div dangerouslySetInnerHTML={{ __html: settings.about_history as string }} />
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

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-100 rounded-2xl p-8"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-4xl font-bold text-eurobot-gold mb-2">1998</div>
                  <div className="text-gray-600">Год основания</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-4xl font-bold text-eurobot-gold mb-2">50+</div>
                  <div className="text-gray-600">Стран-участниц</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-4xl font-bold text-eurobot-gold mb-2">1000+</div>
                  <div className="text-gray-600">Команд ежегодно</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-4xl font-bold text-eurobot-gold mb-2">25+</div>
                  <div className="text-gray-600">Лет истории</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">Цели и задачи</h2>
          
          <div className="max-w-3xl mx-auto">
            {settings.about_goals ? (
              <div 
                className="prose prose-lg mx-auto text-gray-600"
                dangerouslySetInnerHTML={{ __html: settings.about_goals as string }} 
              />
            ) : (
              <div className="space-y-6 text-gray-600 text-lg">
                <p>
                  <strong className="text-eurobot-navy">Популяризация робототехники</strong> — 
                  привлечение молодёжи к изучению инженерных дисциплин через увлекательные 
                  соревнования.
                </p>
                <p>
                  <strong className="text-eurobot-navy">Развитие навыков</strong> — 
                  формирование практических умений в области механики, электроники, 
                  программирования и проектного управления.
                </p>
                <p>
                  <strong className="text-eurobot-navy">Командная работа</strong> — 
                  обучение эффективному взаимодействию в команде при решении 
                  сложных технических задач.
                </p>
                <p>
                  <strong className="text-eurobot-navy">Международное сотрудничество</strong> — 
                  создание площадки для обмена опытом и знаниями между участниками 
                  из разных стран.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Advantages */}
      {showAdvantages && (
        <section className="py-16">
          <div className="container-custom">
            <h2 className="section-title text-center">Преимущества участия</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {advantages.map((advantage, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-eurobot-gold/10 rounded-xl flex items-center justify-center mb-4">
                    <advantage.icon className="w-6 h-6 text-eurobot-gold" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{advantage.title}</h3>
                  <p className="text-gray-600 text-sm">{advantage.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Executive Committee */}
      {executiveCommittee && executiveCommittee.length > 0 && (
        <section className="py-16 bg-eurobot-navy text-white">
          <div className="container-custom">
            <h2 className="text-3xl font-heading font-bold text-center mb-12">
              Исполнительный комитет
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {executiveCommittee.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-white/10">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-eurobot-gold">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-gray-400 text-sm">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Expert Council */}
      {expertCouncil && expertCouncil.length > 0 && (
        <section className="py-16">
          <div className="container-custom">
            <h2 className="section-title text-center">Экспертный совет</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {expertCouncil.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card p-6 flex items-center space-x-4"
                >
                  <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-eurobot-blue">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-gray-500 text-sm">{member.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}



