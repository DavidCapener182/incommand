import axios, { AxiosInstance } from 'axios';

export type OllamaRole = 'system' | 'user' | 'assistant';

export interface OllamaMessage {
  role: OllamaRole;
  content: string;
}

export interface OllamaConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  precheckAvailability?: boolean;
}

// Enhanced AI service interfaces
export interface OllamaDebriefReport {
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

export interface OllamaAIServiceConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  retryAttempts: number;
  timeoutMs: number;
  enableFallback: boolean;
  enableSentimentAnalysis: boolean;
  enablePredictiveAnalytics: boolean;
}

// Advanced prompt templates for Ollama
const OLLAMA_PROMPT_TEMPLATES = {
  incidentCategorization: `You are an expert incident management AI. Analyze the following incident description and categorize it with high accuracy.

INCIDENT DESCRIPTION: {description}

Please provide a JSON response with the following structure:
{
  "category": "medical|security|crowd|welfare|technical|access|general",
  "confidence": 0.0-1.0,
  "severity": "low|medium|high|critical",
  "tags": ["tag1", "tag2"],
  "requiresEscalation": true|false,
  "suggestedActions": ["action1", "action2"],
  "reasoning": "Brief explanation of categorization"
}`,

  debriefGeneration: `You are an expert event management analyst. Generate a comprehensive debrief report for the following event data.

EVENT DATA: {eventData}

Please provide a JSON response with the following structure:
{
  "executiveSummary": "2-3 sentence overview",
  "keyIncidents": [
    {
      "id": "incident_id",
      "type": "incident_type",
      "severity": "severity_level",
      "resolution": "how it was resolved",
      "lessonsLearned": "key takeaways"
    }
  ],
  "performanceMetrics": {
    "responseTime": average_minutes,
    "resolutionRate": percentage_0_100,
    "escalationRate": percentage_0_100,
    "customerSatisfaction": score_1_10
  },
  "recommendations": ["recommendation1", "recommendation2"],
  "sentiment": "positive|negative|neutral",
  "riskAssessment": {
    "overallRisk": "low|medium|high",
    "riskFactors": ["factor1", "factor2"],
    "mitigationStrategies": ["strategy1", "strategy2"]
  }
}`,

  sentimentAnalysis: `Analyze the sentiment and emotional tone of the following text. Consider context, urgency, and emotional indicators.

TEXT: {text}

Provide a JSON response:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "emotions": ["emotion1", "emotion2"],
  "urgency": 0.0-1.0,
  "keyPhrases": ["phrase1", "phrase2"]
}`,

  predictiveAnalytics: `Based on the following incident history and patterns, provide predictive insights for future events.

INCIDENT HISTORY: {incidentHistory}

Provide a JSON response:
{
  "predictedIncidents": [
    {
      "type": "incident_type",
      "probability": 0.0-1.0,
      "likelyTime": "time_period",
      "likelyLocation": "location",
      "recommendedPrevention": "prevention_strategy"
    }
  ],
  "riskHotspots": ["location1", "location2"],
  "peakTimes": ["time1", "time2"],
  "staffingRecommendations": {
    "roles": ["role1", "role2"],
    "quantities": [number1, number2],
    "timing": "when_to_deploy"
  }
}`,

  naturalLanguageSearch: `You are an expert search assistant for incident management. Analyze the following query and extract relevant search terms and filters.

QUERY: {query}

Provide a JSON response:
{
  "searchTerms": ["term1", "term2"],
  "filters": {
    "incidentType": ["type1", "type2"],
    "severity": ["severity1", "severity2"],
    "timeRange": "time_range",
    "location": ["location1", "location2"]
  },
  "intent": "search_intent",
  "suggestedQueries": ["suggestion1", "suggestion2"]
}`
};

interface OllamaChatRequest {
  model: string;
  messages: { role: OllamaRole; content: string }[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaChatResponseMessage {
  role: OllamaRole;
  content: string;
}

interface OllamaChatResponse {
  model?: string;
  created_at?: string;
  message?: OllamaChatResponseMessage;
  done?: boolean;
}

interface OllamaTagsResponseItem {
  name: string; // e.g. "llama3.2:latest"
  model?: string;
  modified_at?: string;
  size?: number;
  digest?: string;
}

interface OllamaTagsResponse {
  models: OllamaTagsResponseItem[];
}

export class OllamaNetworkError extends Error {
  constructor(message: string) { super(message); this.name = 'OllamaNetworkError'; }
}
export class OllamaTimeoutError extends Error {
  constructor(message: string) { super(message); this.name = 'OllamaTimeoutError'; }
}
export class OllamaModelNotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'OllamaModelNotFoundError'; }
}
export class OllamaInvalidResponseError extends Error {
  constructor(message: string) { super(message); this.name = 'OllamaInvalidResponseError'; }
}

const DEFAULT_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL_DEFAULT || 'llama3.2:latest';
const DEFAULT_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 10000);

// Enhanced service configuration
const DEFAULT_AI_CONFIG: OllamaAIServiceConfig = {
  model: DEFAULT_MODEL,
  temperature: 0.1,
  maxTokens: 500,
  retryAttempts: 3,
  timeoutMs: DEFAULT_TIMEOUT_MS,
  enableFallback: true,
  enableSentimentAnalysis: true,
  enablePredictiveAnalytics: true
};

let httpClient: AxiosInstance | null = null;
function getHttpClient(): AxiosInstance {
  if (httpClient) return httpClient;
  httpClient = axios.create({
    baseURL: DEFAULT_BASE_URL,
    headers: process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : undefined,
  });
  return httpClient;
}

// Enhanced prompt engineering with context injection
const buildEnhancedPrompt = (template: string, variables: Record<string, any>): string => {
  let prompt = template;
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    if (typeof value === 'object') {
      prompt = prompt.replace(placeholder, JSON.stringify(value, null, 2));
    } else {
      prompt = prompt.replace(placeholder, String(value));
    }
  });
  return prompt;
};

// Retry mechanism with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Availability cache with per-model granularity
const availabilityCache = new Map<string, { ts: number; result: boolean }>();
const AVAILABILITY_TTL_MS = 30_000;

export async function isOllamaAvailable(model?: string): Promise<boolean> {
  const key = model ?? '*';
  const now = Date.now();
  const cached = availabilityCache.get(key);
  if (cached && now - cached.ts < AVAILABILITY_TTL_MS) return cached.result;

  try {
    const client = getHttpClient();
    const resp = await client.get<OllamaTagsResponse>('/api/tags', { timeout: 2500 });
    const models = Array.isArray(resp.data?.models) ? resp.data.models : [];
    const hasModels = models.length > 0;
    const requested = model ?? '';
    const requestedBase = requested.split(':')[0];
    // Prefer exact match on full tag if provided; otherwise fallback to base-name match
    const hasRequestedModel = model
      ? models.some(m => {
          const name = typeof m.name === 'string' ? m.name : '';
          if (!name) return false;
          if (requested.includes(':')) {
            return name === requested;
          }
          return name.split(':')[0] === requestedBase;
        })
      : hasModels;
    availabilityCache.set(key, { ts: now, result: !!hasRequestedModel });
    return !!hasRequestedModel;
  } catch {
    availabilityCache.set(key, { ts: now, result: false });
    return false;
  }
}

