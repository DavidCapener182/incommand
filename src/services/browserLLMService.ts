import type { MLCEngine as MLCEngineType } from '@mlc-ai/web-llm';
import { extractIncidentJson } from '@/utils/incidentJson';
import { INCIDENT_EXTRACTION_SYSTEM, buildIncidentExtractionUser } from '@/prompts/incidentExtraction';
import { logger } from '@/lib/logger'

// Interface matching the structure expected by the incident parsing system
export interface BrowserLLMResult {
  incidentType: string;
  description: string;
  callsign: string;
  location: string;
  priority: string;
  confidence: number;
  actionTaken?: string;
}

// Enhanced AI service interfaces
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

// Advanced prompt templates
const PROMPT_TEMPLATES = {
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
}`
};

// Singleton pattern for the MLCEngine instance
let engineInstance: MLCEngineType | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;
let lastInitError: Error | null = null;

// Default model can be configured via env var for browser-friendly sizes
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_WEBLLM_MODEL_ID || 'Llama-3.2-3B-Instruct-q4f32_1-MLC';
const ASSET_BASE_URL = process.env.NEXT_PUBLIC_WEBLLM_ASSET_BASE_URL || '';

// Service configuration
const DEFAULT_CONFIG: AIServiceConfig = {
  model: DEFAULT_MODEL,
  temperature: 0.1,
  maxTokens: 500,
  retryAttempts: 3,
  timeoutMs: 30000,
  enableFallback: true,
  enableSentimentAnalysis: true,
  enablePredictiveAnalytics: true
};

// Normalize message.content which may be a string or array of parts
const normalizeLLMContent = (raw: unknown): string => {
  if (Array.isArray(raw)) {
    const parts = raw
      .map((p: any) => {
        if (typeof p === 'string') return p;
        if (p && typeof p === 'object') {
          if (typeof p.text === 'string') return p.text;
          if (p.type && typeof p.text === 'string') return p.text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
    return parts.trim();
  }
  if (typeof raw === 'string') return raw.trim();
  if (raw && typeof raw === 'object' && typeof (raw as any).text === 'string') {
    return ((raw as any).text as string).trim();
  }
  return '';
};

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

// Initialize the browser LLM engine
export const initializeBrowserLLM = async (onProgress?: (progress: number) => void): Promise<void> => {
  if (engineInstance) return;
  if (isInitializing) return initializationPromise ?? Promise.resolve();
  isInitializing = true;
  initializationPromise = (async () => {
    try {
      if (!isWebGPUAvailable() && !isWASMAvailable()) {
        throw new Error('Neither WebGPU nor WASM available');
      }
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      const initProgressCallback = (report: any) => {
        const frac = typeof report === 'number' ? report : (report?.progress ?? 0);
        onProgress?.(Math.max(0, Math.min(1, frac)));
      };

      const baseOptions: any = {
        model: DEFAULT_MODEL,
        initProgressCallback,
      };
      if (ASSET_BASE_URL) {
        // Optional asset base for first-load reliability
        baseOptions.appConfig = { asset_base_url: ASSET_BASE_URL } as any;
      }

      try {
        const engine = await CreateMLCEngine(baseOptions);
        engineInstance = engine;
      } catch (e: any) {
        const fallback = process.env.NEXT_PUBLIC_WEBLLM_FALLBACK_MODEL_ID;
        if (fallback) {
          const optionsFallback: any = { ...baseOptions, model: fallback };
          const engine = await CreateMLCEngine(optionsFallback);
          engineInstance = engine;
        } else {
          throw e;
        }
      }

      const debug = process.env.NODE_ENV !== 'production';
      if (debug) {
        logger.debug('Browser LLM initialized successfully', { component: 'BrowserLLMService', action: 'initializeBrowserLLM' });
      }
      lastInitError = null;
    } catch (error) {
      logger.error('Failed to initialize browser LLM', error, { component: 'BrowserLLMService', action: 'initializeBrowserLLM' });
      engineInstance = null;
      lastInitError = error as Error;
      throw error;
    }
  })().finally(() => { isInitializing = false; });
  return initializationPromise;
};

// Check if browser LLM is available and ready
export const isBrowserLLMAvailable = (): boolean => {
  return engineInstance !== null && !isInitializing;
};

// Ensure browser LLM is initialized before use
export const ensureBrowserLLM = async (onProgress?: (progress: number) => void): Promise<void> => {
  if (engineInstance) return;
  if (isInitializing && initializationPromise) return initializationPromise;
  if (!isBrowserLLMAvailable()) {
    await initializeBrowserLLM(onProgress);
  }
};

// Enhanced chat completion with retry and fallback
export const enhancedChatCompletion = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  config: Partial<AIServiceConfig> = {}
): Promise<string> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!engineInstance) {
    throw new Error('Browser LLM not initialized');
  }

  const operation = async (): Promise<string> => {
    try {
      const response = await engineInstance!.chat.completions.create({
        messages,
        temperature: finalConfig.temperature,
        max_tokens: finalConfig.maxTokens
      });

      const content = normalizeLLMContent(response?.choices?.[0]?.message?.content as any);
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      return content;
    } catch (error) {
      logger.error('LLM chat completion error', error, { component: 'BrowserLLMService', action: 'enhancedChatCompletion' });
      throw error;
    }
  };

  return retryWithBackoff(operation, finalConfig.retryAttempts);
};

// Parse incident text using browser LLM
export const parseIncidentWithBrowserLLM = async (
  input: string, 
  incidentTypes: string[]
): Promise<BrowserLLMResult | null> => {
  if (!engineInstance) {
    throw new Error('Browser LLM not initialized');
  }

  try {
    // Format the prompt using shared helpers to stay in sync with the server
    const systemPrompt = INCIDENT_EXTRACTION_SYSTEM;
    const userPrompt = buildIncidentExtractionUser(incidentTypes, input);

    // Use the correct WebLLM chat completion API
    const response = await engineInstance.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
      max_tokens: 250
    });

    // Normalize message content (can be string or array of parts)
    let contentRaw: any = response?.choices?.[0]?.message?.content as any;
    const content = normalizeLLMContent(contentRaw);
    const debug = process.env.NODE_ENV !== 'production';
    if (debug) {
      logger.debug('WebLLM raw response', { component: 'BrowserLLMService', action: 'parseIncidentWithBrowserLLM', response });
      logger.debug('WebLLM content (normalized)', { component: 'BrowserLLMService', action: 'parseIncidentWithBrowserLLM', content });
    }
    if (!content) return null;

    const extracted = extractIncidentJson(content, input)
    if (!extracted) return null
    const normalized: BrowserLLMResult = {
      incidentType: extracted.incidentType,
      description: extracted.description,
      callsign: extracted.callsign,
      location: extracted.location,
      priority: extracted.priority,
      confidence: extracted.confidence,
      actionTaken: extracted.actionTaken,
    }
    return normalized
  } catch (error) {
    logger.error('Browser LLM parsing error', error, { component: 'BrowserLLMService', action: 'parseIncidentWithBrowserLLM' });
    return null; // Return null instead of throwing to allow fallback
  }
};

// Generate comprehensive debrief report
export const generateDebriefReport = async (
  eventData: any,
  config: Partial<AIServiceConfig> = {}
): Promise<DebriefReport | null> => {
  try {
    const prompt = buildEnhancedPrompt(PROMPT_TEMPLATES.debriefGeneration, { eventData });
    
    const response = await enhancedChatCompletion([
      { role: 'system', content: 'You are an expert event management analyst specializing in incident debrief reports.' },
      { role: 'user', content: prompt }
    ], config);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from LLM');
    }

    const debrief = JSON.parse(jsonMatch[0]);
    return debrief as DebriefReport;
  } catch (error) {
    logger.error('Debrief generation error', error, { component: 'BrowserLLMService', action: 'generateDebriefReport' });
    return null;
  }
};

// Advanced sentiment analysis
export const analyzeSentiment = async (
  text: string,
  config: Partial<AIServiceConfig> = {}
): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: string[];
  urgency: number;
  keyPhrases: string[];
} | null> => {
  try {
    const prompt = buildEnhancedPrompt(PROMPT_TEMPLATES.sentimentAnalysis, { text });
    
    const response = await enhancedChatCompletion([
      { role: 'system', content: 'You are an expert sentiment analysis AI specializing in incident management communications.' },
      { role: 'user', content: prompt }
    ], config);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from LLM');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Sentiment analysis error', error, { component: 'BrowserLLMService', action: 'analyzeSentiment' });
    return null;
  }
};

// Predictive analytics for incident forecasting
export const generatePredictiveAnalytics = async (
  incidentHistory: any[],
  config: Partial<AIServiceConfig> = {}
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
} | null> => {
  try {
    const prompt = buildEnhancedPrompt(PROMPT_TEMPLATES.predictiveAnalytics, { incidentHistory });
    
    const response = await enhancedChatCompletion([
      { role: 'system', content: 'You are an expert predictive analytics AI specializing in event security and incident prevention.' },
      { role: 'user', content: prompt }
    ], config);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from LLM');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Predictive analytics error', error, { component: 'BrowserLLMService', action: 'generatePredictiveAnalytics' });
    return null;
  }
};

// Helper: rewrite occurrence and actions into clean sentences
export const rewriteIncidentFieldsWithBrowserLLM = async (
  occurrence: string,
  actions: string
): Promise<{ occurrence: string; actionTaken: string } | null> => {
  if (!engineInstance) {
    throw new Error('Browser LLM not initialized');
  }

  try {
    const systemPrompt = 'You are a writing assistant for incident logs. You rewrite text into clear, concise sentences.';
    const userPrompt = `Rewrite the following into clean sentences. Return strict JSON with keys: occurrence, actionTaken.
