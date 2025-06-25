'use client'
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AIUsageAnalytics() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointFilter, setEndpointFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  // Aggregation helpers
  const now = new Date();
  const last30 = new Date(now);
  last30.setDate(now.getDate() - 30);
  const logs30 = logs.filter(l => new Date(l.created_at) >= last30);

  const totalCalls = logs.length;
  const totalTokens = logs.reduce((sum, l) => sum + (l.tokens_used || 0), 0);
  const totalCost = logs.reduce((sum, l) => sum + (parseFloat(l.cost_usd) || 0), 0);
  const calls30 = logs30.length;
  const tokens30 = logs30.reduce((sum, l) => sum + (l.tokens_used || 0), 0);
  const cost30 = logs30.reduce((sum, l) => sum + (parseFloat(l.cost_usd) || 0), 0);

  // Breakdown by endpoint/model
  const endpoints = Array.from(new Set(logs.map(l => l.endpoint))).sort();
  const models = Array.from(new Set(logs.map(l => l.model))).sort();

  // Usage over time (last 30 days)
  const usageByDay: { [date: string]: { calls: number; tokens: number } } = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(last30);
    d.setDate(last30.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    usageByDay[key] = { calls: 0, tokens: 0 };
  }
  logs30.forEach(l => {
    const key = l.created_at.slice(0, 10);
    if (usageByDay[key]) {
      usageByDay[key].calls++;
      usageByDay[key].tokens += l.tokens_used || 0;
    }
  });

  // Filtered logs for table
  const filteredLogs = logs.filter(l =>
    (!endpointFilter || l.endpoint === endpointFilter) &&
    (!modelFilter || l.model === modelFilter)
  );

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Total Calls</div>
          <div className="text-2xl font-bold">{totalCalls}</div>
          <div className="text-xs text-gray-400">Last 30d: {calls30}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Total Tokens</div>
          <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Last 30d: {tokens30.toLocaleString()}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Total Cost (USD)</div>
          <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          <div className="text-xs text-gray-400">Last 30d: ${cost30.toFixed(2)}</div>
        </div>
      </div>
      {/* Usage Chart */}
      <div className="mb-8">
        <div className="font-semibold mb-2">Usage (Last 30 Days)</div>
        <div className="w-full h-32 bg-gray-50 rounded-lg flex items-end">
          {/* Simple bar chart for calls */}
          <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="none">
            {Object.entries(usageByDay).map(([date, { calls }], i) => (
              <rect
                key={date}
                x={i * 10}
                y={80 - (calls * 8)}
                width={8}
                height={calls * 8}
                fill="#3b82f6"
                opacity={calls > 0 ? 0.8 : 0.2}
              >
                <title>{date}: {calls} calls</title>
              </rect>
            ))}
          </svg>
        </div>
        <div className="text-xs text-gray-400 mt-1">Bar height = # calls per day</div>
      </div>
      {/* Filters */}
      <div className="flex space-x-4 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Endpoint</label>
          <select value={endpointFilter} onChange={e => setEndpointFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {endpoints.map(ep => <option key={ep} value={ep}>{ep}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Model</label>
          <select value={modelFilter} onChange={e => setModelFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1 text-left">Endpoint</th>
              <th className="px-2 py-1 text-left">Model</th>
              <th className="px-2 py-1 text-right">Tokens</th>
              <th className="px-2 py-1 text-right">Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4">No usage found.</td></tr>
            ) : filteredLogs.slice(0, 100).map(l => (
              <tr key={l.id}>
                <td className="px-2 py-1">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-2 py-1">{l.endpoint}</td>
                <td className="px-2 py-1">{l.model}</td>
                <td className="px-2 py-1 text-right">{l.tokens_used}</td>
                <td className="px-2 py-1 text-right">{l.cost_usd ? `$${parseFloat(l.cost_usd).toFixed(4)}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-gray-400 mt-2">Showing up to 100 most recent entries. Use filters to narrow results.</div>
      </div>
      {error && <div className="text-red-500 mt-2">Error: {error}</div>}
    </div>
  );
} 