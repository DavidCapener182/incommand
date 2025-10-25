#!/usr/bin/env node

/**
 * Automated Dependency Check
 * Runs on CI/CD to ensure dependency hygiene
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🤖 Automated Dependency Check\n');

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
  console.log('\n🔒 Checking for security vulnerabilities...');
  execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
  console.log('✅ No security vulnerabilities found');
} catch (error) {
  console.log('❌ Security vulnerabilities detected');
  console.log(error.stdout?.toString() || '');
}

try {
  // Check for outdated dependencies
  console.log('\n📅 Checking for outdated dependencies...');
  execSync('npm outdated', { stdio: 'pipe' });
  console.log('✅ All dependencies are up to date');
} catch (error) {
  console.log('⚠️  Outdated dependencies found');
  console.log(error.stdout?.toString() || '');
}

console.log('\n🎯 Automated dependency check complete!');
