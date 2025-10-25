#!/usr/bin/env node

/**
 * Dependency Cleanup Script for InCommand
 * Removes unused dependencies and optimizes package.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('🧹 InCommand Dependency Cleanup\n');

// Read current package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

// Dependencies to remove (confirmed unused by depcheck)
const unusedDependencies = [
  '@emotion/react',
  '@emotion/styled', 
  '@mui/material',
  '@radix-ui/react-icons',
  '@radix-ui/react-scroll-area',
  '@remixicon/react',
  '@tanstack/react-table',
  '@types/react-responsive',
  '@what3words/react-components',
  'buffer',
  'critters',
  'meshline',
  'motion',
  'patternomaly',
  'plotly.js-basic-dist',
  'plotly.js-dist',
  'react-bits',
  'react-hot-toast',
  'react-plotly.js',
  'react-resizable-panels',
  'react-responsive',
  'react-virtualized-auto-sizer',
  'sonner',
  'three',
  'weather-icons-react'
];

// Dev dependencies to remove
const unusedDevDependencies = [
  '@tailwindcss/line-clamp',
  '@testing-library/user-event',
  '@types/react-virtualized-auto-sizer',
  'autoprefixer',
  'dotenv-safe',
  'jest-environment-jsdom',
  'postcss',
  'shadcn'
];

console.log('📦 Removing unused dependencies...');

// Remove unused dependencies
unusedDependencies.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    delete packageJson.dependencies[dep];
    console.log(`✅ Removed: ${dep}`);
  }
});

// Remove unused dev dependencies
unusedDevDependencies.forEach(dep => {
  if (packageJson.devDependencies[dep]) {
    delete packageJson.devDependencies[dep];
    console.log(`✅ Removed dev: ${dep}`);
  }
});

// Add missing dependencies
const missingDependencies = {
  '@jest/globals': '^30.0.0'
};

Object.entries(missingDependencies).forEach(([dep, version]) => {
  if (!packageJson.devDependencies[dep]) {
    packageJson.devDependencies[dep] = version;
    console.log(`✅ Added missing: ${dep}@${version}`);
  }
});

// Update scripts for better dependency management
packageJson.scripts = {
  ...packageJson.scripts,
  'deps:audit': 'npm audit',
  'deps:check': 'npx depcheck',
  'deps:update': 'npm update',
  'deps:clean': 'npm prune',
  'deps:install': 'npm ci --only=production',
  'build:analyze': 'npm run build && npx @next/bundle-analyzer .next/static/chunks/*.js'
};

// Write updated package.json
writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

console.log('\n🔧 Updated package.json with:');
console.log('- Removed unused dependencies');
console.log('- Added missing dependencies');
console.log('- Enhanced scripts for dependency management');

console.log('\n📋 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm audit fix');
console.log('3. Run: npm run deps:check');
console.log('4. Test build: npm run build');

console.log('\n🎯 Dependency cleanup complete!');
