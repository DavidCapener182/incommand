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
const DEFAULT_TIMEOUT_MS = 10000;

let httpClient: AxiosInstance | null = null;
function getHttpClient(): AxiosInstance {
  if (httpClient) return httpClient;
  httpClient = axios.create({
    baseURL: DEFAULT_BASE_URL,
    headers: process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : undefined,
  });
  return httpClient;
}

// Simple availability cache
let lastAvailabilityCheck = 0;
let lastAvailabilityResult = false;
const AVAILABILITY_TTL_MS = 30_000;

export async function isOllamaAvailable(): Promise<boolean> {
  const now = Date.now();
  if (now - lastAvailabilityCheck < AVAILABILITY_TTL_MS) {
    return lastAvailabilityResult;
  }
  try {
    const client = getHttpClient();
    const resp = await client.get<OllamaTagsResponse>('/api/tags', { timeout: 2500 });
    const hasModels = Array.isArray(resp.data?.models) && resp.data.models.length > 0;
    lastAvailabilityResult = !!hasModels;
    lastAvailabilityCheck = now;
    return lastAvailabilityResult;
  } catch (err: any) {
    lastAvailabilityResult = false;
    lastAvailabilityCheck = now;
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

  try {
    const client = getHttpClient();
    const req: OllamaChatRequest = {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
      options: {
        temperature,
        num_predict: maxTokens,
      },
    };

    const resp = await client.post<OllamaChatResponse>('/api/chat', req, { timeout: timeoutMs });
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


