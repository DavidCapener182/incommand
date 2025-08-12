import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface EscalationConfig {
  incident_type: string;
  priority_level: string;
  escalation_timeout_minutes: number;
  escalation_levels: number;
  supervisor_roles: string[];
  auto_escalate: boolean;
}

export interface EscalationEvent {
  id: string;
  incident_id: string;
  escalation_level: number;
  escalated_at: Date;
  escalated_by?: string;
  supervisor_notified: boolean;
  resolution_time?: string;
  notes?: string;
}

export interface Supervisor {
  id: string;
  name: string;
  role: string;
  callsign?: string;
  contact_methods: string[];
}

export interface EscalationNotification {
  incident_id: string;
  escalation_level: number;
  incident_type: string;
  priority: string;
  description: string;
  assigned_staff: string[];
  supervisors: Supervisor[];
  escalation_time: Date;
}

// Fallback notification methods
export enum NotificationMethod {
  PUSH = 'push',
  DATABASE = 'database',
  EMAIL = 'email',
  SMS = 'sms',
  AUDIO_ALERT = 'audio_alert',
  VISUAL_ALERT = 'visual_alert',
  EMERGENCY_BROADCAST = 'emergency_broadcast'
}

export interface NotificationAttempt {
  method: NotificationMethod;
  success: boolean;
  timestamp: Date;
  error?: string;
  recipient?: string;
}

export interface EscalationNotificationResult {
  incident_id: string;
  escalation_level: number;
  attempts: NotificationAttempt[];
  anySuccess: boolean;
  criticalFailure: boolean;
  fallbackActivated: boolean;
}

/**
 * Calculate escalation time based on incident type and priority
 */
export async function calculateEscalationTime(
  incidentType: string,
  priority: string
): Promise<Date | null> {
  try {
    const { data: config, error } = await supabase
      .from('escalation_sla_config')
      .select('escalation_timeout_minutes')
      .eq('incident_type', incidentType)
      .eq('priority_level', priority)
      .single();

    if (error || !config) {
      console.warn(`No escalation config found for ${incidentType}/${priority}, using default`);
      // Default escalation times
      const defaultTimes: Record<string, number> = {
        urgent: 2,
        high: 5,
        medium: 15,
        low: 30
      };
      const timeoutMinutes = defaultTimes[priority] || 15;
      return new Date(Date.now() + timeoutMinutes * 60 * 1000);
    }

    return new Date(Date.now() + config.escalation_timeout_minutes * 60 * 1000);
  } catch (error) {
    console.error('Error calculating escalation time:', error);
    return null;
  }
}

/**
 * Get escalation configuration for incident type and priority
 */
export async function getEscalationConfig(
  incidentType: string,
  priority: string
): Promise<EscalationConfig | null> {
  try {
    const { data: config, error } = await supabase
      .from('escalation_sla_config')
      .select('*')
      .eq('incident_type', incidentType)
      .eq('priority_level', priority)
      .single();

    if (error || !config) {
      return null;
    }

    return {
      incident_type: config.incident_type,
      priority_level: config.priority_level,
      escalation_timeout_minutes: config.escalation_timeout_minutes,
      escalation_levels: config.escalation_levels,
      supervisor_roles: config.supervisor_roles || [],
      auto_escalate: config.auto_escalate
    };
  } catch (error) {
    console.error('Error getting escalation config:', error);
    return null;
  }
}

/**
 * Get supervisors for an event based on roles
 */
export async function getSupervisors(
  eventId: string,
  roles: string[] = ['supervisor', 'manager', 'admin']
): Promise<Supervisor[]> {
  try {
    const { data: supervisors, error } = await supabase
      .from('staff')
      .select(`
        id,
        name,
        role,
        callsign,
        contact_methods,
        event_staff!inner(event_id)
      `)
      .eq('event_staff.event_id', eventId)
      .in('role', roles)
      .eq('availability_status', 'available')
      .order('role, name');

    if (error) {
      console.error('Error fetching supervisors:', error);
      return [];
    }

    return supervisors?.map(supervisor => ({
      id: supervisor.id,
      name: supervisor.name,
      role: supervisor.role,
      callsign: supervisor.callsign,
      contact_methods: supervisor.contact_methods || []
    })) || [];

  } catch (error) {
    console.error('Error in getSupervisors:', error);
    return [];
  }
}