- occurrence: rewrite into a single grammatically correct sentence, neutral tone, remove callsigns, keep essential details only.
- actionTaken: turn the list/phrases into 1-3 clear sentences in imperative or past-tense operational style. Do not prefix with "Actions:".

Input Occurrence: "${occurrence}"
Input Actions: "${actions}"`;

    const response = await engineInstance.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
      max_tokens: 220
    });

    const content = normalizeLLMContent(response?.choices?.[0]?.message?.content as any);
    if (!content) return null;

    const fence = content.match(/```json[\s\S]*?```|```[\s\S]*?```/i);
    const candidate = fence ? fence[0].replace(/```json|```/gi, '').trim() : content;
    const match = candidate.match(/\{[\s\S]*?\}/);
    if (match) {
      try {
        const result = JSON.parse(match[0]);
        return { occurrence: result.occurrence || occurrence, actionTaken: result.actionTaken || actions };
      } catch {
        return null;
      }
    }
    return null;
  } catch (e) {
    console.error('Rewrite error:', e);
    return null;
  }
};

// Helper functions to check browser capabilities
const isWebGPUAvailable = (): boolean => {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
};

const isWASMAvailable = (): boolean => {
  return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
};

// Cleanup function to free resources
export const cleanupBrowserLLM = (): void => {
  if (engineInstance) {
    try {
      const anyEngine = engineInstance as any;
      if (typeof anyEngine.terminate === 'function') {
        anyEngine.terminate();
      } else if (typeof anyEngine.dispose === 'function') {
        anyEngine.dispose();
      }
    } catch (error) {
      console.error('Error cleaning up browser LLM:', error);
    }
    engineInstance = null;
  }
  isInitializing = false;
  initializationPromise = null;
};

// Expose status for UI feedback
export const getBrowserLLMStatus = () => {
  const supported = isWebGPUAvailable() || isWASMAvailable();
  return {
    supported,
    ready: engineInstance !== null && !isInitializing,
    initializing: isInitializing,
    error: lastInitError ? (lastInitError.message || String(lastInitError)) : null,
    modelId: DEFAULT_MODEL,
  } as const;
};
