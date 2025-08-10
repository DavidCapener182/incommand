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

    const { subscription, payload, targetUsers, notificationType } = req.body;

    // Validate payload
    if (!payload || !payload.title || !payload.body) {
      return res.status(400).json({ error: 'Invalid notification payload' });
    }

    let subscriptions: any[] = [];

    if (subscription) {
      // Send to specific subscription (for testing)
      subscriptions = [subscription];
    } else if (targetUsers) {
      // Send to specific users
      const { data: userSubscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', targetUsers);

      if (subError) {
        console.error('Error fetching user subscriptions:', subError);
        return res.status(500).json({ error: 'Failed to fetch subscriptions' });
      }

      subscriptions = userSubscriptions || [];
    } else {
      // Send to all active subscriptions (for broadcast)
      const { data: allSubscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('active', true);

      if (subError) {
        console.error('Error fetching all subscriptions:', subError);
        return res.status(500).json({ error: 'Failed to fetch subscriptions' });
      }

      subscriptions = allSubscriptions || [];
    }

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found' });
    }

    // Prepare notification payload
    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon.png',
      badge: payload.badge || '/icon.png',
      image: payload.image,
      tag: payload.tag || notificationType || 'default',
      data: {
        url: payload.data?.url || '/dashboard',
        type: notificationType || 'general',
        timestamp: Date.now(),
        ...payload.data
      },
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || false,
      renotify: payload.renotify || false,
      silent: payload.silent || false,
      vibrate: payload.vibrate || [200, 100, 200]
    };

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(notificationPayload)
          );

          return { success: true, subscriptionId: sub.id };
        } catch (error: any) {
          console.error('Failed to send notification to subscription:', sub.id, error);
          
          // If subscription is invalid, mark it as inactive
          if (error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .update({ active: false })
              .eq('id', sub.id);
          }

          return { success: false, subscriptionId: sub.id, error: error.message };
        }
      })
    );

    // Process results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    // Log notification to database
    await supabase
      .from('notification_logs')
      .insert({
        user_id: user.id,
        type: notificationType || 'general',
        title: payload.title,
        body: payload.body,
        target_count: subscriptions.length,
        sent_count: successful,
        failed_count: failed,
        payload: notificationPayload,
        created_at: new Date().toISOString()
      });

    console.log(`Push notification sent: ${successful} successful, ${failed} failed`);

    return res.status(200).json({
      message: 'Notifications sent',
      results: {
        total: subscriptions.length,
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('Send push notification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to send incident notifications
export async function sendIncidentNotification(incidentData: any, targetUsers?: string[]) {
  const payload = {
    title: `New Incident: ${incidentData.type}`,
    body: incidentData.description || 'A new incident has been reported',
    icon: '/icon.png',
    tag: 'incident',
    data: {
      url: `/incidents/${incidentData.id}`,
      type: 'incident',
      incidentId: incidentData.id
    },
    actions: [
      {
        action: 'view',
        title: 'View Incident'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: incidentData.severity === 'high'
  };

  const response = await fetch('/api/notifications/send-push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload,
      targetUsers,
      notificationType: 'incident'
    })
  });

  return response.json();
}

// Helper function to send system notifications
export async function sendSystemNotification(title: string, body: string, targetUsers?: string[]) {
  const payload = {
    title,
    body,
    icon: '/icon.png',
    tag: 'system',
    data: {
      url: '/dashboard',
      type: 'system'
    }
  };

  const response = await fetch('/api/notifications/send-push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload,
      targetUsers,
      notificationType: 'system'
    })
  });

  return response.json();
}
