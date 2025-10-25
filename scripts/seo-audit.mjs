#!/usr/bin/env node

/**
 * Simple SEO audit script for InCommand
 * Checks for basic SEO requirements and accessibility
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const PAGES = ['/', '/features', '/pricing', '/about'];

console.log('🔍 InCommand SEO Audit\n');

// Check if required files exist
const requiredFiles = [
  'src/app/sitemap.ts',
  'src/app/robots.ts',
  'src/config/seo.config.ts'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

// Check for basic SEO elements
console.log('\n🔍 Checking SEO configuration...');

try {
  const seoConfig = readFileSync('src/config/seo.config.ts', 'utf8');
  
  const checks = [
    { name: 'Site URL defined', pattern: /export const siteUrl/ },
    { name: 'Default metadata', pattern: /export const defaultMetadata/ },
    { name: 'OpenGraph config', pattern: /openGraph:/ },
    { name: 'Twitter config', pattern: /twitter:/ },
    { name: 'Schema markup', pattern: /schemaMarkup/ },
    { name: 'Robots config', pattern: /robots:/ }
  ];

  checks.forEach(check => {
    if (check.pattern.test(seoConfig)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - Missing`);
    }
  });
} catch (error) {
  console.log('❌ Could not read SEO config file');
}

// Check for accessibility improvements
console.log('\n♿ Checking accessibility improvements...');

try {
  const layoutFile = readFileSync('src/app/layout.tsx', 'utf8');
  
  const a11yChecks = [
    { name: 'Skip link', pattern: /Skip to main content/ },
    { name: 'Lang attribute', pattern: /lang="en"/ },
    { name: 'Scroll smooth', pattern: /scroll-smooth/ }
  ];

  a11yChecks.forEach(check => {
    if (check.pattern.test(layoutFile)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - Missing`);
    }
  });
} catch (error) {
  console.log('❌ Could not read layout file');
}

// Check for ARIA landmarks
console.log('\n🏗️ Checking ARIA landmarks...');

try {
  const layoutWrapper = readFileSync('src/components/LayoutWrapper.tsx', 'utf8');
  
  if (layoutWrapper.includes('role="main"') && layoutWrapper.includes('id="main"')) {
    console.log('✅ Main landmark with ID');
  } else {
    console.log('❌ Main landmark missing or incomplete');
  }
} catch (error) {
  console.log('❌ Could not read LayoutWrapper');
}

try {
  const navigation = readFileSync('src/components/Navigation.tsx', 'utf8');
  
  if (navigation.includes('role="banner"')) {
    console.log('✅ Header landmark');
  } else {
    console.log('❌ Header landmark missing');
  }
} catch (error) {
  console.log('❌ Could not read Navigation');
}

try {
  const footer = readFileSync('src/components/FooterSimple.tsx', 'utf8');
  
  if (footer.includes('role="contentinfo"')) {
    console.log('✅ Footer landmark');
  } else {
    console.log('❌ Footer landmark missing');
  }
} catch (error) {
  console.log('❌ Could not read Footer');
}

console.log('\n🎯 SEO Audit Complete!');
console.log('\nNext steps:');
console.log('1. Run "npm run lighthouse:desktop" to test performance');
console.log('2. Test keyboard navigation with Tab/Shift+Tab');
console.log('3. Use screen reader to test accessibility');
console.log('4. Validate HTML with W3C validator');
console.log('5. Test with axe-core browser extension');
