import { 
  QuickAction, 
  ConversationContext, 
  TopicCategory, 
  ActionCategory,
  AssignStaffPayload,
  EscalateIncidentPayload,
  CloseIncidentPayload
} from '@/types/chat';
import { detectTopicsAndIncident, parseIncidentReference } from './incidentParser';

/**
 * Generate context-aware follow-up actions based on conversation analysis
 */
export function deriveFollowUpActions(context: ConversationContext): QuickAction[] {
  const { userMessage, aiResponse, eventContext, conversationHistory, recentIncidents } = context;
  
  // Analyze conversation topics and extract incident references
  const topicAnalysis = detectTopicsAndIncident(userMessage, aiResponse, conversationHistory);
  const incidentId = topicAnalysis.incidentId || 
    parseIncidentReference(userMessage, conversationHistory, recentIncidents);

  const actions: QuickAction[] = [];

  // Generate topic-specific actions
  topicAnalysis.topics.forEach(topic => {
    const topicActions = generateTopicActions(topic, incidentId, eventContext);
    actions.push(...topicActions);
  });

  // Add incident-specific actions if incident is identified
  if (incidentId) {
    const incidentActions = generateIncidentActions(incidentId, topicAnalysis.topics);
    actions.push(...incidentActions);
  }

  // Add fallback actions
  const fallbackActions = generateFallbackActions(eventContext);
  actions.push(...fallbackActions);

  // Remove duplicates and limit to 8 actions
  const uniqueActions = removeDuplicateActions(actions);
  return uniqueActions.slice(0, 8);
}

/**
 * Generate actions based on detected conversation topics
 */
function generateTopicActions(
  topic: TopicCategory, 
  incidentId: string | null, 
  eventContext: any
): QuickAction[] {
  const actions: QuickAction[] = [];

  switch (topic) {
    case TopicCategory.MEDICAL:
      actions.push(
        {
          id: 'assign_medical_staff',
          text: 'Assign Medical Staff',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          payload: {
            incident_id: incidentId,
            staff_type: 'medical',
            assignment_type: 'auto'
          } as AssignStaffPayload
        },
        {
          id: 'escalate_medical',
          text: 'Escalate Medical Incident',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          confirmationRequired: true,
          payload: {
            incident_id: incidentId,
            escalation_level: 'emergency',
            reason: 'Medical incident requiring immediate attention'
          } as EscalateIncidentPayload
        },
        {
          id: 'view_medical_protocols',
          text: 'View Medical Protocols',
          mode: 'chat',
          category: ActionCategory.INFORMATION
        },
        {
          id: 'close_medical_incident',
          text: 'Close Medical Incident',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          confirmationRequired: true,
          payload: {
            incident_id: incidentId,
            resolution_notes: 'Medical incident resolved',
            closed_by: 'system'
          } as CloseIncidentPayload
        }
      );
      break;

    case TopicCategory.SOP:
      actions.push(
        {
          id: 'view_detailed_procedures',
          text: 'View Detailed Procedures',
          mode: 'chat',
          category: ActionCategory.INFORMATION
        },
        {
          id: 'assign_trained_staff',
          text: 'Assign Trained Staff',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          payload: {
            incident_id: incidentId,
            staff_type: 'trained',
            assignment_type: 'auto'
          } as AssignStaffPayload
        },
        {
          id: 'escalate_for_guidance',
          text: 'Escalate for Guidance',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          payload: {
            incident_id: incidentId,
            escalation_level: 'supervisor',
            reason: 'Requires procedural guidance'
          } as EscalateIncidentPayload
        }
      );
      break;

    case TopicCategory.ASSIGNMENT:
      actions.push(
        {
          id: 'view_staff_availability',
          text: 'View Staff Availability',
          mode: 'chat',
          category: ActionCategory.INFORMATION
        },
        {
          id: 'auto_assign_staff',
          text: 'Auto-Assign Staff',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          payload: {
            incident_id: incidentId,
            assignment_type: 'auto'
          } as AssignStaffPayload
        },
        {
          id: 'manual_staff_selection',
          text: 'Manual Staff Selection',
          mode: 'chat',
          category: ActionCategory.INCIDENT_MANAGEMENT
        }
      );
      break;

    case TopicCategory.ESCALATION:
      actions.push(
        {
          id: 'escalate_to_supervisor',
          text: 'Escalate to Supervisor',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          payload: {
            incident_id: incidentId,
            escalation_level: 'supervisor',
            reason: 'Requires supervisor attention'
          } as EscalateIncidentPayload
        },
        {
          id: 'escalate_to_manager',
          text: 'Escalate to Manager',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          confirmationRequired: true,
          payload: {
            incident_id: incidentId,
            escalation_level: 'manager',
            reason: 'Requires manager attention'
          } as EscalateIncidentPayload
        },
        {
          id: 'emergency_escalation',
          text: 'Emergency Escalation',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          confirmationRequired: true,
          payload: {
            incident_id: incidentId,
            escalation_level: 'emergency',
            reason: 'Emergency situation requiring immediate response'
          } as EscalateIncidentPayload
        }
      );
      break;

    case TopicCategory.CLOSURE:
      actions.push(
        {
          id: 'close_incident',
          text: 'Close Incident',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          confirmationRequired: true,
          payload: {
            incident_id: incidentId,
            resolution_notes: 'Incident resolved',
            closed_by: 'system'
          } as CloseIncidentPayload
        },
        {
          id: 'add_resolution_notes',
          text: 'Add Resolution Notes',
          mode: 'chat',
          category: ActionCategory.INCIDENT_MANAGEMENT
        },
        {
          id: 'mark_as_resolved',
          text: 'Mark as Resolved',
          mode: 'command',
          category: ActionCategory.INCIDENT_MANAGEMENT,
          requiresIncident: true,
          payload: {
            incident_id: incidentId,
            status: 'resolved',
            closed_by: 'system'
          } as CloseIncidentPayload
        }
      );
      break;

    case TopicCategory.ANALYSIS:
      actions.push(
        {
          id: 'generate_incident_report',
          text: 'Generate Incident Report',
          mode: 'chat',
          category: ActionCategory.INFORMATION
        },
        {
          id: 'view_incident_trends',
          text: 'View Incident Trends',
          mode: 'chat',
          category: ActionCategory.INFORMATION
        },
        {
          id: 'export_incident_data',
          text: 'Export Incident Data',
          mode: 'chat',
          category: ActionCategory.INFORMATION
        },
        {
          id: 'analyze_patterns',
          text: 'Analyze Patterns',
          mode: 'chat',
          category: ActionCategory.INFORMATION
        }
      );
      break;
  }

  return actions;
}

