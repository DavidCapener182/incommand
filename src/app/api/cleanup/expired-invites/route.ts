import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredInvites } from '@/lib/cleanupExpiredInvites';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Simple API key validation (in production, use proper authentication)
const CLEANUP_API_KEY = process.env.CLEANUP_API_KEY || 'incommand-cleanup-2024';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (apiKey !== CLEANUP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting expired invites cleanup', {
      component: 'CleanupAPI',
      action: 'startCleanup'
    });

    await cleanupExpiredInvites();

    logger.info('Expired invites cleanup completed', {
      component: 'CleanupAPI',
      action: 'completeCleanup'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup completed successfully' 
    });

  } catch (error) {
    logger.error('Error during cleanup', error, {
      component: 'CleanupAPI',
      action: 'cleanup'
    });
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

// Allow GET for health checks
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    message: 'Cleanup endpoint is operational' 
  });
}
