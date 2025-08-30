export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';

interface SocialPost {
  id: string;
  text: string;
  created_at: string;
  platform: 'facebook';
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

    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const appId = process.env.FACEBOOK_APP_ID;
    
    if (!accessToken || !appId) {
      console.warn('Facebook API credentials not found, using mock data');
      const mockData = generateMockFacebookData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Build Facebook Graph API URL for search
    const baseUrl = 'https://graph.facebook.com/v18.0/search';
    const params = new URLSearchParams({
      q: query,
      type: 'post',
      limit: Math.min(count, 25).toString(),
      access_token: accessToken,
      fields: 'id,message,created_time,from'
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Facebook API error:', response.status, response.statusText);
      const mockData = generateMockFacebookData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    const data = await response.json();
    
    // Transform Facebook API response to SocialPost format
    const posts: SocialPost[] = (data.data || []).map((post: any) => ({
      id: post.id,
      text: post.message || 'No text content',
      created_at: post.created_time,
      platform: 'facebook' as const,
    }));

    cache.set(cacheKey, { data: posts, timestamp: Date.now() });
    return NextResponse.json(posts);

  } catch (error) {
    console.error('Error fetching Facebook data:', error);
    const mockData = generateMockFacebookData(20);
    return NextResponse.json(mockData);
  }
}

function generateMockFacebookData(count: number): SocialPost[] {
  const mockPosts = [
    "Amazing event security team keeping everyone safe tonight! 🔒 #EventSecurity #SafetyFirst",
    "Security staff doing an incredible job managing the crowd flow at the venue",
    "Professional security response to a minor incident - handled perfectly",
    "Feeling safe and secure thanks to the excellent security presence",
    "Quick and efficient security team response to a small disturbance",
    "Security personnel making the event experience smooth and worry-free",
    "Great job by security team managing entry points and crowd control",
    "Security staff maintaining excellent order throughout the event",
    "Minor situation resolved quickly and professionally by security",
    "Security team ensuring everyone has a great time safely",
    "Event security doing a fantastic job keeping everyone safe tonight",
    "Security presence is strong and reassuring at the venue",
    "Quick and efficient response from security team to minor issues",
    "Professional security staff making the event experience smooth",
    "Great job by security team managing entry points and crowd flow"
  ];

  return Array.from({ length: Math.min(count, mockPosts.length) }, (_, i) => ({
    id: `mock_facebook_${i + 1}`,
    text: mockPosts[i],
    created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    platform: 'facebook' as const,
  }));
}
