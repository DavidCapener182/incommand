#!/usr/bin/env node

/**
 * Dependency Validation Script for InCommand
 * Validates no dev-only packages leak into production
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('🔍 InCommand Dependency Validation\n');

// Read current package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

console.log('📦 Validating dependency separation...');

// Check for dev dependencies in production
const devDependencies = Object.keys(packageJson.devDependencies || {});
const dependencies = Object.keys(packageJson.dependencies || {});

// Common dev-only packages that should never be in production
const devOnlyPackages = [
  '@types/',
  '@testing-library/',
  'jest',
  'eslint',
  'prettier',
  'typescript',
  'ts-node',
  'webpack',
  'rollup',
  'vite',
  'parcel',
  'babel',
  'autoprefixer',
  'postcss',
  'tailwindcss',
  'sass',
  'less',
  'stylus',
  'nodemon',
  'concurrently',
  'cross-env',
  'dotenv',
  'dotenv-safe'
];

// Check for problematic dependencies
const problematicDeps = [];
const warnings = [];

dependencies.forEach(dep => {
  // Check if dev-only package is in production dependencies
  if (devOnlyPackages.some(devPkg => dep.startsWith(devPkg))) {
    problematicDeps.push({
      package: dep,
      issue: 'Dev-only package in production dependencies',
      severity: 'error'
    });
  }
  
  // Check for heavy/unnecessary packages
  if (dep.includes('plotly') || dep.includes('three') || dep.includes('chart')) {
    warnings.push({
      package: dep,
      issue: 'Heavy visualization library - consider lazy loading',
      severity: 'warning'
    });
  }
});

// Check for missing production dependencies
const missingProdDeps = [];
if (!dependencies.includes('next')) {
  missingProdDeps.push('next');
}
if (!dependencies.includes('react')) {
  missingProdDeps.push('react');
}
if (!dependencies.includes('react-dom')) {
  missingProdDeps.push('react-dom');
}

console.log('🔍 Dependency Analysis Results:\n');

if (problematicDeps.length > 0) {
  console.log('❌ CRITICAL ISSUES:');
  problematicDeps.forEach(dep => {
    console.log(`  - ${dep.package}: ${dep.issue}`);
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(warning => {
    console.log(`  - ${warning.package}: ${warning.issue}`);
  });
  console.log('');
}

if (missingProdDeps.length > 0) {
  console.log('📦 Missing Production Dependencies:');
  missingProdDeps.forEach(dep => {
    console.log(`  - ${dep}`);
  });
  console.log('');
}

// Create dependency validation report
const validationReport = {
  timestamp: new Date().toISOString(),
  totalDependencies: dependencies.length,
  totalDevDependencies: devDependencies.length,
  criticalIssues: problematicDeps.length,
  warnings: warnings.length,
  missingProdDeps: missingProdDeps.length,
  issues: [...problematicDeps, ...warnings],
  recommendations: []
};

// Add recommendations
if (problematicDeps.length === 0) {
  validationReport.recommendations.push('✅ No dev-only packages in production dependencies');
} else {
  validationReport.recommendations.push('❌ Move dev-only packages to devDependencies');
}

if (warnings.length > 0) {
  validationReport.recommendations.push('⚠️  Consider lazy loading heavy visualization libraries');
}

if (missingProdDeps.length === 0) {
  validationReport.recommendations.push('✅ All essential production dependencies present');
}

// Write validation report
writeFileSync('.reports/dependency-validation.json', JSON.stringify(validationReport, null, 2));
console.log('📊 Dependency validation report saved to .reports/dependency-validation.json');

// Create automated dependency check script
const automatedCheckScript = `#!/usr/bin/env node

/**
 * Automated Dependency Check
 * Runs on CI/CD to ensure dependency hygiene
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🤖 Automated Dependency Check\\n');

try {
  // Check for unused dependencies
  console.log('🔍 Checking for unused dependencies...');
  execSync('npx depcheck --json', { stdio: 'pipe' });
  console.log('✅ No unused dependencies found');
} catch (error) {
  console.log('⚠️  Unused dependencies detected');
  console.log(error.stdout?.toString() || '');
}

try {
  // Check for security vulnerabilities
  console.log('\\n🔒 Checking for security vulnerabilities...');
  execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
  console.log('✅ No security vulnerabilities found');
} catch (error) {
  console.log('❌ Security vulnerabilities detected');
  console.log(error.stdout?.toString() || '');
}

try {
  // Check for outdated dependencies
  console.log('\\n📅 Checking for outdated dependencies...');
  execSync('npm outdated', { stdio: 'pipe' });
  console.log('✅ All dependencies are up to date');
} catch (error) {
  console.log('⚠️  Outdated dependencies found');
  console.log(error.stdout?.toString() || '');
}

console.log('\\n🎯 Automated dependency check complete!');
`;

writeFileSync('scripts/automated-dependency-check.mjs', automatedCheckScript);
console.log('✅ Created automated dependency check script');

// Update package.json with validation scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'deps:validate': 'node scripts/dependency-validation.mjs',
  'deps:auto-check': 'node scripts/automated-dependency-check.mjs',
  'deps:ci-check': 'npm run deps:validate && npm run deps:auto-check'
};

writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

console.log('\n🎯 Dependency validation complete!');
console.log('\n📋 Summary:');
console.log(`- Total dependencies: ${dependencies.length}`);
console.log(`- Total dev dependencies: ${devDependencies.length}`);
console.log(`- Critical issues: ${problematicDeps.length}`);
console.log(`- Warnings: ${warnings.length}`);
console.log(`- Missing prod deps: ${missingProdDeps.length}`);

if (problematicDeps.length === 0 && missingProdDeps.length === 0) {
  console.log('\n✅ All dependency validations passed!');
} else {
  console.log('\n❌ Dependency issues found - please review and fix');
}

console.log('\n🚀 Next steps:');
console.log('1. Run: npm run deps:validate');
console.log('2. Run: npm run deps:auto-check');
console.log('3. Review: .reports/dependency-validation.json');
