import { chatCompletion as ollamaChatCompletion, isOllamaAvailable, OllamaModelNotFoundError } from '@/services/ollamaService';
import OpenAI from 'openai';
import { extractJsonFromText } from '@/lib/ai/jsonUtils';
import { getServiceClient } from './supabaseServer';

// TypeScript interfaces
export interface SocialPost {
  id: string;
  text: string;
  created_at: string;
  platform: 'twitter' | 'instagram';
}

export type SentimentScore = -1 | 0 | 1;

export interface PlatformStats {
  count: number;
  avgSentiment: number;
}

export interface SocialPulseSummary {
  platformStats: {
    twitter: PlatformStats;
    instagram: PlatformStats;
  };
  combined: {
    totalPosts: number;
    avgSentiment: number;
    positivePosts: number;
    negativePosts: number;
    neutralPosts: number;
  };
}

// In-memory cache for sentiment analysis
const sentimentCache = new Map<string, SentimentScore>();

// Shared system prompt for sentiment analysis
const SENTIMENT_SYSTEM_PROMPT = `You are a sentiment analysis expert. Analyze each social media post and classify it as:
- 1 for positive sentiment (happy, satisfied, praising, etc.)
- 0 for neutral sentiment (factual, indifferent, etc.)
- -1 for negative sentiment (angry, complaining, critical, etc.)

Respond with only a JSON array of numbers, one for each post. Example: [1, 0, -1, 1]`;

// Initialize Supabase client
const supabase = getServiceClient();

// Helper to parse/normalize sentiment arrays into fixed-length scores
export function parseSentimentArray(candidate: string, expectedLength: number): SentimentScore[] {
  let parsed: any;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    parsed = [];
  }
  let scores = Array.isArray(parsed) ? parsed : [];
  let validScores: SentimentScore[] = scores.map((score: any) => {
    const num = Number(score);
    return num === 1 || num === 0 || num === -1 ? (num as SentimentScore) : 0;
  });
  if (validScores.length < expectedLength) {
    validScores = validScores.concat(Array(expectedLength - validScores.length).fill(0 as SentimentScore));
  }
  if (validScores.length > expectedLength) {
    validScores = validScores.slice(0, expectedLength);
  }
  return validScores;
}

export async function analyzeSentiment(posts: string[]): Promise<SentimentScore[]> {
  if (!posts.length) return [];
  const batchSize = 20;

  // Prepare results array and identify uncached posts
  const results: SentimentScore[] = Array(posts.length).fill(0 as SentimentScore);
  const uncachedIndices: number[] = [];
  const uncachedPosts: string[] = [];
  posts.forEach((post, index) => {
    const cached = sentimentCache.get(post);
    if (cached !== undefined) {
      results[index] = cached;
    } else {
      uncachedIndices.push(index);
      uncachedPosts.push(post);
    }
  });

  // If everything was cached, return immediately
  if (uncachedPosts.length === 0) return results;

  const openaiApiKey = process.env.OPENAI_API_KEY;

  // If OpenAI key is missing, try Ollama; otherwise neutral
  if (!openaiApiKey) {
    try {
      const model = process.env.OLLAMA_MODEL_SENTIMENT;
      const available = await isOllamaAvailable(model);
      for (let i = 0; i < uncachedPosts.length; i += batchSize) {
        const batch = uncachedPosts.slice(i, i + batchSize);
        if (available) {
          const { scores: batchResults, modelUsed } = await analyzeBatchWithOllama(batch);
          // Write to results and cache
          batch.forEach((post, j) => {
            const score = batchResults[j] ?? (0 as SentimentScore);
            const originalIndex = uncachedIndices[i + j];
            results[originalIndex] = score;
            sentimentCache.set(post, score);
          });
          await logAIUsage('sentiment_analysis', batch.length, 0, 'ollama', { ollama_model: modelUsed });
        } else {
          batch.forEach((post, j) => {
            const originalIndex = uncachedIndices[i + j];
            results[originalIndex] = 0 as SentimentScore;
            sentimentCache.set(post, 0 as SentimentScore);
          });
        }
      }
      return results;
    } catch (e) {
      // On error, default to neutral for uncached items and write to cache
      uncachedPosts.forEach((post, idx) => {
        const originalIndex = uncachedIndices[idx];
        results[originalIndex] = 0 as SentimentScore;
        sentimentCache.set(post, 0 as SentimentScore);
      });
      return results;
    }
  }

  // Process uncached posts with OpenAI in batches
  for (let i = 0; i < uncachedPosts.length; i += batchSize) {
    const batch = uncachedPosts.slice(i, i + batchSize);
    const batchResults = await analyzeBatch(batch);
    batch.forEach((post, j) => {
      const score = batchResults[j] ?? (0 as SentimentScore);
      const originalIndex = uncachedIndices[i + j];
      results[originalIndex] = score;
      sentimentCache.set(post, score);
    });
  }

  return results;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function analyzeBatch(posts: string[]): Promise<SentimentScore[]> {
  const systemPrompt = SENTIMENT_SYSTEM_PROMPT;

  const userPrompt = `Analyze these social media posts:\n${posts.map((post, i) => `${i + 1}. ${post}`).join('\n')}`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_SENTIMENT_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 120,
    });
    const content = response.choices[0]?.message?.content ?? '';
    if (!content) throw new Error('No content in OpenAI response');
    const candidate = extractJsonFromText(content);
    const validScores = parseSentimentArray(candidate, posts.length);

    // Log AI usage
    await logAIUsage('sentiment_analysis', posts.length, (response as any).usage?.total_tokens || 0, 'openai');

    return validScores;

  } catch (error) {
    // OpenAI failed; attempt Ollama fallback
    try {
      const { scores, modelUsed } = await analyzeBatchWithOllama(posts);
      // Log AI usage for Ollama with 0 tokens if unknown
      await logAIUsage('sentiment_analysis', posts.length, 0, 'ollama', { ollama_model: modelUsed });
      return scores;
    } catch (fallbackErr) {
      console.error('Sentiment analysis failed (OpenAI, then Ollama):', error, fallbackErr);
      // Return neutral sentiment for all posts in case of error
      return posts.map(() => 0 as SentimentScore);
    }
  }
}

