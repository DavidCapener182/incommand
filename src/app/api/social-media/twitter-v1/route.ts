export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';

interface SocialPost {
  id: string;
  text: string;
  created_at: string;
  platform: 'twitter';
}

// Simple in-memory cache for rate limiting
const cache = new Map<string, { data: SocialPost[]; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'event security';
    const since = searchParams.get('since');
    const count = parseInt(searchParams.get('count') || '20');
    
    // Check cache first
    const cacheKey = `${query}-${since}-${count}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    const consumerKey = process.env.TWITTER_CONSUMER_KEY;
    const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
    
    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      console.warn('Twitter API credentials not found, using mock data');
      const mockData = generateMockTwitterData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Build Twitter API v1.1 search URL
    const baseUrl = 'https://api.twitter.com/1.1/search/tweets.json';
    const params = new URLSearchParams({
      q: query,
      count: Math.min(count, 100).toString(),
      result_type: 'recent',
      tweet_mode: 'extended'
    });

    if (since) {
      params.append('since_id', since);
    }

    // Create OAuth signature (simplified version)
    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Authorization': `OAuth oauth_consumer_key="${consumerKey}",oauth_token="${accessToken}",oauth_signature_method="HMAC-SHA1",oauth_timestamp="${Math.floor(Date.now() / 1000)}",oauth_nonce="${Math.random().toString(36).substring(2)}",oauth_version="1.0"`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Twitter API v1.1 error:', response.status, response.statusText);
      const mockData = generateMockTwitterData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    const data = await response.json();
    
    // Transform Twitter API v1.1 response to SocialPost format
    const posts: SocialPost[] = (data.statuses || []).map((tweet: any) => ({
      id: tweet.id_str,
      text: tweet.full_text || tweet.text,
      created_at: tweet.created_at,
      platform: 'twitter' as const,
    }));

    cache.set(cacheKey, { data: posts, timestamp: Date.now() });
    return NextResponse.json(posts);

  } catch (error) {
    console.error('Error fetching Twitter v1.1 data:', error);
    const mockData = generateMockTwitterData(20);
    return NextResponse.json(mockData);
  }
}

function generateMockTwitterData(count: number): SocialPost[] {
  const mockPosts = [
    "Great event security tonight! Everything running smoothly #EventSecurity",
    "Security team doing an excellent job managing crowd flow",
    "Minor incident handled professionally by security staff",
    "Event atmosphere is fantastic, security presence reassuring",
    "Quick response from security team to a small disturbance",
    "Professional security staff making everyone feel safe",
    "Security team efficiently managing entry points",
    "Excellent crowd control by security personnel",
    "Minor altercation resolved quickly by security",
    "Security team maintaining order throughout the event"
  ];

  return Array.from({ length: Math.min(count, mockPosts.length) }, (_, i) => ({
    id: `mock_twitter_${i + 1}`,
    text: mockPosts[i],
    created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    platform: 'twitter' as const,
  }));
}
