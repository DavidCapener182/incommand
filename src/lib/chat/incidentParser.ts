import { TopicDetectionResult, TopicCategory } from '@/types/chat';

// Enhanced incident categorization with confidence scoring
export interface IncidentCategory {
  primary: string;
  secondary?: string;
  confidence: number;
  tags: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresEscalation: boolean;
  suggestedActions: string[];
}

// NLP analysis result
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

// Smart routing decision
export interface RoutingDecision {
  targetRole: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  estimatedResponseTime: number; // minutes
  autoAssign: boolean;
}

/**
 * Advanced incident categorization using NLP and pattern matching
 */
export function categorizeIncident(
  description: string,
  incidentType?: string,
  location?: string
): IncidentCategory {
  const text = `${description} ${incidentType || ''} ${location || ''}`.toLowerCase();
  
  // Enhanced category patterns with confidence scoring
  const categoryPatterns = {
    medical: {
      patterns: [
        { regex: /medical|first aid|injury|collapse|unconscious|bleeding|heart|chest pain/i, weight: 0.8 },
        { regex: /ambulance|paramedic|hospital|emergency room/i, weight: 0.9 },
        { regex: /fainting|dizzy|nausea|vomiting/i, weight: 0.7 },
        { regex: /allergic|reaction|swelling|difficulty breathing/i, weight: 0.8 }
      ],
      severity: 'high' as const,
      requiresEscalation: true,
      suggestedActions: ['Dispatch medical staff', 'Call ambulance if needed', 'Clear area', 'Monitor vital signs']
    },
    security: {
      patterns: [
        { regex: /fight|altercation|assault|attack|violence/i, weight: 0.9 },
        { regex: /weapon|knife|gun|threat|intimidation/i, weight: 0.95 },
        { regex: /theft|stolen|robbery|burglary/i, weight: 0.8 },
        { regex: /trespass|unauthorized|suspicious/i, weight: 0.7 }
      ],
      severity: 'high' as const,
      requiresEscalation: true,
      suggestedActions: ['Dispatch security', 'Separate parties', 'Document evidence', 'Contact police if needed']
    },
    crowd: {
      patterns: [
        { regex: /crowd|mosh pit|surge|stampede|crush/i, weight: 0.8 },
        { regex: /overcrowding|capacity|too many people/i, weight: 0.7 },
        { regex: /pushing|shoving|crowd control/i, weight: 0.8 }
      ],
      severity: 'medium' as const,
      requiresEscalation: true,
      suggestedActions: ['Deploy crowd control staff', 'Monitor density', 'Consider venue capacity limits']
    },
    welfare: {
      patterns: [
        { regex: /welfare|concern|distressed|upset|crying/i, weight: 0.7 },
        { regex: /lost|separated|disoriented|confused/i, weight: 0.6 },
        { regex: /intoxicated|drunk|substance|drug/i, weight: 0.8 }
      ],
      severity: 'medium' as const,
      requiresEscalation: false,
      suggestedActions: ['Welfare check', 'Provide assistance', 'Contact friends/family', 'Consider medical assessment']
    },
    technical: {
      patterns: [
        { regex: /equipment|technical|sound|lighting|power/i, weight: 0.7 },
        { regex: /broken|malfunction|failure|outage/i, weight: 0.8 },
        { regex: /stage|speaker|microphone|amplifier/i, weight: 0.6 }
      ],
      severity: 'low' as const,
      requiresEscalation: false,
      suggestedActions: ['Assess technical issue', 'Contact technical staff', 'Implement workaround if possible']
    },
    access: {
      patterns: [
        { regex: /access|entry|exit|door|gate/i, weight: 0.6 },
        { regex: /ticket|pass|credential|unauthorized entry/i, weight: 0.7 },
        { regex: /queue|line|waiting|entry delay/i, weight: 0.5 }
      ],
      severity: 'low' as const,
      requiresEscalation: false,
      suggestedActions: ['Verify credentials', 'Assist with entry', 'Manage queue if needed']
    }
  };

  let bestCategory = 'general';
  let bestConfidence = 0;
  let totalWeight = 0;
  let matchedPatterns = 0;

  // Calculate confidence for each category
  Object.entries(categoryPatterns).forEach(([category, config]) => {
    let categoryConfidence = 0;
    let categoryWeight = 0;

    config.patterns.forEach(pattern => {
      if (pattern.regex.test(text)) {
        categoryConfidence += pattern.weight;
        categoryWeight += pattern.weight;
        matchedPatterns++;
      }
    });

    if (categoryWeight > 0) {
      categoryConfidence = categoryWeight / config.patterns.length;
      if (categoryConfidence > bestConfidence) {
        bestConfidence = categoryConfidence;
        bestCategory = category;
      }
    }
  });

  // Extract tags from text
  const tags = extractTags(text);
  
  // Determine severity based on category and keywords
  const severity = determineSeverity(text, bestCategory, bestConfidence);
  
  // Get category config
  const categoryConfig = categoryPatterns[bestCategory as keyof typeof categoryPatterns] || {
    severity: 'low' as const,
    requiresEscalation: false,
    suggestedActions: ['Assess situation', 'Document incident']
  };

  return {
    primary: bestCategory,
    confidence: Math.min(bestConfidence, 1.0),
    tags,
    severity,
    requiresEscalation: categoryConfig.requiresEscalation,
    suggestedActions: categoryConfig.suggestedActions
  };
}

