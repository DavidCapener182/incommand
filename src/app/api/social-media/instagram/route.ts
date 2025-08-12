import { NextRequest, NextResponse } from 'next/server';

interface SocialPost {
  id: string;
  text: string;
  created_at: string;
  platform: 'instagram';
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

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const appId = process.env.INSTAGRAM_APP_ID;
    
    if (!accessToken || !appId) {
      console.warn('Instagram credentials not found, using mock data');
      const mockData = generateMockInstagramData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Build Instagram Graph API URL for hashtag search
    const baseUrl = `https://graph.instagram.com/v12.0/ig_hashtag_search`;
    const params = new URLSearchParams({
      user_token: accessToken,
      q: query.replace(/\s+/g, ''), // Remove spaces for hashtag search
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Instagram API error:', response.status, response.statusText);
      const mockData = generateMockInstagramData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    const data = await response.json();
    
    // Transform Instagram API response to SocialPost format
    const posts: SocialPost[] = (data.data || []).map((post: any) => ({
      id: post.id,
      text: post.caption || 'No caption',
      created_at: post.timestamp,
      platform: 'instagram' as const,
    }));

    cache.set(cacheKey, { data: posts, timestamp: Date.now() });
    return NextResponse.json(posts);

  } catch (error) {
    console.error('Error fetching Instagram data:', error);
    const mockData = generateMockInstagramData(20);
    return NextResponse.json(mockData);
  }
}

function generateMockInstagramData(count: number): SocialPost[] {
  const mockPosts = [
    "Amazing event security team keeping everyone safe! 🔒 #EventSecurity #SafetyFirst",
    "Security staff doing an incredible job managing the crowd flow",
    "Professional security response to a minor incident - handled perfectly",
    "Feeling safe and secure thanks to the excellent security presence",
    "Quick and efficient security team response to a small disturbance",
    "Security personnel making the event experience smooth and worry-free",
    "Great job by security team managing entry points and crowd control",
    "Security staff maintaining excellent order throughout the event",
    "Minor situation resolved quickly and professionally by security",
    "Security team ensuring everyone has a great time safely"
  ];

  return Array.from({ length: Math.min(count, mockPosts.length) }, (_, i) => ({
    id: `mock_instagram_${i + 1}`,
    text: mockPosts[i],
    created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    platform: 'instagram' as const,
  }));
}
