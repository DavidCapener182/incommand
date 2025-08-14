import type { MLCEngine as MLCEngineType } from '@mlc-ai/web-llm';
import { extractIncidentJson } from '@/utils/incidentJson';
import { INCIDENT_EXTRACTION_SYSTEM, buildIncidentExtractionUser } from '@/prompts/incidentExtraction';

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

// Singleton pattern for the MLCEngine instance
let engineInstance: MLCEngineType | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;
let lastInitError: Error | null = null;

// Default model can be configured via env var for browser-friendly sizes
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_WEBLLM_MODEL_ID || 'Llama-3.2-3B-Instruct-q4f32_1-MLC';
const ASSET_BASE_URL = process.env.NEXT_PUBLIC_WEBLLM_ASSET_BASE_URL || '';

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
        console.debug('Browser LLM initialized successfully');
      }
      lastInitError = null;
    } catch (error) {
      console.error('Failed to initialize browser LLM:', error);
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
      console.debug('WebLLM raw response:', response);
      console.debug('WebLLM content (normalized):', content);
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
    console.error('Browser LLM parsing error:', error);
    return null; // Return null instead of throwing to allow fallback
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
