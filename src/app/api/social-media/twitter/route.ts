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

    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    if (!bearerToken) {
      console.warn('Twitter Bearer Token not found, using mock data');
      const mockData = generateMockTwitterData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Build Twitter API URL
    const baseUrl = 'https://api.twitter.com/2/tweets/search/recent';
    const params = new URLSearchParams({
      query: query,
      max_results: Math.min(count, 100).toString(),
      'tweet.fields': 'created_at,author_id',
      'user.fields': 'username,name',
      expansions: 'author_id'
    });

    if (since) {
      params.append('start_time', since);
    }

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Twitter API error:', response.status, response.statusText);
      const mockData = generateMockTwitterData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    const data = await response.json();
    
    // Transform Twitter API response to SocialPost format
    const posts: SocialPost[] = (data.data || []).map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      platform: 'twitter' as const,
    }));

    cache.set(cacheKey, { data: posts, timestamp: Date.now() });
    return NextResponse.json(posts);

  } catch (error) {
    console.error('Error fetching Twitter data:', error);
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
