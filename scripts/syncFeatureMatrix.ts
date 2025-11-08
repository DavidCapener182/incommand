/**
 * Feature Matrix Sync Script
 * Syncs FEATURE_MATRIX configuration to Supabase subscription_plans table
 * Updates the plan_features JSON column for each tier
 * 
 * Usage:
 *   npx tsx scripts/syncFeatureMatrix.ts
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_KEY - Your Supabase service role key (for admin access)
 */

import { createClient } from '@supabase/supabase-js'
import { FEATURE_MATRIX, getPlanFeatures, FeatureKey } from '../src/config/FeatureMatrix'
import { PlanCode } from '../src/config/PricingConfig'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗')
  console.error('\nPlease set these in your .env file or environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function syncFeatureMatrix() {
  console.log('🔄 Starting feature matrix sync...\n')

  const plans: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']
  let successCount = 0
  let errorCount = 0

  for (const planCode of plans) {
    try {
      // Get all feature keys for this plan
      const featureKeys = getPlanFeatures(planCode)
      
      // Get current plan from database
      const { data: plan, error: fetchError } = await supabase
        .from('subscription_plans')
        .select('code, features')
        .eq('code', planCode)
        .single()

      if (fetchError) {
        console.error(`❌ Error fetching plan ${planCode}:`, fetchError.message)
        errorCount++
        continue
      }

      if (!plan) {
        console.warn(`⚠️  Plan ${planCode} not found in database, skipping...`)
        errorCount++
        continue
      }

      // Update features JSONB with feature keys array
      // Preserve existing feature structure but add plan_features array
      const currentFeatures = plan.features || {}
      const updatedFeatures = {
        ...currentFeatures,
        plan_features: featureKeys, // Array of feature keys
        feature_count: featureKeys.length,
        last_synced: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('subscription_plans')
        .update({ 
          features: updatedFeatures,
          updated_at: new Date().toISOString(),
        })
        .eq('code', planCode)

      if (updateError) {
        console.error(`❌ Error updating plan ${planCode}:`, updateError.message)
        errorCount++
        continue
      }

      console.log(`✅ ${planCode.padEnd(12)} → ${featureKeys.length} features synced`)
      successCount++
    } catch (error: any) {
      console.error(`❌ Unexpected error for plan ${planCode}:`, error.message)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successfully synced: ${successCount} plans`)
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} plans`)
  }
  console.log('='.repeat(50))

  // Display summary
  console.log('\n📊 Feature Summary by Plan:')
  plans.forEach((planCode) => {
    const features = getPlanFeatures(planCode)
    console.log(`   ${planCode.padEnd(12)}: ${features.length} features`)
  })

  console.log('\n✨ Feature matrix sync complete!')
}

// Run the sync
syncFeatureMatrix()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })



