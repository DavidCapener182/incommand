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
    return <div className="text-gray-500">You do not have permission to view this page.</div>;
  }
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Usage Analytics</h1>
      <AIUsageAnalytics />
    </div>
  );
} 