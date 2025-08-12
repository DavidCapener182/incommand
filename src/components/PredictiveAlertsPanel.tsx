import React, { useState } from 'react';
import { PredictiveAlert } from '../lib/predictiveAlerts';

interface PredictiveAlertsPanelProps {
  alerts: PredictiveAlert[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  onAcknowledgeAlert?: (alertId: string) => void;
  onDismissAlert?: (alertId: string) => void;
}

export default function PredictiveAlertsPanel({
  alerts,
  loading = false,
  error = null,
  className = "",
  onAcknowledgeAlert,
  onDismissAlert
}: PredictiveAlertsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'timestamp'>('severity');

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="text-center text-red-500">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm">Error loading alerts</div>
          <div className="text-xs text-gray-500 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === 'severity') {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    } else {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
  });

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');
  const infoAlerts = alerts.filter(alert => alert.severity === 'info');

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100';
      case 'warning': return 'bg-yellow-100';
      case 'info': return 'bg-blue-100';
      default: return 'bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🚨</span>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Predictive Alerts</h3>
            <p className="text-xs text-gray-500">Proactive warnings and recommendations</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Total Alerts</div>
          <div className="text-sm font-semibold text-gray-900">{alerts.length}</div>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">{criticalAlerts.length}</div>
          <div className="text-xs text-gray-500">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-600">{warningAlerts.length}</div>
          <div className="text-xs text-gray-500">Warning</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{infoAlerts.length}</div>
          <div className="text-xs text-gray-500">Info</div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 text-xs rounded ${
              filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-2 py-1 text-xs rounded ${
              filter === 'critical' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-2 py-1 text-xs rounded ${
              filter === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Warning
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-2 py-1 text-xs rounded ${
              filter === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Info
          </button>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'severity' | 'timestamp')}
          className="text-xs border border-gray-300 rounded px-2 py-1"
        >
          <option value="severity">Sort by Severity</option>
          <option value="timestamp">Sort by Time</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {sortedAlerts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm">No alerts to display</div>
            <div className="text-xs text-gray-400 mt-1">
              {filter === 'all' ? 'All clear!' : `No ${filter} alerts`}
            </div>
          </div>
        ) : (
          sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} ${
                alert.acknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium truncate">{alert.message}</h4>
                      {alert.acknowledged && (
                        <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {formatTimeAgo(alert.timestamp)} • Confidence: {(alert.confidence * 100).toFixed(0)}%
                    </div>
                    {alert.recommendations.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium">Recommendations:</div>
                        {alert.recommendations.slice(0, 2).map((rec, index) => (
                          <div key={index} className="text-xs bg-white bg-opacity-50 p-1 rounded">
                            • {rec}
                          </div>
                        ))}
                        {alert.recommendations.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{alert.recommendations.length - 2} more recommendations
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col space-y-1 ml-2">
                  {!alert.acknowledged && onAcknowledgeAlert && (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                      title="Acknowledge alert"
                    >
                      ✓
                    </button>
                  )}
                  {onDismissAlert && (
                    <button
                      onClick={() => onDismissAlert(alert.id)}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                      title="Dismiss alert"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {criticalAlerts.length > 0 && (
        <div className="border-t border-gray-200 pt-3 mt-4">
          <div className="text-sm font-medium text-red-700 mb-2">⚠️ Critical Actions Required</div>
          <div className="space-y-1">
            <div className="text-xs text-gray-600">• Review all critical alerts immediately</div>
            <div className="text-xs text-gray-600">• Deploy emergency response protocols if needed</div>
            <div className="text-xs text-gray-600">• Notify relevant staff and supervisors</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-3 mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>Auto-refresh: 2min</span>
        </div>
      </div>
    </div>
  );
}
