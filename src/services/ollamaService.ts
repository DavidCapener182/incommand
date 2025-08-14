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

let httpClient: AxiosInstance | null = null;
function getHttpClient(): AxiosInstance {
  if (httpClient) return httpClient;
  httpClient = axios.create({
    baseURL: DEFAULT_BASE_URL,
    headers: process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : undefined,
  });
  return httpClient;
}

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


