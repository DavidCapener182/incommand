'use client'
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ChartBarIcon, CpuChipIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function AIUsagePage() {
  const { user } = useAuth();
  const role = user?.user_metadata?.role;

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointFilter, setEndpointFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30'); // 30, 7, 1 days

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (!role || !['admin', 'superadmin', 'super'].includes(role)) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-300">You do not have permission to view this page.</div>
        </div>
      </div>
    );
  }

  // Calculate metrics based on time range
  const now = new Date();
  const daysBack = parseInt(timeRange);
  const cutoffDate = new Date(now);
  cutoffDate.setDate(now.getDate() - daysBack);
  
  const filteredLogs = logs.filter(l => new Date(l.created_at) >= cutoffDate);
  const totalCalls = filteredLogs.length;
  const totalTokens = filteredLogs.reduce((sum, l) => sum + (l.tokens_used || 0), 0);
  const totalCost = filteredLogs.reduce((sum, l) => sum + (parseFloat(l.cost_usd) || 0), 0);

  // Get unique endpoints and models
  const endpoints = Array.from(new Set(logs.map(l => l.endpoint))).sort();
  const models = Array.from(new Set(logs.map(l => l.model))).sort();

  // Usage by day for chart
  const usageByDay: { [date: string]: { calls: number; tokens: number; cost: number } } = {};
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(cutoffDate);
    d.setDate(cutoffDate.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    usageByDay[key] = { calls: 0, tokens: 0, cost: 0 };
  }
  
  filteredLogs.forEach(l => {
    const key = l.created_at.slice(0, 10);
    if (usageByDay[key]) {
      usageByDay[key].calls++;
      usageByDay[key].tokens += l.tokens_used || 0;
      usageByDay[key].cost += parseFloat(l.cost_usd) || 0;
    }
  });

  // Filter logs for table
  const tableFilteredLogs = logs.filter(l =>
    (!endpointFilter || l.endpoint === endpointFilter) &&
    (!modelFilter || l.model === modelFilter)
  );

  const maxCalls = Math.max(...Object.values(usageByDay).map(d => d.calls), 1);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">AI Usage Analytics</h1>
        
        {/* Time Range Selector */}
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-6 text-center">
          <div className="text-gray-500 dark:text-blue-100">Loading AI usage data...</div>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-6 text-center">
          <div className="text-red-500 dark:text-red-400">Error: {error}</div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-[#2d437a]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">API Calls</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{totalCalls.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-[#2d437a]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-[#1a2a57] rounded-lg">
                  <CpuChipIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">Tokens Used</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{totalTokens.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-[#2d437a]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-[#1a2a57] rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">Total Cost</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">${totalCost.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-[#2d437a]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-[#1a2a57] rounded-lg">
                  <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">Avg/Day</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(totalCalls / daysBack)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Chart */}
          <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a]">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-200">Usage Over Time</h3>
            <div className="w-full h-32 bg-gray-50 dark:bg-[#1a2a57] rounded-lg flex items-end p-2">
              <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="none">
                {Object.entries(usageByDay).map(([date, { calls }], i) => (
                  <rect
                    key={date}
                    x={i * (300 / daysBack)}
                    y={80 - (calls / maxCalls * 70)}
                    width={Math.max(1, 300 / daysBack - 2)}
                    height={calls / maxCalls * 70}
                    fill="#3b82f6"
                    className="opacity-80 hover:opacity-100"
                  >
                    <title>{date}: {calls} calls</title>
                  </rect>
                ))}
              </svg>
            </div>
            <div className="text-xs text-gray-400 dark:text-blue-300 mt-2">Bar height represents API calls per day</div>
          </div>

          {/* Filters and Table */}
          <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Recent Usage</h3>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-blue-300 mb-1">Endpoint</label>
                  <select 
                    value={endpointFilter} 
                    onChange={e => setEndpointFilter(e.target.value)} 
                    className="border border-gray-300 dark:border-[#2d437a] rounded px-2 py-1 text-sm bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white"
                  >
                    <option value="">All</option>
                    {endpoints.map(ep => <option key={ep} value={ep}>{ep}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-blue-300 mb-1">Model</label>
                  <select 
                    value={modelFilter} 
                    onChange={e => setModelFilter(e.target.value)} 
                    className="border border-gray-300 dark:border-[#2d437a] rounded px-2 py-1 text-sm bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white"
                  >
                    <option value="">All</option>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-[#1a2a57]">
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-blue-200 font-medium">Date</th>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-blue-200 font-medium">Endpoint</th>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-blue-200 font-medium">Model</th>
                    <th className="px-3 py-2 text-right text-gray-700 dark:text-blue-200 font-medium">Tokens</th>
                    <th className="px-3 py-2 text-right text-gray-700 dark:text-blue-200 font-medium">Cost (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#2d437a]">
                  {tableFilteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500 dark:text-blue-300">
                        No usage data found.
                      </td>
                    </tr>
                  ) : (
                    tableFilteredLogs.slice(0, 50).map(l => (
                      <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2a57]">
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{new Date(l.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-blue-200">{l.endpoint}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-blue-200">{l.model}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{l.tokens_used?.toLocaleString() || '-'}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                          {l.cost_usd ? `$${parseFloat(l.cost_usd).toFixed(4)}` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {tableFilteredLogs.length > 50 && (
                <div className="text-xs text-gray-400 dark:text-blue-300 mt-2 text-center">
                  Showing first 50 entries. Use filters to narrow results.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 