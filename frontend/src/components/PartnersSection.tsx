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

const categoryOrder: PartnerCategory[] = ['general', 'official', 'technology', 'educational', 'media']

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

  return (
      <section className="partners-section">
        <div className="partners-container">
          <h2 className="partners-title">Наши партнёры</h2>
          <h3 className="partners-description">Ежегодно соревнования EUROBOT RUSSIA получают поддержку множества технологических компаний </h3>

          {categoryOrder.map((category) => {
            const categoryPartners = partners[category]
            if (!categoryPartners || categoryPartners.length === 0) return null

            return (
                <div key={category} className="partners-category">
                  <h3 className="partners-category-title">
                    {categoryNames[category]}
                  </h3>

                  <div className={`partners-grid ${category === 'general' ? 'partners-grid-general' : ''}`}>
                    {categoryPartners.map((partner, index) => {
                      const { logo, background } = getPartnerLogoAndBackground(partner)

                      return (
                          <motion.div
                              key={partner.id}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              viewport={{ once: true }}
                              className={`partner-item ${category === 'general' ? 'partner-item-general' : 'partner-item-regular'}`}
                          >
                            {background && category === 'general' && (
                                <div
                                    className="partner-background"
                                    style={{ backgroundImage: `url(${background})` }}
                                />
                            )}

                            <a
                                href={partner.website || '#'}
                                target={partner.website ? '_blank' : undefined}
                                rel="noopener noreferrer"
                                className={`partner-link ${background && category === 'general' ? 'partner-link-with-bg' : ''}`}
                                title={partner.name}
                            >
                              <img
                                  src={logo}
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
                            <div
                                className="partner-item-title"
                                style={{ color: background && category === 'general' ? 'white' : '#0f3d63' }}
                            >
                              {partner.name}
                            </div>
                          </motion.div>
                      )
                    })}
                  </div>
                </div>
            )
          })}
        </div>
      </section>
  )
}