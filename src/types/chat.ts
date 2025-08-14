// Extended QuickAction interface for context-aware actions
export interface QuickAction {
  id: string;
  text: string;
  mode?: 'chat' | 'command';
  payload?: any;
  requiresIncident?: boolean;
  confirmationRequired?: boolean;
  icon?: string;
  category?: ActionCategory;
}

// Topic categories for conversation analysis
export enum TopicCategory {
  MEDICAL = 'medical',
  SOP = 'sop',
  ASSIGNMENT = 'assignment',
  ESCALATION = 'escalation',
  CLOSURE = 'closure',
  ANALYSIS = 'analysis',
  GENERAL = 'general'
}

// Action categories for organizing quick actions
export enum ActionCategory {
  INCIDENT_MANAGEMENT = 'incident_management',
  INFORMATION = 'information',
  NAVIGATION = 'navigation',
  HELP = 'help'
}

// Conversation context for generating follow-up actions
export interface ConversationContext {
  userMessage: string;
  aiResponse: string;
  eventContext: EventContext;
  conversationHistory: ChatMessage[];
  recentIncidents: any[];
}

// Event context interface
export interface EventContext {
  eventId: string;
  eventName: string;
  currentTime: string;
  staffCount: number;
  openIncidents: number;
}

// Chat message interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Command payload types for different action types
export interface AssignStaffPayload {
  incident_id: string;
  staff_ids: string[];
  assignment_type: 'auto' | 'manual';
}

export interface EscalateIncidentPayload {
  incident_id: string;
  escalation_level: 'supervisor' | 'manager' | 'emergency';
  reason: string;
}

export interface CloseIncidentPayload {
  incident_id: string;
  resolution_notes?: string;
  closed_by: string;
}

// Command execution result
export interface CommandExecutionResult {
  success: boolean;
  error?: string;
  data?: any;
  message: string;
}

// Topic detection result
export interface TopicDetectionResult {
  topics: TopicCategory[];
  confidence: number;
  incidentId?: string;
}
