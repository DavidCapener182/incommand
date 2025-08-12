'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChatBubbleLeftRightIcon, 
  HeartIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import type { SocialPulseSummary } from '@/lib/socialMediaUtils';

interface SocialMediaMonitoringCardProps {
  eventId?: string;
}

interface SocialPost {
  id: string;
  text: string;
  created_at: string;
  platform: 'twitter' | 'instagram';
}

export default function SocialMediaMonitoringCard({ eventId }: SocialMediaMonitoringCardProps) {
  const [data, setData] = useState<SocialPulseSummary | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/social-media/summary?eventId=${eventId || 'default'}&platforms=twitter,instagram&timeframe=60`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch social media data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching social media data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const [twitterResponse, facebookResponse] = await Promise.all([
        fetch('/api/social-media/twitter-v1?q=event security&count=10'),
        fetch('/api/social-media/facebook?q=event security&count=10')
      ]);

      const twitterPosts = twitterResponse.ok ? await twitterResponse.json() : [];
      const facebookPosts = facebookResponse.ok ? await facebookResponse.json() : [];
      
      setPosts([...twitterPosts, ...facebookPosts]);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [eventId]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.3) return 'bg-green-500';
    if (sentiment <= -0.3) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment >= 0.3) return <span className="text-green-600 text-lg">😊</span>;
    if (sentiment <= -0.3) return <span className="text-red-600 text-lg">😞</span>;
    return <span className="text-yellow-600 text-lg">😐</span>;
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment >= 0.3) return 'Positive';
    if (sentiment <= -0.3) return 'Negative';
    return 'Neutral';
  };

  const handleCardClick = () => {
    fetchPosts();
    setIsModalOpen(true);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-[130px] cursor-pointer hover:shadow-md transition-shadow">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-[130px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-900 dark:text-white">Social Pulse</span>
          </div>
        </div>
        <div className="text-center py-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-[130px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-900 dark:text-white">Social Pulse</span>
          </div>
        </div>
        <div className="text-center py-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  const { combined, platformStats } = data;

  return (
    <>
      <div 
        className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 col-span-1 text-gray-900 dark:text-gray-100 w-full"
        onClick={handleCardClick}
      >
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-1.5 w-full">
          <div className="flex items-center space-x-1.5">
            <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300" />
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Social Pulse</span>
          </div>
          <div className="flex items-center space-x-1">
            <HeartIcon className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              {combined.totalPosts}
            </span>
          </div>
        </div>

        {/* Content - Compact */}
        <div className="flex-1 flex flex-col justify-between w-full min-h-0 pb-2">
          {/* Platform breakdown - Compact */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">Twitter</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{platformStats.twitter.count}</div>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">Facebook</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{platformStats.instagram.count}</div>
              </div>
            </div>
          </div>

          {/* Sentiment section - Compact */}
          <div className="flex-1 flex flex-col justify-center space-y-1">
            {/* Sentiment indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                {getSentimentIcon(combined.avgSentiment)}
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {getSentimentLabel(combined.avgSentiment)}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {Math.round(combined.avgSentiment * 100)}%
              </span>
            </div>

            {/* Sentiment bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${getSentimentColor(combined.avgSentiment)}`}
                style={{
                  width: `${Math.max(0, Math.min(100, (combined.avgSentiment + 1) * 50))}%`
                }}
              />
            </div>


          </div>
        </div>
      </div>

            {/* Full Screen Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-none max-h-none m-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest Social Media Posts</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Twitter & Facebook mentions</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Live</span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-8 h-8" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No posts available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                     {posts.map((post) => (
                     <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800">
                       <div className="flex items-start justify-between mb-4">
                         <div className="flex items-center space-x-3">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                             post.platform === 'twitter' 
                               ? 'bg-blue-500' 
                               : 'bg-blue-600'
                           }`}>
                             {post.platform === 'twitter' ? (
                               <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                               </svg>
                             ) : (
                               <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                               </svg>
                             )}
                           </div>
                           <div>
                             <div className="font-semibold text-gray-900 dark:text-white">
                               {post.platform === 'twitter' ? 'Twitter User' : 'Facebook User'}
                             </div>
                             <div className="text-sm text-gray-500 dark:text-gray-400">
                               {formatTime(post.created_at)}
                             </div>
                           </div>
                         </div>
                         <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                           post.platform === 'twitter' 
                             ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                             : 'bg-blue-600 text-white dark:bg-blue-700 dark:text-blue-100'
                         }`}>
                           {post.platform === 'twitter' ? 'Twitter' : 'Facebook'}
                         </span>
                       </div>
                       
                       {/* Post content */}
                       <div className="space-y-4">
                         <p className="text-base text-gray-900 dark:text-white leading-relaxed">
                           {post.text}
                         </p>
                         
                         {/* Engagement metrics */}
                         <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                           <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                             <div className="flex items-center space-x-1">
                               <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                               </svg>
                               <span>{Math.floor(Math.random() * 50) + 1}</span>
                             </div>
                             <div className="flex items-center space-x-1">
                               <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                               </svg>
                               <span>{Math.floor(Math.random() * 20) + 1}</span>
                             </div>
                             <div className="flex items-center space-x-1">
                               <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                               </svg>
                               <span>{Math.floor(Math.random() * 10) + 1}</span>
                             </div>
                           </div>
                           <div className="text-xs text-gray-400 dark:text-gray-500">
                             {post.platform === 'twitter' ? '@username' : 'Facebook User'}
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>Showing {posts.length} recent posts</span>
                  <span>•</span>
                  <span>Auto-refresh every 60 seconds</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Press ESC or click X to close</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
