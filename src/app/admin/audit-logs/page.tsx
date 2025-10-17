'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CalendarIcon, 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon, 
  FunnelIcon, 
  EyeIcon, 
  ClockIcon, 
  UserIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import { useRole } from '../../../hooks/useRole';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AuditLog {
  id: string;
  user_id: string | null;
  table_name: string;
  record_id?: string | null;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  // Derived UI fields
  userName?: string;
  category?: 'auth' | 'data' | 'settings' | 'admin' | 'system';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  action?: string;
  resource?: string;
  resourceId?: string;
  details?: any;
}

interface AuditFilter {
  search: string;
  category: string;
  severity: string;
  action: string;
  dateFrom: string;
  dateTo: string;
  userId: string;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const role = useRole();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState<AuditFilter>({
    search: '',
    category: '',
    severity: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    userId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 50;

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('settings_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Pagination
      const from = (page - 1) * logsPerPage;
      const to = from + logsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const raw: AuditLog[] = (data || []) as any
      const userIds = Array.from(new Set(raw.map(r => r.user_id).filter(Boolean))) as string[]
      const userMap: Record<string, string> = {}
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds)
        profiles?.forEach(p => {
          userMap[p.id] = p.first_name || p.last_name ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : (p.email || p.id)
        })
      }

      const transformed = raw.map((r) => {
        const category: AuditLog['category'] = r.table_name.includes('user') ? 'data'
          : r.table_name.includes('system_settings') ? 'settings'
          : 'system'
        const severity: AuditLog['severity'] = r.operation === 'DELETE' ? 'high' : (r.operation === 'UPDATE' ? 'medium' : 'low')
        const action = `${r.operation} ${r.table_name}`
        const resource = r.table_name
        const resourceId = r.record_id || undefined
        const details = r.new_values || r.old_values || {}
        return {
          ...r,
          userName: r.user_id ? (userMap[r.user_id] || r.user_id) : 'system',
          category,
          severity,
          action,
          resource,
          resourceId,
          details,
        }
      })

      setAuditLogs(transformed);
      setTotalLogs(count || 0);
      setTotalPages(Math.ceil((count || 0) / logsPerPage));
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    if (user) {
      loadAuditLogs();
    }
  }, [user, loadAuditLogs]);

  const applyFilters = useCallback(() => {
    let filtered = [...auditLogs];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        (log.action || '').toLowerCase().includes(searchTerm) ||
        (log.resource || '').toLowerCase().includes(searchTerm) ||
        (log.userName || '').toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(searchTerm)
      );
    }

    setFilteredLogs(filtered);
  }, [auditLogs, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleExportLogs = async () => {
    try {
      const exportData = filteredLogs.map(log => ({
        timestamp: log.created_at,
        userName: log.userName,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        category: log.category,
        severity: log.severity,
        ipAddress: log.ip_address,
        details: JSON.stringify(log.details)
      }));

      const csvContent = [
        'Timestamp,User,Action,Resource,Resource ID,Category,Severity,IP Address,Details',
        ...exportData.map(row => 
          `"${row.timestamp}","${row.userName}","${row.action}","${row.resource}","${row.resourceId || ''}","${row.category}","${row.severity}","${row.ipAddress || ''}","${row.details}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth':
        return <UserIcon className="w-4 h-4" />;
      case 'data':
        return <ChartBarIcon className="w-4 h-4" />;
      case 'settings':
        return <FunnelIcon className="w-4 h-4" />;
      case 'admin':
        return <EyeIcon className="w-4 h-4" />;
      case 'system':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <ChartBarIcon className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!user || !(role === 'admin' || role === 'superadmin')) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-300">Monitor system activity and user actions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card-time p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">Filter Audit Logs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search logs..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All categories</option>
                <option value="auth">Authentication</option>
                <option value="data">Data</option>
                <option value="settings">Settings</option>
                <option value="admin">Admin</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Severity
              </label>
              <select
                id="severity"
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action
              </label>
              <input
                id="action"
                type="text"
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                placeholder="Filter by action"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date From
              </label>
              <input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date To
              </label>
              <input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={loadAuditLogs}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setFilters({
                  search: '',
                  category: '',
                  severity: '',
                  action: '',
                  dateFrom: '',
                  dateTo: '',
                  userId: ''
                });
                loadAuditLogs();
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-[#23408e] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#2d437a]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200 flex items-center justify-between">
            <span>Audit Trail</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredLogs.length} of {totalLogs} logs
            </span>
          </h2>
        </div>
        <div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading audit logs...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-[#1a2a57] border-b border-gray-200 dark:border-[#2d437a] hover:bg-gray-100 dark:hover:bg-[#1a2a57]">
                    <TableHead className="text-gray-700 dark:text-blue-100 font-semibold">Category</TableHead>
                    <TableHead className="text-gray-700 dark:text-blue-100 font-semibold">Action</TableHead>
                    <TableHead className="text-gray-700 dark:text-blue-100 font-semibold">User</TableHead>
                    <TableHead className="text-gray-700 dark:text-blue-100 font-semibold">Resource</TableHead>
                    <TableHead className="text-gray-700 dark:text-blue-100 font-semibold">Severity</TableHead>
                    <TableHead className="text-gray-700 dark:text-blue-100 font-semibold">Timestamp</TableHead>
                    <TableHead className="text-right text-gray-700 dark:text-blue-100 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log, index) => (
                      <TableRow
                        key={log.id}
                        className={`cursor-pointer transition-colors ${
                          index % 2 === 0 
                            ? 'bg-gray-50 dark:bg-[#1a2a4f]' 
                            : 'bg-white dark:bg-[#23408e]'
                        } hover:bg-gray-100 dark:hover:bg-[#2d437a] border-gray-200 dark:border-[#2d437a]`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(log.category ?? 'system')}
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                              {(log.category ?? 'system')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {log.action}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          {log.userName}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          {log.resource} {log.resourceId && <span className="text-gray-500 dark:text-gray-400">({log.resourceId})</span>}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity || 'low')}`}>
                            {log.severity || 'low'}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white whitespace-nowrap">
                          {formatTimestamp(log.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No audit logs found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#23408e] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Audit Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedLog.action}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User</label>
                <p className="text-gray-900 dark:text-white">{selectedLog.userName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource</label>
                <p className="text-gray-900 dark:text-white">{selectedLog.resource} {selectedLog.resourceId && `(${selectedLog.resourceId})`}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                  {selectedLog.category}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedLog.severity || 'low')}`}>
                  {selectedLog.severity || 'low'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timestamp</label>
                <p className="text-gray-900 dark:text-white">{formatTimestamp(selectedLog.created_at)}</p>
              </div>
              {selectedLog.ip_address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
                  <p className="text-gray-900 dark:text-white">{selectedLog.ip_address}</p>
                </div>
              )}
              {selectedLog.user_agent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Agent</label>
                  <p className="text-sm break-all text-gray-900 dark:text-white">{selectedLog.user_agent}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details</label>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto text-gray-900 dark:text-white">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
