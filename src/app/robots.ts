import { MetadataRoute } from 'next'
import { siteUrl } from '@/config/seo.config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { 
      userAgent: '*', 
      allow: '/' 
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