// Enhanced chat completion with retry and fallback
export async function enhancedChatCompletion(
  messages: OllamaMessage[],
  config?: Partial<OllamaAIServiceConfig>
): Promise<string> {
  const finalConfig = { ...DEFAULT_AI_CONFIG, ...config };
  
  const operation = async (): Promise<string> => {
    const model = finalConfig.model || DEFAULT_MODEL;
    const temperature = finalConfig.temperature;
    const maxTokens = finalConfig.maxTokens;
    const timeoutMs = finalConfig.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const precheckAvailability = (finalConfig as any).precheckAvailability === true;

    try {
      // Optional fast failure path for offline or missing model
      if (precheckAvailability) {
        const available = await isOllamaAvailable(model);
        if (!available) {
          throw new OllamaModelNotFoundError(`Ollama model not available or host offline: ${model}`);
        }
        // Lightweight readiness probe with num_predict: 0
        try {
          const client = getHttpClient();
          const reqProbe: OllamaChatRequest = {
            model,
            messages: [{ role: 'user', content: 'ping' }],
            stream: false,
            options: { num_predict: 0 },
          };
          await client.post<OllamaChatResponse>('/api/chat', reqProbe, { timeout: Math.min(1500, timeoutMs) });
        } catch {
          // Ignore probe failures; main request may still work if server is slow to warm
        }
      }
      const client = getHttpClient();
      const options: any = {};
      if (temperature != null) options.temperature = temperature;
      if (maxTokens != null) options.num_predict = maxTokens;
      const req: OllamaChatRequest = {
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
        ...(Object.keys(options).length ? { options } : {}),
      };

      const resp = await client.post<OllamaChatResponse>('/api/chat', req, { timeout: timeoutMs });
      if ((resp.data as any)?.error) {
        throw new OllamaInvalidResponseError(String((resp.data as any).error));
      }
      const content = resp.data?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new OllamaInvalidResponseError('Ollama returned empty or invalid content');
      }
      return content.trim();
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          throw new OllamaTimeoutError('Ollama request timed out');
        }
        if (err.response?.status === 404) {
          throw new OllamaModelNotFoundError(`Ollama model not found: ${model}`);
        }
        throw new OllamaNetworkError(err.message || 'Ollama network error');
      }
      throw err;
    }
  };

  return retryWithBackoff(operation, finalConfig.retryAttempts);
}

export async function chatCompletion(
  messages: OllamaMessage[],
  config?: OllamaConfig
): Promise<string> {
  const model = config?.model || DEFAULT_MODEL;
  const temperature = config?.temperature;
  const maxTokens = config?.maxTokens;
  const timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const precheckAvailability = config?.precheckAvailability === true;

  try {
    // Optional fast failure path for offline or missing model
    if (precheckAvailability) {
      const available = await isOllamaAvailable(model);
      if (!available) {
        throw new OllamaModelNotFoundError(`Ollama model not available or host offline: ${model}`);
      }
      // Lightweight readiness probe with num_predict: 0
      try {
        const client = getHttpClient();
        const reqProbe: OllamaChatRequest = {
          model,
          messages: [{ role: 'user', content: 'ping' }],
          stream: false,
          options: { num_predict: 0 },
        };
        await client.post<OllamaChatResponse>('/api/chat', reqProbe, { timeout: Math.min(1500, timeoutMs) });
      } catch {
        // Ignore probe failures; main request may still work if server is slow to warm
      }
    }
    const client = getHttpClient();
    const options: any = {};
    if (temperature != null) options.temperature = temperature;
    if (maxTokens != null) options.num_predict = maxTokens;
    const req: OllamaChatRequest = {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
      ...(Object.keys(options).length ? { options } : {}),
    };

    const resp = await client.post<OllamaChatResponse>('/api/chat', req, { timeout: timeoutMs });
    if ((resp.data as any)?.error) {
      throw new OllamaInvalidResponseError(String((resp.data as any).error));
    }
    const content = resp.data?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new OllamaInvalidResponseError('Ollama returned empty or invalid content');
    }
    return content.trim();
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') {
        throw new OllamaTimeoutError('Ollama request timed out');
      }
      if (err.response?.status === 404) {
        throw new OllamaModelNotFoundError(`Ollama model not found: ${model}`);
      }
      throw new OllamaNetworkError(err.message || 'Ollama network error');
    }
    throw err;
  }
}

