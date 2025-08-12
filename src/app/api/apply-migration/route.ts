import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'database', 'incident_assignment_escalation_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec', {
          sql: statement + ';'
        });

        if (error) {
          console.error('Error executing migration statement:', error);
          console.error('Statement:', statement);
          return NextResponse.json({ 
            error: 'Migration failed', 
            details: error.message,
            statement: statement.substring(0, 100) + '...'
          }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ 
      message: 'Migration applied successfully',
      statementsExecuted: statements.length
    });

  } catch (error) {
    console.error('Error applying migration:', error);
    return NextResponse.json({ 
      error: 'Failed to apply migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
