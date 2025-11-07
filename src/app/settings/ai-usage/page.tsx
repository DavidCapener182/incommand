'use client'
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CardContainer } from '@/components/ui/CardContainer';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartBarIcon, CpuChipIcon, CurrencyDollarIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AIUsagePage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [quota, setQuota] = useState<any>(null);
  const [tier, setTier] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('30');
  const [endpointFilter, setEndpointFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [allEndpoints, setAllEndpoints] = useState<string[]>([]);
  const [allModels, setAllModels] = useState<string[]>([]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const daysBack = parseInt(timeRange);
        const from = new Date(now);
        from.setDate(now.getDate() - daysBack);

        // Build query for logs
        let logsQuery = supabase
          .from('ai_usage_logs')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('created_at', from.toISOString())
          .lte('created_at', now.toISOString())
          .order('created_at', { ascending: false });

        if (endpointFilter) {
          logsQuery = logsQuery.eq('endpoint', endpointFilter);
        }

        if (modelFilter) {
          logsQuery = logsQuery.eq('model', modelFilter);
        }

        // Fetch all logs for summary and series
        const { data: allLogs, error: logsError } = await logsQuery;

        if (logsError) throw logsError;

        const logs = allLogs || [];

        // Calculate summary (always set, even if empty)
        const apiCalls = logs.length;
        const tokensUsed = logs.reduce((sum, log) => sum + (log.tokens_used || 0), 0);
        const totalCost = logs.reduce((sum, log) => sum + parseFloat(String(log.cost_usd || 0)), 0);
        const daysDiff = Math.max(1, daysBack);
        const avgPerDay = apiCalls / daysDiff;

        setSummary({
          apiCalls,
          tokensUsed,
          totalCost,
          avgPerDay: Math.round(avgPerDay * 100) / 100,
        });

        // Calculate series data (group by date)
        const byDate = new Map<string, { calls: number; tokens: number; cost: number }>();

        logs.forEach((log) => {
          const date = new Date(log.created_at).toISOString().split('T')[0];
          const existing = byDate.get(date) || { calls: 0, tokens: 0, cost: 0 };
          byDate.set(date, {
            calls: existing.calls + 1,
            tokens: existing.tokens + (log.tokens_used || 0),
            cost: existing.cost + parseFloat(String(log.cost_usd || 0)),
          });
        });

        // Fill in missing dates
        const seriesData: any[] = [];
        const current = new Date(from);
        const end = new Date(now);

        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0];
          const dayData = byDate.get(dateStr) || { calls: 0, tokens: 0, cost: 0 };
          seriesData.push({
            date: dateStr,
            ...dayData,
          });
          current.setDate(current.getDate() + 1);
        }

        setSeries(seriesData);

        // Paginate table data
        const startIdx = (currentPage - 1) * 20;
        const endIdx = startIdx + 20;
        const paginatedLogs = logs.slice(startIdx, endIdx);

        const tableRows = paginatedLogs.map((log) => ({
          id: log.id,
          date: log.created_at,
          endpoint: log.endpoint,
          model: log.model,
          tokens: log.tokens_used || 0,
          cost: parseFloat(String(log.cost_usd || 0)),
        }));

        setTableData(tableRows);
        setTotalCount(logs.length);

        // Fetch tier
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select('tier_id')
          .eq('user_id', user.id)
          .single();

        let tierId = 'free';
        if (!subError && subscription) {
          tierId = subscription.tier_id;
        }

        const { data: tierData, error: tierError } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('id', tierId)
          .single();

        if (!tierError && tierData) {
          setTier({
            id: tierData.id,
            monthlyTokenAllowance: tierData.monthly_token_allowance,
            monthlyCostCapUsd: parseFloat(String(tierData.monthly_cost_cap_usd || 0)),
            overagePolicy: tierData.overage_policy,
          });

          // Calculate quota
          const renewalAnchor = subscription?.renewal_anchor
            ? new Date(subscription.renewal_anchor)
            : new Date();

          const periodStart = new Date(renewalAnchor.getFullYear(), renewalAnchor.getMonth(), renewalAnchor.getDate());
          const periodEnd = new Date(periodStart);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          const { data: periodUsage } = await supabase
            .from('ai_usage_logs')
            .select('tokens_used, cost_usd')
            .eq('user_id', user.id)
            .gte('created_at', periodStart.toISOString())
            .lt('created_at', periodEnd.toISOString());

          const tokensUsedThisPeriod = (periodUsage || []).reduce(
            (sum, log) => sum + (log.tokens_used || 0),
            0
          );
          const costUsedThisPeriod = (periodUsage || []).reduce(
            (sum, log) => sum + parseFloat(String(log.cost_usd || 0)),
            0
          );

          const remainingTokens = Math.max(0, tierData.monthly_token_allowance - tokensUsedThisPeriod);
          const withinAllowance = tokensUsedThisPeriod < tierData.monthly_token_allowance;
          const withinCostCap = tierData.monthly_cost_cap_usd === 0 || costUsedThisPeriod < tierData.monthly_cost_cap_usd;
          const hardBlocked = !withinAllowance && tierData.overage_policy === 'block' && tierData.monthly_token_allowance > 0;
          const usagePercentage = tierData.monthly_token_allowance > 0
            ? (tokensUsedThisPeriod / tierData.monthly_token_allowance) * 100
            : 0;

          setQuota({
            withinAllowance: withinAllowance && withinCostCap,
            remainingTokens,
            policy: tierData.overage_policy,
            hardBlocked,
            usagePercentage: Math.round(usagePercentage * 100) / 100,
          });
        } else {
          // Default tier
          setTier({
            id: 'free',
            monthlyTokenAllowance: 10000,
            monthlyCostCapUsd: 0,
            overagePolicy: 'block',
          });
          setQuota({
            withinAllowance: true,
            remainingTokens: 10000,
            policy: 'block',
            hardBlocked: false,
            usagePercentage: 0,
          });
        }
      } catch (err: any) {
        console.error('Failed to load AI usage data:', err);
        setError(err.message || 'Failed to load AI usage data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, timeRange, endpointFilter, modelFilter, currentPage]);

  // Load filter options separately
  useEffect(() => {
    if (!user || authLoading) return;

    const loadFilterOptions = async () => {
      try {
        const { data: logs } = await supabase
          .from('ai_usage_logs')
          .select('endpoint, model')
          .eq('user_id', user.id);

        if (logs) {
          const endpoints = Array.from(new Set(logs.map((l: any) => l.endpoint).filter(Boolean))).sort();
          const models = Array.from(new Set(logs.map((l: any) => l.model).filter(Boolean))).sort();
          setAllEndpoints(endpoints);
          setAllModels(models);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };

    loadFilterOptions();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <CardContainer>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-blue-100">Loading AI usage data...</div>
          </div>
        </CardContainer>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <CardContainer>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-blue-100">You must be signed in to view AI usage.</div>
          </div>
        </CardContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <CardContainer>
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <div className="text-red-500 dark:text-red-400 font-medium mb-2">Error: {error}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please try refreshing the page or contact support if the problem persists.
            </p>
          </div>
        </CardContainer>
      </div>
    );
  }

  // Get unique endpoints and models for filters (use allEndpoints/allModels if tableData is empty)
  const endpoints = allEndpoints.length > 0 ? allEndpoints : (tableData.length > 0 
    ? Array.from(new Set(tableData.map((l: any) => l.endpoint))).sort()
    : []);
  const models = allModels.length > 0 ? allModels : (tableData.length > 0
    ? Array.from(new Set(tableData.map((l: any) => l.model))).sort()
    : []);

  const maxCalls = series.length > 0 ? Math.max(...series.map(d => d.calls), 1) : 1;
  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tier Banner */}
      {quota && quota.usagePercentage >= 80 && (
        <CardContainer className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                {quota.hardBlocked ? 'Usage Limit Reached' : 'Approaching Usage Limit'}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You&apos;ve used {quota.usagePercentage.toFixed(1)}% of your monthly allowance ({tier?.monthlyTokenAllowance?.toLocaleString()} tokens).
                {quota.hardBlocked && ' AI calls are currently blocked. Please upgrade your plan.'}
              </p>
            </div>
          </div>
        </CardContainer>
      )}

      {/* Filters */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Filters</h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <select
              value={endpointFilter}
              onChange={(e) => {
                setEndpointFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Endpoints</option>
              {endpoints.map((ep) => (
                <option key={ep} value={ep}>
                  {ep}
                </option>
              ))}
            </select>
            <select
              value={modelFilter}
              onChange={(e) => {
                setModelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Models</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardContainer>

      {summary !== null ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardContainer>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">API Calls</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.apiCalls?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-[#1a2a57] rounded-lg">
                  <CpuChipIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">Tokens Used</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.tokensUsed?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-[#1a2a57] rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">Total Cost</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    ${summary.totalCost?.toFixed(4) || '0.0000'}
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-[#1a2a57] rounded-lg">
                  <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-blue-300">Avg/Day</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.avgPerDay?.toFixed(1) || '0.0'}
                  </div>
                </div>
              </div>
            </CardContainer>
          </div>

          {/* Usage Chart */}
          <CardContainer>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-200">Usage Over Time</h2>
            <div className="h-64 flex items-end gap-2">
              {series.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-blue-500 dark:bg-blue-600 rounded-t transition-all hover:bg-blue-600 dark:hover:bg-blue-700"
                    style={{
                      height: `${(day.calls / maxCalls) * 100}%`,
                      minHeight: day.calls > 0 ? '4px' : '0',
                    }}
                    title={`${day.date}: ${day.calls} calls, ${day.tokens.toLocaleString()} tokens, $${day.cost.toFixed(4)}`}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 transform -rotate-45 origin-left">
                    {new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContainer>

          {/* Recent Calls Table */}
          <CardContainer>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-200">Recent Calls</h2>
            {tableData.length === 0 ? (
              <div className="text-center py-12 border border-gray-200 dark:border-[#2d437a] rounded-lg">
                <ChartBarIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No AI calls found for the selected filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((row: any) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(row.date).toLocaleString('en-GB')}
                          </TableCell>
                          <TableCell>{row.endpoint}</TableCell>
                          <TableCell>{row.model}</TableCell>
                          <TableCell className="text-right">{row.tokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${row.cost.toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-[#2d437a]">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} calls
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContainer>
        </>
      ) : (
        <CardContainer>
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No AI usage data available</p>
          </div>
        </CardContainer>
      )}
    </div>
  );
}