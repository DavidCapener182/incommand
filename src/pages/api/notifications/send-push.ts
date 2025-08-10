import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import webpush from 'web-push';

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('VAPID keys not configured');
}

webpush.setVapidDetails(
  'mailto:admin@incommand.com',
  VAPID_PUBLIC_KEY!,
  VAPID_PRIVATE_KEY!
);

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

    const { userId, payload } = req.body;

    // Validate payload
    if (!payload || !payload.title || !payload.body) {
      return res.status(400).json({ error: 'Invalid notification payload' });
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId || user.id);

    if (subError) {
      console.error('Database error:', subError);
      return res.status(500).json({ error: 'Failed to get subscriptions' });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No push subscriptions found for user' });
    }

    // Send notifications to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          const notificationPayload = {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon.png',
            badge: payload.badge || '/icon.png',
            image: payload.image,
            tag: payload.tag || 'default',
            data: payload.data || {},
            actions: payload.actions || [],
            requireInteraction: payload.requireInteraction || false,
            renotify: payload.renotify || false,
            silent: payload.silent || false,
            vibrate: payload.vibrate || [200, 100, 200]
          };

          const result = await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(notificationPayload)
          );

          console.log('Push notification sent successfully:', {
            userId: subscription.user_id,
            endpoint: subscription.endpoint,
            statusCode: result.statusCode
          });

          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          console.error('Failed to send push notification:', error);
          
          // If subscription is invalid, remove it
          if (error instanceof Error && error.message.includes('410')) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
            
            console.log('Removed invalid subscription:', subscription.id);
          }

          return { success: false, subscriptionId: subscription.id, error: error.message };
        }
      })
    );

    // Count successful and failed notifications
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;

    console.log('Push notification batch completed:', {
      total: results.length,
      successful,
      failed
    });

    return res.status(200).json({
      success: true,
      message: 'Push notifications sent',
      results: {
        total: results.length,
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('Send push notification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
