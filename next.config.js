/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build optimization
  swcMinify: true,
  compress: true,
  
  // Redirects for unified marketing page
  async redirects() {
    return [
      { source: '/features', destination: '/#features', permanent: true },
      { source: '/about', destination: '/#how-it-works', permanent: true },
      { source: '/pricing', destination: '/#pricing', permanent: true },
    ];
  },
  
  // Disable service workers in development
  ...(process.env.NODE_ENV === 'development' && {
    async rewrites() {
      return [
        {
          source: '/sw.js',
          destination: '/api/disable-sw'
        },
        {
          source: '/sw-enhanced.js',
          destination: '/api/disable-sw'
        },
        // Fix incorrect /next/ paths - redirect to correct /_next/ paths
        {
          source: '/next/:path*',
          destination: '/_next/:path*'
        }
      ]
    }
  }),
  
  // Performance optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', 'react-icons']
  },
  
  // Bundle optimization - let Next.js handle vendor chunking by default
  webpack: (config, { dev, isServer }) => {
    // Don't override Next.js's default vendor chunking in development
    // Next.js handles vendor chunks automatically
    return config;
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