/**
 * Generate incident-specific actions
 */
function generateIncidentActions(incidentId: string, topics: TopicCategory[]): QuickAction[] {
  const actions: QuickAction[] = [];

  // Always include basic incident management actions
  actions.push(
    {
      id: 'view_incident_details',
      text: 'View Incident Details',
      mode: 'command',
      category: ActionCategory.INFORMATION,
      payload: { incident_id: incidentId }
    },
    {
      id: 'update_incident_status',
      text: 'Update Incident Status',
      mode: 'chat',
      category: ActionCategory.INCIDENT_MANAGEMENT
    }
  );

  // Add topic-specific incident actions
  if (topics.includes(TopicCategory.MEDICAL)) {
    actions.push({
      id: 'assign_medical_to_incident',
      text: 'Assign Medical Staff to Incident',
      mode: 'command',
      category: ActionCategory.INCIDENT_MANAGEMENT,
      payload: {
        incident_id: incidentId,
        staff_type: 'medical',
        assignment_type: 'auto'
      } as AssignStaffPayload
    });
  }

  if (topics.includes(TopicCategory.ESCALATION)) {
    actions.push({
      id: 'escalate_this_incident',
      text: 'Escalate This Incident',
      mode: 'command',
      category: ActionCategory.INCIDENT_MANAGEMENT,
      payload: {
        incident_id: incidentId,
        escalation_level: 'supervisor',
        reason: 'Incident requires escalation'
      } as EscalateIncidentPayload
    });
  }

  return actions;
}

/**
 * Generate fallback actions for general use
 */
function generateFallbackActions(eventContext: any): QuickAction[] {
  return [
    {
      id: 'view_incident_dashboard',
      text: 'View Incident Dashboard',
      mode: 'command',
      category: ActionCategory.NAVIGATION,
      payload: { destination: 'incidents' }
    },
    {
      id: 'get_help',
      text: 'Get Help',
      mode: 'chat',
      category: ActionCategory.HELP
    },
    {
      id: 'start_new_topic',
      text: 'Start New Topic',
      mode: 'chat',
      category: ActionCategory.HELP
    },
    {
      id: 'view_staff_status',
      text: `View Staff Status (${eventContext.staffCount} available)`,
      mode: 'command',
      category: ActionCategory.INFORMATION,
      payload: { destination: 'staff' }
    }
  ];
}

/**
 * Remove duplicate actions based on ID
 */
function removeDuplicateActions(actions: QuickAction[]): QuickAction[] {
  const seen = new Set<string>();
  return actions.filter(action => {
    if (seen.has(action.id)) {
      return false;
    }
    seen.add(action.id);
    return true;
  });
}
