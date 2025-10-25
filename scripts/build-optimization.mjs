#!/usr/bin/env node

/**
 * Build Optimization Script for InCommand
 * Optimizes build scripts, CI caching, and production builds
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 InCommand Build Optimization\n');

// Read current package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

console.log('📦 Optimizing build scripts...');

// Enhanced build scripts for better performance
const optimizedScripts = {
  ...packageJson.scripts,
  
  // Production builds
  'build:prod': 'NODE_ENV=production next build',
  'build:analyze': 'ANALYZE=true next build',
  'build:clean': 'rm -rf .next && npm run build',
  
  // Development optimization
  'dev:fast': 'next dev --turbo',
  'dev:debug': 'NODE_OPTIONS="--inspect" next dev',
  
  // Dependency management
  'deps:audit': 'npm audit',
  'deps:check': 'npx depcheck',
  'deps:update': 'npm update',
  'deps:clean': 'npm prune',
  'deps:install': 'npm ci --only=production',
  'deps:security': 'npm audit --audit-level moderate',
  
  // Build analysis
  'build:size': 'npm run build && npx @next/bundle-analyzer .next/static/chunks/*.js',
  'build:lighthouse': 'npm run build && npm run lighthouse:desktop',
  
  // CI/CD optimization
  'ci:install': 'npm ci --prefer-offline --no-audit',
  'ci:build': 'npm run ci:install && npm run build:prod',
  'ci:test': 'npm run ci:install && npm run test',
  
  // Production optimization
  'start:prod': 'NODE_ENV=production next start',
  'start:cluster': 'NODE_ENV=production next start -p 3000',
  
  // Health checks
  'health:check': 'curl -f http://localhost:3000/api/health || exit 1',
  'health:build': 'npm run build && npm run health:check'
};

// Update package.json with optimized scripts
packageJson.scripts = optimizedScripts;

// Add build optimization configurations
packageJson.engines = {
  node: '>=18.0.0',
  npm: '>=8.0.0'
};

// Add build optimization metadata
packageJson.buildOptimization = {
  bundleAnalyzer: true,
  treeShaking: true,
  codeSplitting: true,
  compression: true,
  caching: true
};

// Write updated package.json
writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

console.log('✅ Enhanced build scripts:');
console.log('- Production builds with environment optimization');
console.log('- Development builds with Turbo mode');
console.log('- Dependency management scripts');
console.log('- CI/CD optimization');
console.log('- Health check scripts');

// Create .npmrc for build optimization
const npmrcContent = `# Build optimization
cache-max=86400000
prefer-offline=true
audit-level=moderate
fund=false
save-exact=true
engine-strict=true

# CI/CD optimization
ci=true
`;

writeFileSync('.npmrc', npmrcContent);
console.log('✅ Created .npmrc with build optimizations');

// Create next.config.js optimization
const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build optimization
  swcMinify: true,
  compress: true,
  
  // Performance optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react']
  },
  
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production client-side optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\\\/]node_modules[\\\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
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
        source: '/(.*)',
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
`;

writeFileSync('next.config.js', nextConfigContent);
console.log('✅ Optimized next.config.js for performance');

// Create Docker optimization
const dockerfileContent = `# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
`;

writeFileSync('Dockerfile', dockerfileContent);
console.log('✅ Created optimized Dockerfile');

// Create .dockerignore
const dockerignoreContent = `node_modules
.next
.git
.gitignore
README.md
.env
.env.local
.env.production.local
.env.development.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.tsbuildinfo
coverage
.nyc_output
`;

writeFileSync('.dockerignore', dockerignoreContent);
console.log('✅ Created .dockerignore for optimized builds');

console.log('\n🎯 Build optimization complete!');
console.log('\n📋 Next steps:');
console.log('1. Test build: npm run build:prod');
console.log('2. Analyze bundle: npm run build:analyze');
console.log('3. Test health: npm run health:check');
console.log('4. Run security audit: npm run deps:security');

console.log('\n🚀 Performance improvements:');
console.log('- SWC minification enabled');
console.log('- Bundle splitting optimized');
console.log('- Image optimization configured');
console.log('- Security headers added');
console.log('- Docker multi-stage builds');
console.log('- CI/CD optimizations');
