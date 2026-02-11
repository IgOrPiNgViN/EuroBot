import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { partnersApi } from '../api/partners'
import { Partner, PartnerCategory } from '../types'
import '../styles/components/PartnersSection.css'

const categoryNames: Record<PartnerCategory, string> = {
  general: 'Генеральные партнёры',
  official: 'Официальные партнёры',
  technology: 'Технологические партнёры',
  educational: 'Образовательные партнёры',
  media: 'СМИ партнёры'
}

const categoryOrder: PartnerCategory[] = ['official', 'technology', 'educational', 'media']

const getPartnerLogoAndBackground = (partner: Partner) => {
  if (partner.category === 'general' && partner.logo.includes('|')) {
    const [logo, background] = partner.logo.split('|').map(s => s.trim())
    return { logo, background }
  }
  return { logo: partner.logo, background: undefined }
}

export default function PartnersSection() {
  const [partners, setPartners] = useState<Record<PartnerCategory, Partner[]> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const data = await partnersApi.getGrouped()
        setPartners(data)
      } catch (error) {
        console.error('Failed to fetch partners:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPartners()
  }, [])

  if (loading || !partners) return null

  const hasPartners = Object.values(partners).some(arr => arr.length > 0)
  if (!hasPartners) return null

  const generalPartners = partners.general || []
  const hasOtherPartners = categoryOrder.some(cat => partners[cat]?.length > 0)

  return (
    <>
      {/* Other partner categories in the light section */}
      {hasOtherPartners && (
        <section className="partners-section">
          <div className="partners-container">
            <h2 className="partners-title">Наши партнёры</h2>
            <h3 className="partners-description">
              Ежегодно соревнования EUROBOT RUSSIA получают поддержку множества технологических компаний
            </h3>

            {categoryOrder.map((category) => {
              const categoryPartners = partners[category]
              if (!categoryPartners || categoryPartners.length === 0) return null

              return (
                <div key={category} className="partners-category">
                  <h3 className="partners-category-title">
                    {categoryNames[category]}
                  </h3>

                  <div className="partners-grid">
                    {categoryPartners.map((partner, index) => (
                      <motion.div
                        key={partner.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="partner-item partner-item-regular"
                      >
                        <a
                          href={partner.website || '#'}
                          target={partner.website ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="partner-link"
                          title={partner.name}
                        >
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="partner-logo"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="partner-fallback">
                            {partner.name}
                          </div>
                        </a>
                        <div className="partner-item-title">
                          {partner.name}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* General partners — full-width sections with background */}
      {generalPartners.map((partner) => {
        const { logo, background } = getPartnerLogoAndBackground(partner)

        return (
          <section key={partner.id} className="general-partner-section">
            {background && (
              <div
                className="general-partner-bg"
                style={{ backgroundImage: `url(${background})` }}
              />
            )}
            <div className="general-partner-overlay" />
            <motion.div
              className="general-partner-content"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <a
                href={partner.website || '#'}
                target={partner.website ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="general-partner-link"
              >
                <img
                  src={logo}
                  alt={partner.name}
                  className="general-partner-logo"
                />
              </a>
              <h2 className="general-partner-title">ГЕНЕРАЛЬНЫЙ ПАРТНЁР</h2>
            </motion.div>
          </section>
        )
      })}
    </>
  )
}
