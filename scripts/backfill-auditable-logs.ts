/**
 * Backfill Script for Auditable Logging Migration
 * 
 * This script backfills existing incident_logs with auditable logging fields
 * Run after executing the database migration
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface IncidentLog {
  id: string
  timestamp: string
  callsign_from: string
  time_of_occurrence?: string
  time_logged?: string
  entry_type?: string
  logged_by_callsign?: string
}

async function backfillAuditableLogging() {
  console.log('🚀 Starting Auditable Logging Backfill...\n')

  try {
    // Step 1: Check if migration has been run
    console.log('1️⃣  Checking if migration has been run...')
    const { data: columnCheck } = await supabase
      .from('incident_logs')
      .select('time_of_occurrence')
      .limit(1)

    if (!columnCheck) {
      console.error('❌ Migration has not been run. Please run the database migration first.')
      console.error('   Execute: database/auditable_logging_phase1_migration.sql')
      process.exit(1)
    }
    console.log('✅ Migration columns detected\n')

    // Step 2: Get all incident logs that need backfilling
    console.log('2️⃣  Fetching incident logs to backfill...')
    const { data: logs, error: fetchError } = await supabase
      .from('incident_logs')
      .select('id, timestamp, callsign_from, time_of_occurrence, time_logged, entry_type, logged_by_callsign')
      .is('time_of_occurrence', null)
      .order('timestamp', { ascending: true })

    if (fetchError) {
      throw new Error(`Failed to fetch logs: ${fetchError.message}`)
    }

    if (!logs || logs.length === 0) {
      console.log('✅ No logs need backfilling. All logs already have auditable fields.\n')
      return
    }

    console.log(`   Found ${logs.length} logs to backfill\n`)

    // Step 3: Backfill each log
    console.log('3️⃣  Backfilling logs...')
    let successCount = 0
    let errorCount = 0

    for (const log of logs) {
      try {
        const updateData: Partial<IncidentLog> = {
          time_of_occurrence: log.timestamp,
          time_logged: log.timestamp,
          entry_type: 'contemporaneous',
          logged_by_callsign: log.callsign_from || 'Unknown'
        }

        const { error: updateError } = await supabase
          .from('incident_logs')
          .update(updateData)
          .eq('id', log.id)

        if (updateError) {
          console.error(`   ❌ Error updating log ${log.id}: ${updateError.message}`)
          errorCount++
        } else {
          successCount++
          if (successCount % 100 === 0) {
            console.log(`   ✅ Backfilled ${successCount} logs...`)
          }
        }
      } catch (err: any) {
        console.error(`   ❌ Error processing log ${log.id}: ${err.message}`)
        errorCount++
      }
    }

    console.log(`\n✅ Backfill complete:`)
    console.log(`   - Successfully backfilled: ${successCount} logs`)
    if (errorCount > 0) {
      console.log(`   - Errors: ${errorCount} logs`)
    }

    // Step 4: Verification
    console.log('\n4️⃣  Running verification...')
    const { count: nullCount } = await supabase
      .from('incident_logs')
      .select('*', { count: 'exact', head: true })
      .is('time_of_occurrence', null)

    if (nullCount && nullCount > 0) {
      console.warn(`⚠️  Warning: ${nullCount} logs still have NULL time_of_occurrence`)
    } else {
      console.log('✅ All logs have been successfully backfilled')
    }

    // Step 5: Display summary statistics
    console.log('\n5️⃣  Summary Statistics:')
    const { data: stats } = await supabase
      .from('incident_logs')
      .select('entry_type')

    if (stats) {
      const entryTypes = stats.reduce((acc, log) => {
        acc[log.entry_type || 'unknown'] = (acc[log.entry_type || 'unknown'] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log('\n   Entry Type Distribution:')
      Object.entries(entryTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`)
      })
    }

    const { count: amendedCount } = await supabase
      .from('incident_logs')
      .select('*', { count: 'exact', head: true })
      .eq('is_amended', true)

    console.log(`\n   Amended Logs: ${amendedCount || 0}`)

    const { count: revisionCount } = await supabase
      .from('incident_log_revisions')
      .select('*', { count: 'exact', head: true })

    console.log(`   Total Revisions: ${revisionCount || 0}`)

    console.log('\n✅ Backfill script completed successfully!\n')
  } catch (error: any) {
    console.error('\n❌ Backfill failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the backfill
backfillAuditableLogging()
  .then(() => {
    console.log('🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })

