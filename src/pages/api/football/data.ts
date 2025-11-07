import { NextApiRequest, NextApiResponse } from 'next';
import { getMergedFootballData } from '@/lib/football/manualStore';
import { syncMatchFlowToStore, getEventMetadata } from '@/lib/football/matchFlowSync';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get current event ID from query params or fetch it
      const eventId = req.query.event_id as string;
      
      // Check if Supabase is configured
      if (!supabase) {
        console.warn('Supabase not configured, returning manualStore data only');
        const data = getMergedFootballData();
        return res.status(200).json({ data });
      }
      
      if (!eventId) {
        // Try to get current event
        try {
          const { data: currentEvent, error: eventError } = await supabase
            .from('events')
            .select('id')
            .eq('is_current', true)
            .single();
          
          if (eventError || !currentEvent?.id) {
            // Fallback to manualStore only if no event
            const data = getMergedFootballData();
            return res.status(200).json({ data });
          }
          
          // Sync match flow data for current event
          try {
            const metadata = await getEventMetadata(currentEvent.id);
            await syncMatchFlowToStore(
              currentEvent.id,
              metadata?.homeTeam,
              metadata?.awayTeam,
              metadata?.competition
            );
          } catch (syncError) {
            console.error('Error syncing match flow for current event:', syncError);
            // Continue with manualStore data
          }
        } catch (error) {
          console.error('Error fetching current event:', error);
          // Fallback to manualStore only on error
          const data = getMergedFootballData();
          return res.status(200).json({ data });
        }
      } else {
        // Sync match flow data for specified event
        try {
          const metadata = await getEventMetadata(eventId);
          await syncMatchFlowToStore(
            eventId,
            metadata?.homeTeam,
            metadata?.awayTeam,
            metadata?.competition
          );
        } catch (syncError) {
          console.error('Error syncing match flow for specified event:', syncError);
          // Continue with manualStore data
        }
      }
      
      // Return merged data (manualStore + database match flow)
      const data = getMergedFootballData();
      res.status(200).json({ data });
    } catch (error) {
      console.error('Error in football data API:', error);
      // Always return data, even on error, to prevent frontend crashes
      try {
        const data = getMergedFootballData();
        res.status(200).json({ data });
      } catch (fallbackError) {
        console.error('Error getting fallback data:', fallbackError);
        res.status(500).json({ error: 'Failed to load football data' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