/**
 * Extract named entities and perform NLP analysis
 */
export function analyzeTextNLP(text: string): NLPAnalysis {
  const entities: NLPAnalysis['entities'] = [];
  const keywords: string[] = [];
  
  // Extract entities using pattern matching
  const entityPatterns = {
    person: /(?:mr\.|mrs\.|ms\.|dr\.)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    location: /(?:at|in|near|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    time: /(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)|(?:(\d{1,2})\s*(?:am|pm))/gi,
    action: /(?:is|was|are|were)\s+([a-z]+ing)/gi
  };

  Object.entries(entityPatterns).forEach(([type, pattern]) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        entities.push({
          text: match[1],
          type: type as any,
          confidence: 0.7
        });
      }
    }
  });

  // Extract keywords
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can']);
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq: Record<string, number> = {};
  
  words.forEach(word => {
    if (!stopWords.has(word) && word.length > 2) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Get top keywords
  const sortedWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  keywords.push(...sortedWords);

  // Determine sentiment
  const positiveWords = ['good', 'fine', 'okay', 'resolved', 'helpful', 'assisted', 'safe'];
  const negativeWords = ['bad', 'terrible', 'urgent', 'emergency', 'dangerous', 'critical', 'serious', 'injury', 'fight', 'theft'];
  
  const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
  const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length;
  
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (negativeCount > positiveCount) sentiment = 'negative';
  else if (positiveCount > negativeCount) sentiment = 'positive';

  // Calculate urgency (0-1 scale)
  const urgencyWords = ['urgent', 'emergency', 'critical', 'immediate', 'now', 'asap'];
  const urgencyCount = urgencyWords.filter(word => text.toLowerCase().includes(word)).length;
  const urgency = Math.min(urgencyCount * 0.2, 1.0);

  // Determine intent
  let intent = 'information';
  if (text.includes('help') || text.includes('assist')) intent = 'request_assistance';
  if (text.includes('report') || text.includes('incident')) intent = 'report_incident';
  if (text.includes('status') || text.includes('update')) intent = 'request_status';
  if (text.includes('close') || text.includes('resolve')) intent = 'resolve_incident';

  return {
    entities,
    sentiment,
    urgency,
    keywords,
    intent
  };
}

/**
 * Smart routing based on incident analysis
 */
export function determineRouting(
  incidentCategory: IncidentCategory,
  nlpAnalysis: NLPAnalysis,
  currentStaff: any[],
  incidentHistory: any[]
): RoutingDecision {
  const { primary, severity, requiresEscalation } = incidentCategory;
  const { urgency, intent } = nlpAnalysis;

  // Determine target role based on category and severity
  let targetRole = 'general_staff';
  let priority: RoutingDecision['priority'] = 'low';
  let estimatedResponseTime = 30; // minutes

  if (primary === 'medical' || severity === 'critical') {
    targetRole = 'medical_staff';
    priority = 'urgent';
    estimatedResponseTime = 2;
  } else if (primary === 'security' || severity === 'high') {
    targetRole = 'security_staff';
    priority = 'high';
    estimatedResponseTime = 5;
  } else if (primary === 'crowd') {
    targetRole = 'crowd_control';
    priority = 'high';
    estimatedResponseTime = 10;
  } else if (requiresEscalation) {
    targetRole = 'supervisor';
    priority = 'medium';
    estimatedResponseTime = 15;
  }

  // Adjust based on urgency
  if (urgency > 0.7) {
    priority = priority === 'low' ? 'medium' : priority === 'medium' ? 'high' : 'urgent';
    estimatedResponseTime = Math.max(1, estimatedResponseTime * 0.5);
  }

  // Check if auto-assignment is possible
  const availableStaff = currentStaff.filter(staff => 
    staff.role === targetRole && 
    staff.status === 'available' && 
    !staff.current_incident
  );

  const autoAssign = availableStaff.length > 0 && priority !== 'urgent';

  // Generate reason
  let reason = `Category: ${primary}, Severity: ${severity}`;
  if (urgency > 0.5) reason += `, High urgency detected`;
  if (requiresEscalation) reason += `, Requires escalation`;

  return {
    targetRole,
    priority,
    reason,
    estimatedResponseTime,
    autoAssign
  };
}

/**
 * Extract incident ID from conversation text using pattern matching
 */
export function extractIncidentId(text: string): string | null {
  // Pattern for explicit incident/log numbers
  const explicitPattern = /(?:incident|log)\s*#?(\d+)/i;
  const match = text.match(explicitPattern);
  
  if (match) {
    return match[1];
  }
  
  return null;
}

/**
 * Detect conversation topics and extract incident references
 */
export function detectTopicsAndIncident(
  userMessage: string, 
  aiResponse: string, 
  conversationHistory: any[] = []
): TopicDetectionResult {
  const combinedText = `${userMessage} ${aiResponse}`.toLowerCase();
  const topics: TopicCategory[] = [];
  let confidence = 0;
  let incidentId: string | null = null;

  // Topic detection patterns
  const topicPatterns = {
    [TopicCategory.MEDICAL]: /medical|first aid|injury|collapse|medic|ambulance|hospital/i,
    [TopicCategory.SOP]: /sop|procedure|protocol|emergency|evacuation|policy/i,
    [TopicCategory.ASSIGNMENT]: /assign|staff|deploy|send|dispatch|allocate/i,
    [TopicCategory.ESCALATION]: /escalate|supervisor|urgent|critical|emergency|manager/i,
    [TopicCategory.CLOSURE]: /close|resolved|complete|finished|ended|concluded/i,
    [TopicCategory.ANALYSIS]: /trend|pattern|analysis|report|statistics|data/i
  };

  // Detect topics
  Object.entries(topicPatterns).forEach(([topic, pattern]) => {
    if (pattern.test(combinedText)) {
      topics.push(topic as TopicCategory);
      confidence += 0.3;
    }
  });

  // Extract incident ID
  incidentId = extractIncidentId(userMessage) || extractIncidentId(aiResponse);

  // If no explicit incident ID, try to find from conversation context
  if (!incidentId && conversationHistory.length > 0) {
    // Look for recent incident mentions in conversation history
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const message = conversationHistory[i];
      const extractedId = extractIncidentId(message.content || message.text || '');
      if (extractedId) {
        incidentId = extractedId;
        break;
      }
    }
  }

  // Adjust confidence based on topic count and incident presence
  if (incidentId) {
    confidence += 0.2;
  }
  
  confidence = Math.min(confidence, 1.0);

  return {
    topics: topics.length > 0 ? topics : [TopicCategory.GENERAL],
    confidence,
    incidentId: incidentId || undefined
  };
}

