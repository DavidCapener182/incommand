import { NextRequest, NextResponse } from 'next/server';

interface SocialPost {
  id: string;
  text: string;
  created_at: string;
  platform: 'mastodon';
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

    const instanceUrl = process.env.MASTODON_INSTANCE_URL || 'https://mastodon.social';
    const accessToken = process.env.MASTODON_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.warn('Mastodon Access Token not found, using mock data');
      const mockData = generateMockMastodonData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Build Mastodon API URL for search
    const baseUrl = `${instanceUrl}/api/v2/search`;
    const params = new URLSearchParams({
      q: query,
      type: 'statuses',
      limit: Math.min(count, 40).toString(),
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Mastodon API error:', response.status, response.statusText);
      const mockData = generateMockMastodonData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    const data = await response.json();
    
    // Transform Mastodon API response to SocialPost format
    const posts: SocialPost[] = (data.statuses || []).map((status: any) => ({
      id: status.id,
      text: status.content.replace(/<[^>]*>/g, ''), // Remove HTML tags
      created_at: status.created_at,
      platform: 'mastodon' as const,
    }));

    cache.set(cacheKey, { data: posts, timestamp: Date.now() });
    return NextResponse.json(posts);

  } catch (error) {
    console.error('Error fetching Mastodon data:', error);
    const mockData = generateMockMastodonData(20);
    return NextResponse.json(mockData);
  }
}

function generateMockMastodonData(count: number): SocialPost[] {
  const mockPosts = [
    "Great event security tonight! Everything running smoothly #EventSecurity #SafetyFirst",
    "Security team doing an excellent job managing crowd flow at the venue",
    "Minor incident handled professionally by security staff - quick response time",
    "Event atmosphere is fantastic, security presence reassuring for everyone",
    "Quick response from security team to a small disturbance - well handled",
    "Professional security staff making everyone feel safe and secure",
    "Security team efficiently managing entry points and crowd control",
    "Excellent crowd control by security personnel throughout the event",
    "Minor altercation resolved quickly by security - professional approach",
    "Security team maintaining order throughout the event - great work",
    "Event security doing a fantastic job keeping everyone safe tonight",
    "Security presence is strong and reassuring at the venue",
    "Quick and efficient response from security team to minor issues",
    "Professional security staff making the event experience smooth",
    "Great job by security team managing entry points and crowd flow"
  ];

  return Array.from({ length: Math.min(count, mockPosts.length) }, (_, i) => ({
    id: `mock_mastodon_${i + 1}`,
    text: mockPosts[i],
    created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    platform: 'mastodon' as const,
  }));
}
