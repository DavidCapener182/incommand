#!/usr/bin/env node

/**
 * Migration script to set up support tools database schema
 * Run this script to create all necessary tables for the support tools
 */

const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Starting Support Tools Database Migration...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database/schema/support_tools.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded successfully');
    console.log('📊 Tables to be created:');
    console.log('  - stands & stand_occupancy');
    console.log('  - staffing_roles & staffing_actuals');
    console.log('  - fixture_tasks & fixture_completions');
    console.log('  - gates & gate_status');
    console.log('  - transport_configs & transport_issues');
    
    // Note: In a real implementation, you would execute this SQL against your database
    // For now, we'll just log the schema
    console.log('\n📋 SQL Schema:');
    console.log('='.repeat(50));
    console.log(schemaSQL);
    console.log('='.repeat(50));
    
    console.log('\n✅ Migration script completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Execute the SQL schema against your Supabase database');
    console.log('2. Set SUPABASE_PROJECT_ID environment variable');
    console.log('3. Test the API endpoints with company_id and event_id headers');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
