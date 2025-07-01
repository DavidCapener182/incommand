'use client'
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AIUsageAnalytics from '@/components/AIUsageAnalytics';

// Copy the AIUsageAnalytics component from previous implementation here or import if moved to a shared location
// ... (AIUsageAnalytics component code) ...

export default function AIUsagePage() {
  const { user } = useAuth();
  const role = user?.user_metadata?.role;
  if (!role || !['admin', 'superadmin', 'super'].includes(role)) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-300">You do not have permission to view this page.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">AI Usage Analytics</h1>
      <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
        <AIUsageAnalytics />
      </div>
    </div>
  );
} 