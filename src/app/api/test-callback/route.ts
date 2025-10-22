import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    logger.info('Test callback received', {
      component: 'TestCallbackAPI',
      action: 'testCallback',
      url: request.url
    });

    const supabase = createRouteHandlerClient({ cookies });

    // Get user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.error('No user in test callback', userError, {
        component: 'TestCallbackAPI',
        action: 'getUser'
      });
      return NextResponse.json({ 
        success: false, 
        error: 'No user found',
        userError: userError?.message 
      });
    }

    logger.info('User found in test callback', {
      component: 'TestCallbackAPI',
      action: 'userFound',
      userId: user.id,
      email: user.email
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      }
    });

  } catch (error: any) {
    logger.error('Error in test callback', error, {
      component: 'TestCallbackAPI',
      action: 'testCallback'
    });
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    });
  }
}
