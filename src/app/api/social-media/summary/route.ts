export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeSentiment, 
  calculatePlatformStats, 
  calculateCombinedStats,
  type SocialPost,
  type SocialPulseSummary 
} from '@/lib/socialMediaUtils';

// Simple in-memory cache for rate limiting
const cache = new Map<string, { data: SocialPulseSummary; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const platforms = searchParams.get('platforms') || 'twitter,instagram';
    const timeframe = parseInt(searchParams.get('timeframe') || '60'); // minutes
    
    // Check cache first
    const cacheKey = `${eventId}-${platforms}-${timeframe}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Calculate time range
    const since = new Date(Date.now() - timeframe * 60 * 1000).toISOString();
    
    // Fetch posts from both platforms
    const allPosts: SocialPost[] = [];
    const platformList = platforms.split(',').map(p => p.trim());

    // Fetch Twitter posts
    if (platformList.includes('twitter')) {
      try {
        const twitterResponse = await fetch(
          `${request.nextUrl.origin}/api/social-media/twitter-v1?q=event security&since=${since}&count=20`
        );
        if (twitterResponse.ok) {
          const twitterPosts = await twitterResponse.json();
          allPosts.push(...twitterPosts);
        }
      } catch (error) {
        console.error('Error fetching Twitter posts:', error);
      }
    }

    // Fetch Facebook posts
    if (platformList.includes('facebook') || platformList.includes('instagram')) {
      try {
        const facebookResponse = await fetch(
          `${request.nextUrl.origin}/api/social-media/facebook?q=event security&since=${since}&count=20`
        );
        if (facebookResponse.ok) {
          const facebookPosts = await facebookResponse.json();
          allPosts.push(...facebookPosts);
        }
      } catch (error) {
        console.error('Error fetching Facebook posts:', error);
      }
    }

    // Analyze sentiment for all posts
    const postTexts = allPosts.map(post => post.text);
    const sentiments = await analyzeSentiment(postTexts);

    // Separate posts by platform
    const twitterPosts = allPosts.filter(post => post.platform === 'twitter');
    const instagramPosts = allPosts.filter(post => post.platform === 'instagram');

    // Get sentiment scores for each platform
    const twitterSentiments = twitterPosts.map((_, index) => 
      sentiments[allPosts.findIndex(post => post.id === twitterPosts[index].id)]
    );
    const instagramSentiments = instagramPosts.map((_, index) => 
      sentiments[allPosts.findIndex(post => post.id === instagramPosts[index].id)]
    );

    // Calculate platform statistics
    const twitterStats = calculatePlatformStats(twitterPosts, twitterSentiments);
    const instagramStats = calculatePlatformStats(instagramPosts, instagramSentiments);

    // Calculate combined statistics
    const combined = calculateCombinedStats(twitterStats, instagramStats, sentiments);

    // Create summary response
    const summary: SocialPulseSummary = {
      platformStats: {
        twitter: twitterStats,
        instagram: instagramStats,
      },
      combined,
    };

    // Cache the result
    cache.set(cacheKey, { data: summary, timestamp: Date.now() });

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error in social media summary:', error);
    
    // Return fallback data
    const fallbackSummary: SocialPulseSummary = {
      platformStats: {
        twitter: { count: 0, avgSentiment: 0 },
        instagram: { count: 0, avgSentiment: 0 },
      },
      combined: {
        totalPosts: 0,
        avgSentiment: 0,
        positivePosts: 0,
        negativePosts: 0,
        neutralPosts: 0,
      },
    };

    return NextResponse.json(fallbackSummary);
  }
}
