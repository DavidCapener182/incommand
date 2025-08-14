import { createClient } from '@supabase/supabase-js';
import { chatCompletion as ollamaChatCompletion, isOllamaAvailable } from '@/services/ollamaService';

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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function analyzeSentiment(posts: string[]): Promise<SentimentScore[]> {
  if (!posts.length) return [];

  const results: SentimentScore[] = [];
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // If OpenAI key is missing, try Ollama; otherwise neutral
  if (!openaiApiKey) {
    try {
      const available = await isOllamaAvailable();
      const batchSize = 20;
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        if (available) {
          const batchResults = await analyzeBatchWithOllama(batch);
          results.push(...batchResults);
        } else {
          results.push(...batch.map(() => 0 as SentimentScore));
        }
      }
      return results;
    } catch (e) {
      return posts.map(() => 0 as SentimentScore);
    }
  }

  // Process posts in batches of 20
  const batchSize = 20;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const batchResults = await analyzeBatch(batch, openaiApiKey);
    results.push(...batchResults);
  }

  return results;
}

async function analyzeBatch(posts: string[], apiKey: string): Promise<SentimentScore[]> {
  const systemPrompt = `You are a sentiment analysis expert. Analyze each social media post and classify it as:
- 1 for positive sentiment (happy, satisfied, praising, etc.)
- 0 for neutral sentiment (factual, indifferent, etc.)
- -1 for negative sentiment (angry, complaining, critical, etc.)

Respond with only a JSON array of numbers, one for each post. Example: [1, 0, -1, 1]`;

  const userPrompt = `Analyze these social media posts:\n${posts.map((post, i) => `${i + 1}. ${post}`).join('\n')}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_SENTIMENT_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response (strip fences if present)
    const fenced = content.match(/```json[\s\S]*?```|```[\s\S]*?```/i);
    const candidate = fenced ? fenced[0].replace(/```json|```/gi, '').trim() : content;
    const sentimentArray = JSON.parse(candidate);
    
    // Validate and convert to SentimentScore type
    const validScores: SentimentScore[] = sentimentArray.map((score: any) => {
      const num = parseInt(score);
      if (num === 1 || num === 0 || num === -1) {
        return num as SentimentScore;
      }
      return 0; // Default to neutral if invalid
    });

    // Log AI usage
    await logAIUsage('sentiment_analysis', posts.length, data.usage?.total_tokens || 0, 'openai');

    return validScores;

  } catch (error) {
    // OpenAI failed; attempt Ollama fallback
    try {
      const available = await isOllamaAvailable();
      if (!available) {
        throw new Error('Ollama not available');
      }
      const content = await analyzeBatchWithOllama(posts);
      // Log AI usage for Ollama with 0 tokens if unknown
      await logAIUsage('sentiment_analysis', posts.length, 0, 'ollama');
      return content;
    } catch (fallbackErr) {
      console.error('Sentiment analysis failed (OpenAI, then Ollama):', error, fallbackErr);
      // Return neutral sentiment for all posts in case of error
      return posts.map(() => 0 as SentimentScore);
    }
  }
}

// Analyze a batch with Ollama using the same prompts
async function analyzeBatchWithOllama(posts: string[]): Promise<SentimentScore[]> {
  try {
    const model = process.env.OLLAMA_MODEL_SENTIMENT;
    const systemPrompt = `You are a sentiment analysis expert. Analyze each social media post and classify it as:
 - 1 for positive sentiment (happy, satisfied, praising, etc.)
 - 0 for neutral sentiment (factual, indifferent, etc.)
 - -1 for negative sentiment (angry, complaining, critical, etc.)

 Respond with only a JSON array of numbers, one for each post. Example: [1, 0, -1, 1]`;
    const userPrompt = `Analyze these social media posts:\n${posts.map((post, i) => `${i + 1}. ${post}`).join('\n')}`;
    const content = await ollamaChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { model, temperature: 0.1, maxTokens: 120 });

    const fenced = content.match(/```json[\s\S]*?```|```[\s\S]*?```/i);
    const candidate = fenced ? fenced[0].replace(/```json|```/gi, '').trim() : content;
    const sentimentArray = JSON.parse(candidate);

    const validScores: SentimentScore[] = sentimentArray.map((score: any) => {
      const num = parseInt(score);
      if (num === 1 || num === 0 || num === -1) return num as SentimentScore;
      return 0;
    });
    return validScores;
  } catch (e) {
    return posts.map(() => 0 as SentimentScore);
  }
}

async function logAIUsage(operation: string, postsAnalyzed: number, tokensUsed: number, source: 'openai' | 'ollama') {
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