/**
 * Check for incidents that need escalation
 */
export async function checkEscalations(): Promise<string[]> {
  try {
    const { data: incidents, error } = await supabase
      .from('incident_logs')
      .select('id, incident_type, priority, escalation_level, escalate_at')
      .lt('escalate_at', new Date().toISOString())
      .eq('escalated', false)
      .in('status', ['open', 'in_progress']);

    if (error) {
      console.error('Error checking escalations:', error);
      return [];
    }

    const escalatedIncidentIds: string[] = [];
    
    for (const incident of incidents || []) {
      const escalated = await escalateIncident(incident.id);
      if (escalated) {
        escalatedIncidentIds.push(incident.id);
      }
    }

    return escalatedIncidentIds;
  } catch (error) {
    console.error('Error in checkEscalations:', error);
    return [];
  }
}

/**
 * Escalate a specific incident
 */
export async function escalateIncident(incidentId: string): Promise<boolean> {
  try {
    // Get incident details
    const { data: incident, error: incidentError } = await supabase
      .from('incident_logs')
      .select(`
        *,
        events!inner(id, name)
      `)
      .eq('id', incidentId)
      .single();

    if (incidentError || !incident) {
      console.error('Error fetching incident for escalation:', incidentError);
      return false;
    }

    // Get escalation config
    const config = await getEscalationConfig(incident.incident_type, incident.priority);
    if (!config) {
      console.warn(`No escalation config found for incident ${incidentId}`);
      return false;
    }

    // Check if incident can escalate further
    if (incident.escalation_level >= config.escalation_levels) {
      console.log(`Incident ${incidentId} already at maximum escalation level`);
      return false;
    }

    // Calculate new escalation level
    const newEscalationLevel = incident.escalation_level + 1;

    // Get supervisors for notification
    const supervisors = await getSupervisors(incident.event_id, config.supervisor_roles);

    // Update incident escalation status
    const { error: updateError } = await supabase
      .from('incident_logs')
      .update({
        escalation_level: newEscalationLevel,
        escalated: true,
        escalation_notes: `Auto-escalated to level ${newEscalationLevel} at ${new Date().toISOString()}`
      })
      .eq('id', incidentId);

    if (updateError) {
      console.error('Error updating incident escalation:', updateError);
      return false;
    }

    // Create escalation log entry
    const { error: logError } = await supabase
      .from('incident_escalations')
      .insert({
        incident_id: incidentId,
        escalation_level: newEscalationLevel,
        escalated_by: null, // Auto-escalation
        supervisor_notified: supervisors.length > 0,
        notes: `Auto-escalated from level ${incident.escalation_level} to ${newEscalationLevel}`
      });

    if (logError) {
      console.error('Error creating escalation log:', logError);
    }

    // Send escalation notifications with fallback mechanisms
    if (supervisors.length > 0) {
      const notificationResult = await sendEscalationNotificationWithFallbacks({
        incident_id: incidentId,
        escalation_level: newEscalationLevel,
        incident_type: incident.incident_type,
        priority: incident.priority,
        description: incident.description,
        assigned_staff: incident.assigned_staff_ids || [],
        supervisors,
        escalation_time: new Date()
      });

      // Log notification results
      if (notificationResult.criticalFailure) {
        console.error(`Critical notification failure for incident ${incidentId}. All fallback methods failed.`);
        // Trigger emergency procedures
        await triggerEmergencyProcedures(incidentId, incident.event_id, newEscalationLevel);
      }
    }

    return true;
  } catch (error) {
    console.error('Error in escalateIncident:', error);
    return false;
  }
}

/**
 * Send escalation notification with comprehensive fallback mechanisms
 */
