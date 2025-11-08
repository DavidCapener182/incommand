import { MetadataRoute } from 'next'
import { siteUrl } from '@/config/seo.config'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { 
      url: `${siteUrl}/`, 
      lastModified: new Date(), 
      changeFrequency: 'weekly', 
      priority: 1.0 
    },
    { 
      url: `${siteUrl}/login`, 
      lastModified: new Date(), 
      changeFrequency: 'monthly', 
      priority: 0.6 
    },
    { 
      url: `${siteUrl}/signup`, 
      lastModified: new Date(), 
      changeFrequency: 'monthly', 
      priority: 0.6 
    },
    { 
      url: `${siteUrl}/help`, 
      lastModified: new Date(), 
      changeFrequency: 'monthly', 
      priority: 0.4 
    }
  ]
}
