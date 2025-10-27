#!/usr/bin/env node

/**
 * Clear Browser Cache Script
 * Helps clear browser cache and service workers that might be causing HTTPS redirects
 */

const { execSync } = require('child_process');
const os = require('os');

console.log('🧹 Clearing browser cache and service workers...\n');

// Clear Chrome cache (macOS)
if (os.platform() === 'darwin') {
  try {
    console.log('📱 Clearing Chrome cache...');
    execSync('rm -rf ~/Library/Caches/Google/Chrome/Default/Cache/*', { stdio: 'inherit' });
    execSync('rm -rf ~/Library/Application\\ Support/Google/Chrome/Default/Service\\ Worker/*', { stdio: 'inherit' });
    console.log('✅ Chrome cache cleared');
  } catch (error) {
    console.log('⚠️  Chrome cache clear failed (Chrome might be running)');
  }
}

// Clear Safari cache (macOS)
if (os.platform() === 'darwin') {
  try {
    console.log('🦁 Clearing Safari cache...');
    execSync('rm -rf ~/Library/Caches/com.apple.Safari/*', { stdio: 'inherit' });
    execSync('rm -rf ~/Library/Safari/LocalStorage/*', { stdio: 'inherit' });
    console.log('✅ Safari cache cleared');
  } catch (error) {
    console.log('⚠️  Safari cache clear failed');
  }
}

// Clear Firefox cache (macOS)
if (os.platform() === 'darwin') {
  try {
    console.log('🦊 Clearing Firefox cache...');
    execSync('rm -rf ~/Library/Caches/Firefox/*', { stdio: 'inherit' });
    console.log('✅ Firefox cache cleared');
  } catch (error) {
    console.log('⚠️  Firefox cache clear failed');
  }
}

console.log('\n🎯 Manual steps to complete:');
console.log('1. Close all browser windows');
console.log('2. Open Chrome DevTools (F12)');
console.log('3. Go to Application tab → Storage → Clear site data');
console.log('4. Or visit: chrome://settings/clearBrowserData');
console.log('5. Restart your development server: npm run dev');
console.log('\n✨ HTTPS redirect issue should be resolved!');
