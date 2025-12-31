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

export const useIncidents = (eventId: string | null): UseIncidentsReturn => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchIncidents = useCallback(async () => {
    if (!eventId) {
      setIncidents([]);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('incident_logs')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const dataArray = (data || []) as any[];
      setIncidents(
        dataArray.map((incident: any) => ({
          id: String(incident.id ?? ''),
          event_id: incident.event_id || '',
          type: incident.incident_type || '',
          description: incident.occurrence || '',
          status: incident.status || 'open',
          is_closed: Boolean(incident.is_closed),
          callsigns: [incident.callsign_from, incident.callsign_to].filter(Boolean) as string[],
          created_at: incident.created_at || '',
          updated_at: incident.updated_at || '',
          created_by: incident.logged_by_user_id || '',
          priority: incident.priority || 'medium',
          location: String(incident.location ?? '')
        }))
      );
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
  }, [addToast, eventId]);

  const updateIncident = useCallback(async (id: string, updates: Partial<Incident>) => {
    try {
      // Optimistic update
      setIncidents(prev => 
        prev.map(incident => 
          incident.id === id ? { ...incident, ...updates } : incident
        )
      );

      const { error: updateError } = await (supabase as any)
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
  }, [addToast, fetchIncidents]);

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
  }, [addToast, fetchIncidents]);

  const refreshIncidents = useCallback(async () => {
    await fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    fetchIncidents();

    if (!eventId) {
      return;
    }

    // Set up real-time subscription
    const channel = supabase
      .channel(`incident_logs-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_logs',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newIncident = payload.new as any;
            const mappedIncident: Incident = {
              id: String(newIncident.id ?? ''),
              event_id: newIncident.event_id || '',
              type: newIncident.incident_type || '',
              description: newIncident.occurrence || '',
              status: newIncident.status || 'open',
              is_closed: Boolean(newIncident.is_closed),
              callsigns: [newIncident.callsign_from, newIncident.callsign_to].filter(Boolean) as string[],
              created_at: newIncident.created_at || '',
              updated_at: newIncident.updated_at || '',
              created_by: newIncident.logged_by_user_id || '',
              priority: newIncident.priority || 'medium',
              location: String(newIncident.location ?? '')
            };
            setIncidents(prev => [mappedIncident, ...prev]);
            addToast({
              type: 'success',
              title: 'New Incident',
              message: 'New incident created'
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedIncident = payload.new as any;
            const mappedIncident: Incident = {
              id: String(updatedIncident.id ?? ''),
              event_id: updatedIncident.event_id || '',
              type: updatedIncident.incident_type || '',
              description: updatedIncident.occurrence || '',
              status: updatedIncident.status || 'open',
              is_closed: Boolean(updatedIncident.is_closed),
              callsigns: [updatedIncident.callsign_from, updatedIncident.callsign_to].filter(Boolean) as string[],
              created_at: updatedIncident.created_at || '',
              updated_at: updatedIncident.updated_at || '',
              created_by: updatedIncident.logged_by_user_id || '',
              priority: updatedIncident.priority || 'medium',
              location: String(updatedIncident.location ?? '')
            };
            setIncidents(prev => 
              prev.map(incident => 
                incident.id === mappedIncident.id ? mappedIncident : incident
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = String((payload.old as any).id ?? '');
            setIncidents(prev => 
              prev.filter(incident => incident.id !== deletedId)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addToast, eventId, fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    updateIncident,
    deleteIncident,
    refreshIncidents
  };
};
