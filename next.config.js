/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const nextConfig = {
  images: {
    domains: ['api.supabase.co'],
  },
  async headers() {
    if (!isProd) {
      // In development, send no security headers that could force HTTPS
      return []
    }

    return [
      {
        source: '/(.*)',
        headers: [
          // Keep HSTS only in production
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
