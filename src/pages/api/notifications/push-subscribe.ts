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

    const { endpoint, p256dh, auth, device_type, browser } = req.body;

    // Validate required fields
    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate endpoint format
    if (!endpoint.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid endpoint format' });
    }

    // Check for existing subscription
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .single();

    const subscriptionData = {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      device_type: device_type || 'unknown',
      browser: browser || 'unknown',
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingSubscription) {
      // Update existing subscription
      result = await supabase
        .from('push_subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);
    } else {
      // Create new subscription
      result = await supabase
        .from('push_subscriptions')
        .insert([subscriptionData]);
    }

    if (result.error) {
      console.error('Database error:', result.error);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    console.log('Push subscription saved:', {
      userId: user.id,
      endpoint,
      deviceType: device_type,
      browser
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });

  } catch (error) {
    console.error('Push subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
