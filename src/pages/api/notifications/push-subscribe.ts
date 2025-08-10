import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subscription, deviceInfo } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Validate subscription data
    if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription keys' });
    }

    // Prepare subscription data
    const subscriptionData = {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      device_type: deviceInfo?.deviceType || 'unknown',
      browser: deviceInfo?.browser || 'unknown',
      user_agent: req.headers['user-agent'] || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          user_id: user.id,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          device_type: subscriptionData.device_type,
          browser: subscriptionData.browser,
          user_agent: subscriptionData.user_agent,
          updated_at: new Date().toISOString()
        })
        .eq('endpoint', subscription.endpoint);

      if (updateError) {
        console.error('Error updating push subscription:', updateError);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }

      console.log('Push subscription updated for user:', user.id);
      return res.status(200).json({ message: 'Subscription updated successfully' });
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert(subscriptionData);

      if (insertError) {
        console.error('Error creating push subscription:', insertError);
        return res.status(500).json({ error: 'Failed to create subscription' });
      }

      console.log('Push subscription created for user:', user.id);
      return res.status(201).json({ message: 'Subscription created successfully' });
    }
  } catch (error) {
    console.error('Push subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
