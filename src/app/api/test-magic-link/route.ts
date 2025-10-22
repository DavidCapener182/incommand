import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();

    // Generate a simple magic link
    const { data: magicLink, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/incidents`
      }
    });

    if (linkError || !magicLink) {
      logger.error('Failed to generate test magic link', linkError, {
        component: 'TestMagicLinkAPI',
        action: 'generateTestMagicLink',
        email
      });
      return NextResponse.json({ error: 'Failed to generate magic link' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      magic_link: magicLink.properties.action_link,
      message: 'Test magic link generated successfully'
    });

  } catch (error: any) {
    logger.error('Error in test magic link', error, {
      component: 'TestMagicLinkAPI',
      action: 'testMagicLink'
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