/**
 * Resolve ambiguous incident references using conversation context
 */
export function resolveIncidentReference(
  reference: string, 
  conversationHistory: any[], 
  recentIncidents: any[]
): string | null {
  const lowerRef = reference.toLowerCase();
  
  // Try to match by incident type
  const typePatterns = {
    medical: /medical|first aid|injury|collapse/i,
    ejection: /ejection|eject|removal/i,
    fight: /fight|altercation|conflict/i,
    theft: /theft|stolen|missing/i,
    welfare: /welfare|welfare check|concern/i
  };

  // Find incidents matching the reference type
  const matchingIncidents = recentIncidents.filter(incident => {
    const incidentType = incident.type?.toLowerCase() || '';
    const incidentDescription = incident.description?.toLowerCase() || '';
    
    return Object.entries(typePatterns).some(([type, pattern]) => {
      if (pattern.test(lowerRef)) {
        return pattern.test(incidentType) || pattern.test(incidentDescription);
      }
      return false;
    });
  });

  // Return the most recent matching incident
  if (matchingIncidents.length > 0) {
    return matchingIncidents[0].id || matchingIncidents[0].incident_id;
  }

  // Fallback to most recent open incident
  const openIncidents = recentIncidents.filter(incident => 
    !incident.is_closed && !incident.status?.includes('closed')
  );
  
  if (openIncidents.length > 0) {
    return openIncidents[0].id || openIncidents[0].incident_id;
  }

  return null;
}

