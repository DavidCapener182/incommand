import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export interface Incident {
  id: string;
  event_id: string;
  type: string;
  description: string;
  status: string;
  is_closed: boolean;
  callsigns: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  priority?: string;
  location?: string;
}

interface UseIncidentsReturn {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  deleteIncident: (id: string) => Promise<void>;
  refreshIncidents: () => Promise<void>;
}

export const useIncidents = (eventId: string): UseIncidentsReturn => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('incidents')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setIncidents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents');
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load incidents'
      });
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const updateIncident = useCallback(async (id: string, updates: Partial<Incident>) => {
    try {
      // Optimistic update
      setIncidents(prev => 
        prev.map(incident => 
          incident.id === id ? { ...incident, ...updates } : incident
        )
      );

      const { error: updateError } = await supabase
        .from('incidents')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        // Revert optimistic update on error
        await fetchIncidents();
        throw updateError;
      }

      addToast({
        type: 'success',
        title: 'Updated',
        message: 'Incident updated successfully'
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update incident'
      });
      throw err;
    }
  }, [fetchIncidents]);

  const deleteIncident = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setIncidents(prev => prev.filter(incident => incident.id !== id));

      const { error: deleteError } = await supabase
        .from('incidents')
        .delete()
        .eq('id', id);

      if (deleteError) {
        // Revert optimistic update on error
        await fetchIncidents();
        throw deleteError;
      }

      addToast({
        type: 'success',
        title: 'Deleted',
        message: 'Incident deleted successfully'
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete incident'
      });
      throw err;
    }
  }, [fetchIncidents]);

  const refreshIncidents = useCallback(async () => {
    await fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    fetchIncidents();

    // Set up real-time subscription
    const channel = supabase
      .channel(`incidents-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setIncidents(prev => [payload.new as Incident, ...prev]);
            addToast({
              type: 'success',
              title: 'New Incident',
              message: 'New incident created'
            });
          } else if (payload.eventType === 'UPDATE') {
            setIncidents(prev => 
              prev.map(incident => 
                incident.id === payload.new.id ? payload.new as Incident : incident
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setIncidents(prev => 
              prev.filter(incident => incident.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    updateIncident,
    deleteIncident,
    refreshIncidents
  };
};
