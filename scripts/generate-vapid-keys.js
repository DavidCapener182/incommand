#!/usr/bin/env node

/**
 * Script to generate VAPID keys for push notifications
 * 
 * Usage:
 *   node scripts/generate-vapid-keys.js
 * 
 * This will generate a public and private VAPID key pair
 * that can be used for push notifications.
 */

const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for push notifications...\n');

try {
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('✅ VAPID keys generated successfully!\n');
  
  console.log('📋 Add these to your environment variables:\n');
  console.log('For .env.local (development):');
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  console.log('');
  
  console.log('For production deployment:');
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY: ' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY: ' + vapidKeys.privateKey);
  console.log('');
  
  console.log('⚠️  Important:');
  console.log('- Keep the private key secure and never expose it to the client');
  console.log('- Use different keys for development, staging, and production');
  console.log('- Store private keys in secure environment variable management systems');
  console.log('');
  
  console.log('📚 Next steps:');
  console.log('1. Add the environment variables to your .env.local file');
  console.log('2. Restart your development server');
  console.log('3. Run the database migration: database/push_subscriptions_migration.sql');
  console.log('4. Test push notifications in the app');
  
} catch (error) {
  console.error('❌ Error generating VAPID keys:', error.message);
  console.log('');
  console.log('Make sure you have the web-push library installed:');
  console.log('npm install web-push');
  process.exit(1);
}