export async function sendEscalationNotificationWithFallbacks(
  notification: EscalationNotification
): Promise<EscalationNotificationResult> {
  const attempts: NotificationAttempt[] = [];
  let anySuccess = false;
  let criticalFailure = false;

  // Method 1: Push Notifications (Primary)
  for (const supervisor of notification.supervisors) {
    try {
      const pushSuccess = await sendPushNotification(supervisor.id, {
        title: `Incident Escalation - Level ${notification.escalation_level}`,
        body: `${notification.incident_type} incident requires attention`,
        data: {
          incident_id: notification.incident_id,
          escalation_level: notification.escalation_level.toString(),
          type: 'escalation'
        }
      });

      attempts.push({
        method: NotificationMethod.PUSH,
        success: pushSuccess,
        timestamp: new Date(),
        recipient: supervisor.id,
        error: pushSuccess ? undefined : 'Push notification failed'
      });

      if (pushSuccess) {
        anySuccess = true;
      }
    } catch (error) {
      attempts.push({
        method: NotificationMethod.PUSH,
        success: false,
        timestamp: new Date(),
        recipient: supervisor.id,
        error: error instanceof Error ? error.message : 'Unknown push error'
      });
    }
  }

  // Method 2: Database Notifications (Fallback 1)
  if (!anySuccess) {
    try {
      const dbSuccess = await sendDatabaseNotification(notification);
      attempts.push({
        method: NotificationMethod.DATABASE,
        success: dbSuccess,
        timestamp: new Date(),
        error: dbSuccess ? undefined : 'Database notification failed'
      });

      if (dbSuccess) {
        anySuccess = true;
      }
    } catch (error) {
      attempts.push({
        method: NotificationMethod.DATABASE,
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Database notification error'
      });
    }
  }

  // Method 3: Email Notifications (Fallback 2)
  if (!anySuccess) {
    try {
      const emailSuccess = await sendEmailNotification(notification);
      attempts.push({
        method: NotificationMethod.EMAIL,
        success: emailSuccess,
        timestamp: new Date(),
        error: emailSuccess ? undefined : 'Email notification failed'
      });

      if (emailSuccess) {
        anySuccess = true;
      }
    } catch (error) {
      attempts.push({
        method: NotificationMethod.EMAIL,
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Email notification error'
      });
    }
  }

  // Method 4: SMS Notifications (Fallback 3)
  if (!anySuccess) {
    try {
      const smsSuccess = await sendSMSNotification(notification);
      attempts.push({
        method: NotificationMethod.SMS,
        success: smsSuccess,
        timestamp: new Date(),
        error: smsSuccess ? undefined : 'SMS notification failed'
      });

      if (smsSuccess) {
        anySuccess = true;
      }
    } catch (error) {
      attempts.push({
        method: NotificationMethod.SMS,
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'SMS notification error'
      });
    }
  }

  // Method 5: Audio Alert System (Fallback 4)
  if (!anySuccess) {
    try {
      const audioSuccess = await sendAudioAlert(notification);
      attempts.push({
        method: NotificationMethod.AUDIO_ALERT,
        success: audioSuccess,
        timestamp: new Date(),
        error: audioSuccess ? undefined : 'Audio alert failed'
      });

      if (audioSuccess) {
        anySuccess = true;
      }
    } catch (error) {
      attempts.push({
        method: NotificationMethod.AUDIO_ALERT,
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Audio alert error'
      });
    }
  }

  // Method 6: Visual Alert System (Fallback 5)
  if (!anySuccess) {
    try {
      const visualSuccess = await sendVisualAlert(notification);
      attempts.push({
        method: NotificationMethod.VISUAL_ALERT,
        success: visualSuccess,
        timestamp: new Date(),
        error: visualSuccess ? undefined : 'Visual alert failed'
      });

      if (visualSuccess) {
        anySuccess = true;
      }
    } catch (error) {
      attempts.push({
        method: NotificationMethod.VISUAL_ALERT,
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Visual alert error'
      });
    }
  }

  // Method 7: Emergency Broadcast (Last Resort)
  if (!anySuccess) {
    try {
      const broadcastSuccess = await sendEmergencyBroadcast(notification);
      attempts.push({
        method: NotificationMethod.EMERGENCY_BROADCAST,
        success: broadcastSuccess,
        timestamp: new Date(),
        error: broadcastSuccess ? undefined : 'Emergency broadcast failed'
      });

      if (broadcastSuccess) {
        anySuccess = true;
      }
    } catch (error) {
      attempts.push({
        method: NotificationMethod.EMERGENCY_BROADCAST,
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Emergency broadcast error'
      });
    }
  }

  // Determine if this is a critical failure
  criticalFailure = !anySuccess && attempts.length >= 5; // At least 5 methods attempted

  // Log all attempts for debugging
  console.log(`Escalation notification attempts for incident ${notification.incident_id}:`, attempts);

  return {
    incident_id: notification.incident_id,
    escalation_level: notification.escalation_level,
    attempts,
    anySuccess,
    criticalFailure,
    fallbackActivated: attempts.length > 1
  };
}

