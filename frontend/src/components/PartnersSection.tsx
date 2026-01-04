import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { partnersApi } from '../api/partners'
import { Partner, PartnerCategory } from '../types'

const categoryNames: Record<PartnerCategory, string> = {
  general: 'Генеральный партнёр',
  official: 'Официальные партнёры',
  technology: 'Технологические партнёры',
  educational: 'Образовательные партнёры',
  media: 'СМИ партнёры'
}

const categoryOrder: PartnerCategory[] = ['general', 'official', 'technology', 'educational', 'media']

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

  // Check if there are any partners
  const hasPartners = Object.values(partners).some(arr => arr.length > 0)
  if (!hasPartners) return null

  return (
    <section className="bg-gray-50 py-16">
      <div className="container-custom">
        <h2 className="section-title text-center mb-12">Наши партнёры</h2>

        {categoryOrder.map((category) => {
          const categoryPartners = partners[category]
          if (!categoryPartners || categoryPartners.length === 0) return null

          return (
            <div key={category} className="mb-10 last:mb-0">
              <h3 className="text-lg font-semibold text-eurobot-blue mb-6 text-center">
                {categoryNames[category]}
              </h3>
              
              <div className={`flex flex-wrap justify-center items-center gap-8 ${
                category === 'general' ? 'gap-12' : ''
              }`}>
                {categoryPartners.map((partner, index) => (
                  <motion.a
                    key={partner.id}
                    href={partner.website || '#'}
                    target={partner.website ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`block grayscale hover:grayscale-0 transition-all duration-300 flex items-center justify-center ${
                      category === 'general' ? 'w-48 h-24' : 'w-32 h-16'
                    }`}
                    title={partner.name}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="hidden items-center justify-center w-full h-full bg-gray-100 rounded-lg text-xs text-gray-500 text-center p-2"
                    >
                      {partner.name}
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}



