import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';
import { getServiceClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const supabase = getServiceClient();
    // Get current event
    const { data, error } = await supabase
      .from('events')
      .select('id, event_name, event_type, venue_name, venue_address')
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      logger.error('Failed to fetch current event', error, { endpoint: '/api/get-current-event' });
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      logger.warn('No current event found', { endpoint: '/api/get-current-event' });
      return res.status(404).json({ error: 'No current event found' });
    }
    
    logger.info('Current event fetched successfully', { 
      eventId: data.id, 
      eventName: data.event_name,
      endpoint: '/api/get-current-event' 
    });
    
    return res.status(200).json({ event: data });
  } catch (error) {
    logger.error('Unexpected error in get-current-event', error, { endpoint: '/api/get-current-event' });
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