/**
 * Send escalation notification to supervisors (Legacy method - now uses fallback system)
 */
export async function sendEscalationNotification(
  notification: EscalationNotification
): Promise<boolean> {
  const result = await sendEscalationNotificationWithFallbacks(notification);
  return result.anySuccess;
}

/**
 * Send push notification using existing push notification system
 */
async function sendPushNotification(
  staffId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<boolean> {
  try {
    // Use the existing push notification API endpoint
    const response = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: staffId,
        payload: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          icon: '/icon.png',
          badge: '/icon.png',
          tag: 'escalation',
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200]
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error sending push notification:', errorData);
      return false;
    } else {
      console.log('Push notification sent successfully to staff member:', staffId);
      return true;
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send database notification as fallback
 */
async function sendDatabaseNotification(notification: EscalationNotification): Promise<boolean> {
  try {
    // Create notification records for all supervisors
    const notificationPromises = notification.supervisors.map(supervisor => 
      supabase
        .from('notifications')
        .insert({
          staff_id: supervisor.id,
          title: `Incident Escalation - Level ${notification.escalation_level}`,
          message: `${notification.incident_type} incident requires immediate attention`,
          type: 'escalation',
          data: {
            incident_id: notification.incident_id,
            escalation_level: notification.escalation_level,
            incident_type: notification.incident_type,
            priority: notification.priority
          },
          read: false,
          created_at: new Date().toISOString()
        })
    );

    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && !result.value.error
    ).length;

    return successCount > 0;
  } catch (error) {
    console.error('Error sending database notification:', error);
    return false;
  }
}

/**
 * Send email notification as fallback
 */
async function sendEmailNotification(notification: EscalationNotification): Promise<boolean> {
  try {
    // Get supervisor email addresses
    const supervisorEmails = notification.supervisors
      .filter(supervisor => supervisor.contact_methods.includes('email'))
      .map(supervisor => supervisor.id); // Assuming staff table has email field

    if (supervisorEmails.length === 0) {
      return false;
    }

    // Send email via API endpoint
    const response = await fetch('/api/notifications/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: supervisorEmails,
        subject: `URGENT: Incident Escalation - Level ${notification.escalation_level}`,
        body: `
          <h2>🚨 INCIDENT ESCALATION ALERT</h2>
          <p><strong>Level:</strong> ${notification.escalation_level}</p>
          <p><strong>Type:</strong> ${notification.incident_type}</p>
          <p><strong>Priority:</strong> ${notification.priority}</p>
          <p><strong>Description:</strong> ${notification.description}</p>
          <p><strong>Escalated at:</strong> ${notification.escalation_time.toLocaleString()}</p>
          <p>This incident requires immediate supervisor attention.</p>
        `,
        priority: 'high'
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

/**
 * Send SMS notification as fallback
 */
async function sendSMSNotification(notification: EscalationNotification): Promise<boolean> {
  try {
    // Get supervisor phone numbers
    const supervisorPhones = notification.supervisors
      .filter(supervisor => supervisor.contact_methods.includes('sms'))
      .map(supervisor => supervisor.id); // Assuming staff table has phone field

    if (supervisorPhones.length === 0) {
      return false;
    }

    // Send SMS via API endpoint
    const response = await fetch('/api/notifications/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: supervisorPhones,
        message: `URGENT: ${notification.incident_type} incident escalated to level ${notification.escalation_level}. Requires immediate attention.`,
        priority: 'high'
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return false;
  }
}

/**
 * Send audio alert as fallback
 */
async function sendAudioAlert(notification: EscalationNotification): Promise<boolean> {
  try {
    // Trigger audio alert system
    const response = await fetch('/api/notifications/audio-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        incident_id: notification.incident_id,
        escalation_level: notification.escalation_level,
        incident_type: notification.incident_type,
        priority: notification.priority,
        alert_type: 'escalation'
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending audio alert:', error);
    return false;
  }
}

/**
 * Send visual alert as fallback
 */
async function sendVisualAlert(notification: EscalationNotification): Promise<boolean> {
  try {
    // Trigger visual alert system (screens, displays, etc.)
    const response = await fetch('/api/notifications/visual-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        incident_id: notification.incident_id,
        escalation_level: notification.escalation_level,
        incident_type: notification.incident_type,
        priority: notification.priority,
        alert_type: 'escalation',
        display_targets: ['command_center', 'supervisor_screens', 'emergency_displays']
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending visual alert:', error);
    return false;
  }
}

/**
 * Send emergency broadcast as last resort
 */
async function sendEmergencyBroadcast(notification: EscalationNotification): Promise<boolean> {
  try {
    // Trigger emergency broadcast system
    const response = await fetch('/api/notifications/emergency-broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        incident_id: notification.incident_id,
        escalation_level: notification.escalation_level,
        incident_type: notification.incident_type,
        priority: notification.priority,
        broadcast_type: 'escalation_emergency',
        message: `EMERGENCY: ${notification.incident_type} incident at escalation level ${notification.escalation_level}. All available supervisors required immediately.`
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending emergency broadcast:', error);
    return false;
  }
}

/**
 * Trigger emergency procedures when all notification methods fail
 */
async function triggerEmergencyProcedures(
  incidentId: string,
  eventId: string,
  escalationLevel: number
): Promise<void> {
  try {
    console.error(`EMERGENCY: All notification methods failed for incident ${incidentId}. Triggering emergency procedures.`);

    // Log emergency event
    const { error: logError } = await supabase
      .from('emergency_logs')
      .insert({
        incident_id: incidentId,
        event_id: eventId,
        escalation_level: escalationLevel,
        emergency_type: 'notification_failure',
        triggered_at: new Date().toISOString(),
        status: 'active',
        notes: 'All notification methods failed. Emergency procedures activated.'
      });

    if (logError) {
      console.error('Error logging emergency event:', logError);
    }

    // Attempt to contact emergency contacts
    await contactEmergencyContacts(incidentId, eventId);

    // Activate emergency protocols
    await activateEmergencyProtocols(eventId, escalationLevel);

  } catch (error) {
    console.error('Error triggering emergency procedures:', error);
  }
}

/**
 * Contact emergency contacts when all other methods fail
 */
async function contactEmergencyContacts(incidentId: string, eventId: string): Promise<void> {
  try {
    // Get emergency contacts for the event
    const { data: emergencyContacts, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('event_id', eventId)
      .eq('active', true);

    if (error || !emergencyContacts) {
      console.error('Error fetching emergency contacts:', error);
      return;
    }

    // Contact each emergency contact
    for (const contact of emergencyContacts) {
      try {
        // Try multiple contact methods
        const contactMethods = ['phone', 'email', 'sms'];
        
        for (const method of contactMethods) {
          if (contact[method]) {
            const success = await contactEmergencyContact(contact, method, incidentId);
            if (success) break; // Stop if one method succeeds
          }
        }
      } catch (contactError) {
        console.error(`Error contacting emergency contact ${contact.id}:`, contactError);
      }
    }
  } catch (error) {
    console.error('Error in contactEmergencyContacts:', error);
  }
}

/**
 * Contact a single emergency contact
 */
async function contactEmergencyContact(
  contact: any,
  method: string,
  incidentId: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/emergency/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact_id: contact.id,
        method,
        incident_id: incidentId,
        message: `EMERGENCY: Critical incident ${incidentId} requires immediate attention. All notification systems have failed.`
      })
    });

    return response.ok;
  } catch (error) {
    console.error(`Error contacting emergency contact via ${method}:`, error);
    return false;
  }
}

/**
 * Activate emergency protocols
 */
async function activateEmergencyProtocols(eventId: string, escalationLevel: number): Promise<void> {
  try {
    // Activate emergency protocols based on escalation level
    const protocols = [
      'activate_emergency_response_team',
      'notify_emergency_services',
      'activate_backup_communication_systems',
      'deploy_emergency_staff'
    ];

    for (const protocol of protocols) {
      try {
        const response = await fetch(`/api/emergency/${protocol}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: eventId,
            escalation_level: escalationLevel,
            reason: 'notification_system_failure'
          })
        });

        if (response.ok) {
          console.log(`Emergency protocol ${protocol} activated successfully`);
        } else {
          console.error(`Failed to activate emergency protocol ${protocol}`);
        }
      } catch (protocolError) {
        console.error(`Error activating emergency protocol ${protocol}:`, protocolError);
      }
    }
  } catch (error) {
    console.error('Error in activateEmergencyProtocols:', error);
  }
}

/**
 * Get escalation history for an incident
 */
export async function getEscalationHistory(incidentId: string): Promise<EscalationEvent[]> {
  try {
    const { data: escalations, error } = await supabase
      .from('incident_escalations')
      .select(`
        *,
        staff:escalated_by(id, name, callsign)
      `)
      .eq('incident_id', incidentId)
      .order('escalated_at', { ascending: false });

    if (error) {
      console.error('Error fetching escalation history:', error);
      return [];
    }

    return escalations?.map(escalation => ({
      id: escalation.id,
      incident_id: escalation.incident_id,
      escalation_level: escalation.escalation_level,
      escalated_at: new Date(escalation.escalated_at),
      escalated_by: escalation.escalated_by,
      supervisor_notified: escalation.supervisor_notified,
      resolution_time: escalation.resolution_time,
      notes: escalation.notes
    })) || [];

  } catch (error) {
    console.error('Error in getEscalationHistory:', error);
    return [];
  }
}

/**
 * Pause escalation timer for an incident
 */
export async function pauseEscalationTimer(incidentId: string, pausedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('incident_logs')
      .update({
        escalate_at: null, // Remove escalation time
        escalation_notes: `Escalation paused by ${pausedBy} at ${new Date().toISOString()}`
      })
      .eq('id', incidentId);

    if (error) {
      console.error('Error pausing escalation timer:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in pauseEscalationTimer:', error);
    return false;
  }
}

/**
 * Resume escalation timer for an incident
 */
export async function resumeEscalationTimer(
  incidentId: string,
  resumedBy: string,
  additionalMinutes?: number
): Promise<boolean> {
  try {
    // Get incident details to recalculate escalation time
    const { data: incident, error: incidentError } = await supabase
      .from('incident_logs')
      .select('incident_type, priority')
      .eq('id', incidentId)
      .single();

    if (incidentError || !incident) {
      console.error('Error fetching incident for resume:', incidentError);
      return false;
    }

    // Calculate new escalation time
    let escalationTime = await calculateEscalationTime(incident.incident_type, incident.priority);
    
    if (additionalMinutes && escalationTime) {
      escalationTime = new Date(escalationTime.getTime() + additionalMinutes * 60 * 1000);
    }

    const { error } = await supabase
      .from('incident_logs')
      .update({
        escalate_at: escalationTime?.toISOString(),
        escalated: false,
        escalation_notes: `Escalation resumed by ${resumedBy} at ${new Date().toISOString()}`
      })
      .eq('id', incidentId);

    if (error) {
      console.error('Error resuming escalation timer:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in resumeEscalationTimer:', error);
    return false;
  }
}

/**
 * Get escalation statistics for an event
 */
export async function getEscalationStats(eventId: string): Promise<{
  totalEscalations: number;
  averageResponseTime: number;
  escalationByLevel: Record<number, number>;
  escalationByType: Record<string, number>;
}> {
  try {
    const { data: escalations, error } = await supabase
      .from('incident_escalations')
      .select(`
        *,
        incident_logs!inner(event_id, incident_type)
      `)
      .eq('incident_logs.event_id', eventId);

    if (error) {
      console.error('Error fetching escalation stats:', error);
      return {
        totalEscalations: 0,
        averageResponseTime: 0,
        escalationByLevel: {},
        escalationByType: {}
      };
    }

    const escalationByLevel: Record<number, number> = {};
    const escalationByType: Record<string, number> = {};
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    escalations?.forEach(escalation => {
      // Count by level
      escalationByLevel[escalation.escalation_level] = 
        (escalationByLevel[escalation.escalation_level] || 0) + 1;

      // Count by type
      const incidentType = escalation.incident_logs?.incident_type || 'unknown';
      escalationByType[incidentType] = (escalationByType[incidentType] || 0) + 1;

      // Calculate response time if available
      if (escalation.resolution_time) {
        const responseMinutes = parseInt(escalation.resolution_time);
        if (!isNaN(responseMinutes)) {
          totalResponseTime += responseMinutes;
          responseTimeCount++;
        }
      }
    });

    return {
      totalEscalations: escalations?.length || 0,
      averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
      escalationByLevel,
      escalationByType
    };

  } catch (error) {
    console.error('Error in getEscalationStats:', error);
    return {
      totalEscalations: 0,
      averageResponseTime: 0,
      escalationByLevel: {},
      escalationByType: {}
    };
  }
}
