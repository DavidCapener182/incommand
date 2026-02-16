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
  
  // Keep webpack customization minimal so Next can optimize chunking per route.
  webpack: (config, { isServer }) => {
    // Mark optional DOCX parsing dependencies as externals to prevent build errors
    // These are only needed if DOCX support is required
    if (isServer) {
      // Always mark these as externals - they'll be required at runtime if available
      // This prevents webpack from trying to bundle them at build time
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'pizzip': 'commonjs pizzip',
          'docxtemplater': 'commonjs docxtemplater',
        })
      }
    }
    return config;
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600, // Increased from 60 to 3600 seconds (1 hour)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Security and performance headers
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production'
    const staticAssetCacheControl = isProduction
      ? 'public, max-age=31536000, immutable'
      : 'no-store, no-cache, must-revalidate'

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
      {
        // Cache static assets aggressively
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: staticAssetCacheControl,
          },
        ],
      },
      {
        // Cache images
        source: '/:path*\\.(jpg|jpeg|png|gif|webp|avif|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: staticAssetCacheControl,
          },
        ],
      },
      {
        // Cache fonts
        source: '/:path*\\.(woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: staticAssetCacheControl,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
