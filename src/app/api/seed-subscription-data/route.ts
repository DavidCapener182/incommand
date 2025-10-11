import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'

import { NextResponse } from 'next/server'


export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    console.log('Seeding subscription data...')

    // Sample subscription data
    const subscriptionData = [
      {
        service_name: 'Cursor Pro',
        cost: 20.00,
        billing_period: 'monthly',
        start_date: '2024-01-01',
        description: 'AI-powered code editor subscription'
      },
      {
        service_name: 'ChatGPT Plus',
        cost: 20.00,
        billing_period: 'monthly',
        start_date: '2024-01-01',
        description: 'OpenAI ChatGPT Plus subscription'
      },
      {
        service_name: 'GitHub Copilot',
        cost: 10.00,
        billing_period: 'monthly',
        start_date: '2024-01-01',
        description: 'AI pair programmer subscription'
      },
      {
        service_name: 'Perplexity Pro',
        cost: 20.00,
        billing_period: 'monthly',
        start_date: '2024-01-15',
        description: 'AI research assistant subscription'
      },
      {
        service_name: 'Claude Pro',
        cost: 20.00,
        billing_period: 'monthly',
        start_date: '2024-01-10',
        description: 'Anthropic Claude Pro subscription'
      }
    ];

    // Insert subscription data
    const { error: subscriptionError } = await supabase
      .from('subscription_costs')
      .insert(subscriptionData);

    if (subscriptionError) {
      console.error('Error inserting subscription data:', subscriptionError);
      throw subscriptionError;
    }

    console.log('Successfully seeded subscription data');

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription data seeded successfully',
      data: {
        subscriptions_added: subscriptionData.length
      }
    });

  } catch (error) {
    console.error('Error seeding subscription data:', error);
    return NextResponse.json({ 
      error: 'Failed to seed subscription data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
