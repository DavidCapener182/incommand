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

// Voice recording result interface
export interface RecordingResult {
  url: string;
  duration: number;
  blob: Blob;
  fileName: string;
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

// Enhanced incident categorization interfaces
export interface IncidentCategory {
  primary: string;
  secondary?: string;
  confidence: number;
  tags: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresEscalation: boolean;
  suggestedActions: string[];
}

// NLP analysis interfaces
export interface NLPAnalysis {
  entities: Array<{
    text: string;
    type: 'person' | 'location' | 'time' | 'action' | 'object';
    confidence: number;
  }>;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: number; // 0-1 scale
  keywords: string[];
  intent: string;
}

// Smart routing interfaces
export interface RoutingDecision {
  targetRole: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  estimatedResponseTime: number; // minutes
  autoAssign: boolean;
}

// Debrief report interfaces
export interface DebriefReport {
  executiveSummary: string;
  keyIncidents: Array<{
    id: string;
    type: string;
    severity: string;
    resolution: string;
    lessonsLearned: string;
  }>;
  performanceMetrics: {
    responseTime: number;
    resolutionRate: number;
    escalationRate: number;
    customerSatisfaction: number;
  };
  recommendations: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    riskFactors: string[];
    mitigationStrategies: string[];
  };
}

// Predictive analytics interfaces
export interface PredictiveAnalytics {
  predictedIncidents: Array<{
    type: string;
    probability: number;
    likelyTime: string;
    likelyLocation: string;
    recommendedPrevention: string;
  }>;
  riskHotspots: string[];
  peakTimes: string[];
  staffingRecommendations: {
    roles: string[];
    quantities: number[];
    timing: string;
  };
}

// Natural language search interfaces
export interface SearchAnalysis {
  searchTerms: string[];
  filters: {
    incidentType: string[];
    severity: string[];
    timeRange: string;
    location: string[];
  };
  intent: string;
  suggestedQueries: string[];
}

// Enhanced chat message with metadata
export interface EnhancedChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    incidentCategory?: IncidentCategory;
    nlpAnalysis?: NLPAnalysis;
    routingDecision?: RoutingDecision;
    sentiment?: {
      sentiment: 'positive' | 'negative' | 'neutral';
      confidence: number;
      emotions: string[];
      urgency: number;
      keyPhrases: string[];
    };
    searchResults?: any[];
  };
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
  venueName?: string;
  eventDate?: string;
  eventTime?: string;
  currentTime?: string;
  staffCount: number;
  openIncidents: number;
  totalIncidents?: number;
  recentIncidents?: any[];
  attendanceData?: any[];
  eventBrief?: string;
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

// AI Service configuration interfaces
export interface AIServiceConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  retryAttempts: number;
  timeoutMs: number;
  enableFallback: boolean;
  enableSentimentAnalysis: boolean;
  enablePredictiveAnalytics: boolean;
}

// Message processing result
export interface MessageProcessingResult {
  response: string;
  quickActions?: QuickAction[];
  metadata?: {
    incidentCategory?: IncidentCategory;
    nlpAnalysis?: NLPAnalysis;
    routingDecision?: RoutingDecision;
    sentiment?: any;
    searchResults?: any[];
  };
  context?: any;
}
