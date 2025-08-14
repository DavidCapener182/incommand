import { TopicDetectionResult, TopicCategory } from '@/types/chat';

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
