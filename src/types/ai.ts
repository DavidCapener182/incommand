export interface EnhancedIncidentParsingResponse {
  incidentType: string;
  description: string;
  callsign: string;
  location: string;
  priority: 'urgent' | 'high' | 'medium' | 'low' | string;
  confidence: number;
  actionTaken: string;
  ejectionInfo: null | { location: string; description: string; reason: string };
  aiSource: 'openai' | 'browser' | 'none';
  // When aiSource is 'none', the server may recommend a client/browser fallback
  // without attempting to initialize a browser LLM on the server.
  fallback?: 'browser-recommended';
}