// Generate comprehensive debrief report using Ollama
export async function generateOllamaDebriefReport(
  eventData: any,
  config?: Partial<OllamaAIServiceConfig>
): Promise<OllamaDebriefReport | null> {
  try {
    const prompt = buildEnhancedPrompt(OLLAMA_PROMPT_TEMPLATES.debriefGeneration, { eventData });
    
    const response = await enhancedChatCompletion([
      { role: 'system', content: 'You are an expert event management analyst specializing in incident debrief reports.' },
      { role: 'user', content: prompt }
    ], config);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Ollama');
    }

    const debrief = JSON.parse(jsonMatch[0]);
    return debrief as OllamaDebriefReport;
  } catch (error) {
    console.error('Ollama debrief generation error:', error);
    return null;
  }
}

// Advanced sentiment analysis using Ollama
export async function analyzeOllamaSentiment(
  text: string,
  config?: Partial<OllamaAIServiceConfig>
): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: string[];
  urgency: number;
  keyPhrases: string[];
} | null> {
  try {
    const prompt = buildEnhancedPrompt(OLLAMA_PROMPT_TEMPLATES.sentimentAnalysis, { text });
    
    const response = await enhancedChatCompletion([
      { role: 'system', content: 'You are an expert sentiment analysis AI specializing in incident management communications.' },
      { role: 'user', content: prompt }
    ], config);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Ollama');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Ollama sentiment analysis error:', error);
    return null;
  }
}

// Predictive analytics for incident forecasting using Ollama
export async function generateOllamaPredictiveAnalytics(
  incidentHistory: any[],
  config?: Partial<OllamaAIServiceConfig>
): Promise<{
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
} | null> {
  try {
    const prompt = buildEnhancedPrompt(OLLAMA_PROMPT_TEMPLATES.predictiveAnalytics, { incidentHistory });
    
    const response = await enhancedChatCompletion([
      { role: 'system', content: 'You are an expert predictive analytics AI specializing in event security and incident prevention.' },
      { role: 'user', content: prompt }
    ], config);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Ollama');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Ollama predictive analytics error:', error);
    return null;
  }
}

// Natural language search query processing using Ollama
export async function processNaturalLanguageSearch(
  query: string,
  config?: Partial<OllamaAIServiceConfig>
): Promise<{
  searchTerms: string[];
  filters: {
    incidentType: string[];
    severity: string[];
    timeRange: string;
    location: string[];
  };
  intent: string;
  suggestedQueries: string[];
} | null> {
  try {
    const prompt = buildEnhancedPrompt(OLLAMA_PROMPT_TEMPLATES.naturalLanguageSearch, { query });
    
    const response = await enhancedChatCompletion([
      { role: 'system', content: 'You are an expert search assistant for incident management systems.' },
      { role: 'user', content: prompt }
    ], config);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Ollama');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Ollama search processing error:', error);
    return null;
  }
}

// Enhanced incident categorization using Ollama
export async function categorizeIncidentWithOllama(
  description: string,
  incidentType?: string,
  location?: string,
  config?: Partial<OllamaAIServiceConfig>
): Promise<{
  category: string;
  confidence: number;
  severity: string;
  tags: string[];
  requiresEscalation: boolean;
  suggestedActions: string[];
  reasoning: string;
} | null> {
  try {
    const fullDescription = `${description} ${incidentType || ''} ${location || ''}`;
    const prompt = buildEnhancedPrompt(OLLAMA_PROMPT_TEMPLATES.incidentCategorization, { description: fullDescription });
    
    const response = await enhancedChatCompletion([
      { role: 'system', content: 'You are an expert incident management AI specializing in incident categorization and analysis.' },
      { role: 'user', content: prompt }
    ], config);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Ollama');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Ollama incident categorization error:', error);
    return null;
  }
}