/**
 * Parse incident references from text with context awareness
 */
export function parseIncidentReference(
  text: string,
  conversationHistory: any[] = [],
  recentIncidents: any[] = []
): string | null {
  // First try explicit incident ID extraction
  const explicitId = extractIncidentId(text);
  if (explicitId) {
    return explicitId;
  }

  // Look for type-based references
  const typeReferences = [
    /(?:the|that|this)\s+(medical|first aid|injury)\s+incident/i,
    /(?:the|that|this)\s+(ejection|removal)\s+incident/i,
    /(?:the|that|this)\s+(fight|altercation)\s+incident/i,
    /(?:the|that|this)\s+(theft|stolen)\s+incident/i,
    /(?:the|that|this)\s+(welfare)\s+incident/i
  ];

  for (const pattern of typeReferences) {
    const match = text.match(pattern);
    if (match) {
      const incidentType = match[1];
      return resolveIncidentReference(incidentType, conversationHistory, recentIncidents);
    }
  }

  // Look for temporal references
  const temporalPatterns = [
    /(?:the|that|this)\s+(last|recent|latest)\s+incident/i,
    /(?:the|that|this)\s+incident/i
  ];

  for (const pattern of temporalPatterns) {
    if (pattern.test(text)) {
      // Return most recent incident
      if (recentIncidents.length > 0) {
        return recentIncidents[0].id || recentIncidents[0].incident_id;
      }
    }
  }

  return null;
}

// Helper functions
function extractTags(text: string): string[] {
  const tags: string[] = [];
  const tagPatterns = [
    /(medical|first aid|injury|collapse)/i,
    /(fight|altercation|violence|assault)/i,
    /(theft|stolen|robbery)/i,
    /(crowd|mosh pit|surge)/i,
    /(welfare|concern|distressed)/i,
    /(technical|equipment|sound|lighting)/i,
    /(access|entry|ticket|credential)/i
  ];

  tagPatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match) {
      tags.push(match[1].toLowerCase());
    }
  });

  return [...new Set(tags)]; // Remove duplicates
}

function determineSeverity(text: string, category: string, confidence: number): IncidentCategory['severity'] {
  const criticalKeywords = ['critical', 'urgent', 'emergency', 'immediate', 'life-threatening', 'unconscious', 'bleeding'];
  const highKeywords = ['serious', 'severe', 'dangerous', 'weapon', 'violence', 'assault'];
  const mediumKeywords = ['moderate', 'concerning', 'distressed', 'intoxicated'];
  
  const lowerText = text.toLowerCase();
  
  if (criticalKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'critical';
  }
  
  if (highKeywords.some(keyword => lowerText.includes(keyword)) || category === 'medical' || category === 'security') {
    return 'high';
  }
  
  if (mediumKeywords.some(keyword => lowerText.includes(keyword)) || category === 'crowd' || category === 'welfare') {
    return 'medium';
  }
  
  return 'low';
}
