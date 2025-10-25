import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabaseServer';

export interface RecentAction {
  id: string;
  type: 'incident' | 'user_action' | 'system' | 'audit';
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  link?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = getServiceClient();
    // Always limit to 5 notifications max
    const limit = 5;
    const actions: RecentAction[] = [];
    
    // Get lastViewed timestamp from query params (used to filter out already seen notifications)
    const lastViewed = req.query.lastViewed as string;
    const lastViewedDate = lastViewed ? new Date(lastViewed) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago

    // Get the current event ID (similar to how IncidentTable does it)
    const { data: currentEvent } = await supabase
      .from('events')
      .select('id')
      .eq('is_current', true)
      .maybeSingle();

    if (!currentEvent) {
      console.log('🔍 No current event found');
      return res.status(200).json({
        actions: [],
        total: 0,
        hasMore: false
      });
    }

    console.log('🔍 Current event ID:', currentEvent.id);

    // Get recent incidents for the current event that are newer than lastViewed
    // Exclude attendance incidents from notifications and limit to most recent
    const { data: incidents, error: incidentsError } = await supabase
      .from('incident_logs')
      .select(
        'id, incident_type, log_number, occurrence, timestamp, is_closed, logged_by_user_id'
      )
      .eq('event_id', currentEvent.id)
      .neq('incident_type', 'Attendance')  // Exclude attendance incidents
      .gt('timestamp', lastViewedDate.toISOString()) // Only get incidents newer than last viewed
      .order('timestamp', { ascending: false })
      .limit(limit * 2); // Get more to account for filtering

    const profileIds = new Set<string>();

    if (incidentsError) {
      console.error('Error fetching incidents:', incidentsError);
    } else if (incidents) {
      incidents.forEach(incident => {
        const isHighPriority = [
          'Ejection', 'Code Green', 'Code Black', 'Code Pink', 'Aggressive Behaviour',
          'Missing Child/Person', 'Hostile Act', 'Counter-Terror Alert', 'Fire Alarm',
          'Evacuation', 'Medical', 'Suspicious Behaviour'
        ].includes(incident.incident_type);

        const contributingUserId = incident.logged_by_user_id;
        if (contributingUserId) {
          profileIds.add(contributingUserId);
        }

        actions.push({
          id: `incident-${incident.id}`,
          type: 'incident',
          icon: getIncidentIcon(incident.incident_type),
          title: `${incident.incident_type} ${incident.is_closed ? '(Closed)' : ''}`,
          description: `Log ${incident.log_number}: ${incident.occurrence.substring(0, 80)}${incident.occurrence.length > 80 ? '...' : ''}`,
          timestamp: incident.timestamp,
          userId: contributingUserId ?? undefined,
          priority: isHighPriority ? 'high' : 'medium',
          link: `/incidents#${incident.id}`
        });
      });
    }

    // Get recent audit logs (if they exist) that are newer than lastViewed
    try {
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          table_name,
          record_id,
          created_at,
          performed_by
        `)
        .gt('created_at', lastViewedDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(Math.min(limit, 10));

      if (auditError) {
        // Table doesn't exist or other error - just skip audit logs
        console.warn('Audit logs not available:', auditError.message);
      } else if (auditLogs) {
        auditLogs.forEach(log => {
          if (log.performed_by) {
            profileIds.add(log.performed_by);
          }
          actions.push({
            id: `audit-${log.id}`,
            type: 'audit',
            icon: getAuditIcon(log.action),
            title: `${log.action} ${log.table_name}`,
            description: `Record ID: ${log.record_id || ''}`,
            timestamp: log.created_at || new Date().toISOString(),
            userId: log.performed_by || undefined,
            priority: 'low',
          });
        });
      }
    } catch (auditQueryError) {
      // Silently skip audit logs if table doesn't exist
      console.warn('Audit logs table not available');
    }

    if (profileIds.size > 0) {
      try {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, callsign')
          .in('id', Array.from(profileIds))

        if (profileError) {
          console.warn('Profile lookup failed for recent actions:', profileError.message)
        } else if (profiles) {
          const profileMap = new Map<string, string>()
          profiles.forEach((profile) => {
            profileMap.set(
              profile.id,
              profile.display_name || profile.full_name || profile.callsign || 'Team Member'
            )
          })

          actions.forEach((action) => {
            if (action.userId) {
              const resolved = profileMap.get(action.userId)
              if (resolved) {
                action.userName = resolved
              }
            }
          })
        }
      } catch (profileLookupError) {
        console.warn('Unable to resolve user names for recent actions', profileLookupError)
      }
    }

    actions.forEach((action) => {
      if (!action.userName) {
        action.userName = action.type === 'audit' ? 'System' : 'Event Control'
      }
    })

    // Sort all actions by timestamp (newest first)
    actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return the requested number of actions
    const limitedActions = actions.slice(0, limit);

    res.status(200).json({
      actions: limitedActions,
      total: limitedActions.length,
      hasMore: actions.length > limit,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching recent actions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getIncidentIcon(incidentType: string): string {
  const iconMap: { [key: string]: string } = {
    'Ejection': '🚫',
    'Code Green': '🟢',
    'Code Black': '⚫',
    'Code Pink': '🩷',
    'Aggressive Behaviour': '⚡',
    'Missing Child/Person': '👤',
    'Hostile Act': '⚠️',
    'Counter-Terror Alert': '🚨',
    'Fire Alarm': '🔥',
    'Evacuation': '🏃',
    'Medical': '🏥',
    'Suspicious Behaviour': '👁️',
    'Queue Issues': '🚶',
    'Lost Property': '🎒',
    'Technical Issues': '🔧',
    'Refusal of Entry': '🚪',
    'Welfare Check': '💚',
    'Weather Related': '🌦️',
    'Other': '📝'
  };
  return iconMap[incidentType] || '📝';
}

function getAuditIcon(action: string): string {
  const iconMap: { [key: string]: string } = {
    'INSERT': '➕',
    'UPDATE': '✏️',
    'DELETE': '🗑️',
    'LOGIN': '🔐',
    'LOGOUT': '🚪'
  };
  return iconMap[action] || '📋';
} 
