export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';

interface SocialPost {
  id: string;
  text: string;
  created_at: string;
  platform: 'reddit';
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

    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.warn('Reddit API credentials not found, using mock data');
      const mockData = generateMockRedditData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Get Reddit access token
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'InCommand-Event-Management/1.0',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      console.error('Reddit token error:', tokenResponse.status);
      const mockData = generateMockRedditData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Search Reddit for posts
    const searchResponse = await fetch(
      `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&type=link&limit=${Math.min(count, 25)}&sort=new`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'InCommand-Event-Management/1.0',
        },
      }
    );

    if (!searchResponse.ok) {
      console.error('Reddit search error:', searchResponse.status);
      const mockData = generateMockRedditData(count);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    const searchData = await searchResponse.json();
    
    // Transform Reddit API response to SocialPost format
    const posts: SocialPost[] = (searchData.data?.children || []).map((post: any) => ({
      id: post.data.id,
      text: post.data.title + (post.data.selftext ? ': ' + post.data.selftext.substring(0, 200) : ''),
      created_at: new Date(post.data.created_utc * 1000).toISOString(),
      platform: 'reddit' as const,
    }));

    cache.set(cacheKey, { data: posts, timestamp: Date.now() });
    return NextResponse.json(posts);

  } catch (error) {
    console.error('Error fetching Reddit data:', error);
    const mockData = generateMockRedditData(20);
    return NextResponse.json(mockData);
  }
}

function generateMockRedditData(count: number): SocialPost[] {
  const mockPosts = [
    "Event security question: Best practices for crowd management at large venues?",
    "Security team at tonight's event was absolutely professional - great work!",
    "How do you handle security incidents at events? Looking for advice",
    "Event security staff doing an amazing job keeping everyone safe",
    "Quick response from security team prevented a potential issue",
    "Security presence at the venue was reassuring and professional",
    "Event security tips: Always have clear communication protocols",
    "Security team efficiently managed entry points and crowd flow",
    "Minor incident resolved quickly by security - excellent response time",
    "Event security doing a fantastic job maintaining order",
    "Security staff making the event experience smooth and worry-free",
    "Professional security response to a small disturbance",
    "Event security best practices for large crowds",
    "Security team keeping everyone safe at the venue",
    "Quick and efficient security response to minor issues"
  ];

  return Array.from({ length: Math.min(count, mockPosts.length) }, (_, i) => ({
    id: `mock_reddit_${i + 1}`,
    text: mockPosts[i],
    created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    platform: 'reddit' as const,
  }));
}
