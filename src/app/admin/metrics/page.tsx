'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  ChartBarIcon,
  ServerIcon,
  CpuChipIcon,
  CloudIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface SystemMetrics {
  totalCompanies: number;
  totalUsers: number;
  totalEvents: number;
  systemHealth: string;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    if (role !== 'superadmin') {
      setLoading(false);
      router.replace('/admin');
      return;
    }

    async function loadData() {
      try {
        const response = await fetch('/api/admin/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const metricsData = await response.json();
        setMetrics(metricsData);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, user, role, router]);

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading system metrics...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (!metrics) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300">Failed to load metrics data</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  // Use real metrics data
  const systemMetrics = {
    uptime: 99.9, // Would need actual uptime tracking
    responseTime: 245, // Would need actual response time tracking
    apiCalls: 125000, // Would need actual API call tracking
    activeUsers: metrics.totalUsers || 0,
    cpuUsage: 45, // Would need actual server metrics
    memoryUsage: 67, // Would need actual server metrics
    diskUsage: 34, // Would need actual server metrics
    errorRate: 0.02, // Would need actual error tracking
    throughput: 1200 // Would need actual throughput tracking
  };

  // Example live-ish data: replace with real series when available
  const performanceData = [
    { time: '00:00', cpu: 45, memory: 67, requests: 1200 },
    { time: '04:00', cpu: 38, memory: 62, requests: 890 },
    { time: '08:00', cpu: 52, memory: 71, requests: 2100 },
    { time: '12:00', cpu: 48, memory: 68, requests: 1800 },
    { time: '16:00', cpu: 41, memory: 64, requests: 1500 },
    { time: '20:00', cpu: 35, memory: 59, requests: 1100 }
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Metrics</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Monitor system performance, usage, and health across all services</p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <ServerIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">System Uptime</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.uptime}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Response Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.responseTime}ms</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">API Calls</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.apiCalls.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <CpuChipIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalUsers || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resource Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>CPU Usage</span>
                  <span>{systemMetrics.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#1a2a57] rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${systemMetrics.cpuUsage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>Memory Usage</span>
                  <span>{systemMetrics.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#1a2a57] rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${systemMetrics.memoryUsage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>Disk Usage</span>
                  <span>{systemMetrics.diskUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#1a2a57] rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${systemMetrics.diskUsage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Error Rate</span>
                <div className="flex items-center">
                  <ArrowTrendingDownIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {(systemMetrics.errorRate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Throughput</span>
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {systemMetrics.throughput} req/min
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Active Users</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {systemMetrics.activeUsers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">API Calls Today</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {systemMetrics.apiCalls.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Performance Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} dot={false} name="Requests/min" />
                <Line type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={2} dot={false} name="CPU %" />
                <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} dot={false} name="Memory %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Database Metrics */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Database Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">12ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Avg Query Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">1,250</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Queries/min</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">99.8%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Cache Hit Rate</div>
            </div>
          </div>
        </div>

        {/* API Usage by Company */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">API Usage by Company</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1a2a57] rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">InCommand Test</div>
                <div className="text-sm text-gray-500 dark:text-gray-300">45,000 API calls</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">36%</div>
                <div className="w-20 bg-gray-200 dark:bg-[#2d437a] rounded-full h-2 mt-1">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '36%' }}></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1a2a57] rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Compact Security Services</div>
                <div className="text-sm text-gray-500 dark:text-gray-300">80,000 API calls</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">64%</div>
                <div className="w-20 bg-gray-200 dark:bg-[#2d437a] rounded-full h-2 mt-1">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