// Analyze a batch with Ollama using the same prompts
async function analyzeBatchWithOllama(posts: string[]): Promise<{ scores: SentimentScore[]; modelUsed?: string }> {
  try {
    let model = process.env.OLLAMA_MODEL_SENTIMENT;
    const systemPrompt = SENTIMENT_SYSTEM_PROMPT;
    const userPrompt = `Analyze these social media posts:\n${posts.map((post, i) => `${i + 1}. ${post}`).join('\n')}`;
    // Try requested model if available; otherwise allow default/any available
    const content = await ollamaChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], model ? { model, temperature: 0.1, maxTokens: 120, precheckAvailability: true } : { temperature: 0.1, maxTokens: 120, precheckAvailability: true });
    const candidate = extractJsonFromText(content);
    return { scores: parseSentimentArray(candidate, posts.length), modelUsed: model };
  } catch (e) {
    return { scores: posts.map(() => 0 as SentimentScore), modelUsed: process.env.OLLAMA_MODEL_SENTIMENT };
  }
}

async function logAIUsage(operation: string, postsAnalyzed: number, tokensUsed: number, source: 'openai' | 'ollama', extraMetadata: Record<string, any> = {}) {
  try {
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert({
        operation,
        tokens_used: tokensUsed,
        metadata: {
          posts_analyzed: postsAnalyzed,
          timestamp: new Date().toISOString(),
          ai_source: source,
          ...extraMetadata,
        },
      });

    if (error) {
      console.error('Error logging AI usage:', error);
    }
  } catch (error) {
    console.error('Error logging AI usage:', error);
  }
}

export function calculatePlatformStats(posts: SocialPost[], sentiments: SentimentScore[]): PlatformStats {
  if (posts.length === 0) {
    return { count: 0, avgSentiment: 0 };
  }

  const totalSentiment = sentiments.reduce((sum, sentiment) => sum + sentiment, 0 as number);
  const avgSentiment = totalSentiment / posts.length;

  return {
    count: posts.length,
    avgSentiment: Math.round(avgSentiment * 100) / 100, // Round to 2 decimal places
  };
}

export function calculateCombinedStats(
  twitterStats: PlatformStats,
  instagramStats: PlatformStats,
  allSentiments: SentimentScore[]
): SocialPulseSummary['combined'] {
  const totalPosts = twitterStats.count + instagramStats.count;
  
  if (totalPosts === 0) {
    return {
      totalPosts: 0,
      avgSentiment: 0,
      positivePosts: 0,
      negativePosts: 0,
      neutralPosts: 0,
    };
  }

  const positivePosts = allSentiments.filter(s => s === 1).length;
  const negativePosts = allSentiments.filter(s => s === -1).length;
  const neutralPosts = allSentiments.filter(s => s === 0).length;

  const totalSentiment = allSentiments.reduce((sum, sentiment) => sum + sentiment, 0 as number);
  const avgSentiment = Math.round((totalSentiment / totalPosts) * 100) / 100;

  return {
    totalPosts,
    avgSentiment,
    positivePosts,
    negativePosts,
    neutralPosts,
  };
}
