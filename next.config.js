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
  
  // Bundle optimization - aggressive code splitting
  webpack: (config, { dev, isServer }) => {
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
    } else {
      // Client-side optimizations for better code splitting
      if (!dev) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              default: false,
              vendors: false,
              // Vendor chunk for node_modules
              vendor: {
                name: 'vendor',
                chunks: 'all',
                test: /[\\/]node_modules[\\/]/,
                priority: 20,
              },
              // Separate chunk for heavy libraries
              chartjs: {
                name: 'chartjs',
                test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|chartjs-)[\\/]/,
                chunks: 'all',
                priority: 30,
              },
              framerMotion: {
                name: 'framer-motion',
                test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
                chunks: 'all',
                priority: 30,
              },
              three: {
                name: 'three',
                test: /[\\/]node_modules[\\/](three|ogl)[\\/]/,
                chunks: 'all',
                priority: 30,
              },
              // Common chunk for shared code
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 10,
                reuseExistingChunk: true,
              },
            },
          },
        };
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
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images
        source: '/:path*\\.(jpg|jpeg|png|gif|webp|avif|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache fonts
        source: '/:path*\\.(woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
