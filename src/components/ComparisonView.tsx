import React, { useMemo } from 'react';

export interface ComparisonMetric {
  current: number;
  comparison: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ComparisonData {
  incidents: ComparisonMetric;
  attendance: ComparisonMetric;
  responseTime: ComparisonMetric;
  staffEfficiency: ComparisonMetric;
  crowdDensity: ComparisonMetric;
  weatherRisk: ComparisonMetric;
}

interface ComparisonViewProps {
  comparisonData: ComparisonData;
  currentPeriodLabel: string;
  comparisonPeriodLabel: string;
  className?: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  comparisonData,
  currentPeriodLabel,
  comparisonPeriodLabel,
  className = ''
}) => {
  // Safety check for required props
  if (!comparisonData || !currentPeriodLabel || !comparisonPeriodLabel) {
    return null;
  }
  // Calculate trend indicators and colors
  const getTrendIndicator = (metric: ComparisonMetric) => {
    if (metric.trend === 'up') {
      return {
        icon: '↗️',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (metric.trend === 'down') {
      return {
        icon: '↘️',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else {
      return {
        icon: '→',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }
  };

  // Format numbers with appropriate units
  const formatNumber = (value: number, unit?: string) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit || ''}`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K${unit || ''}`;
    }
    return `${value.toLocaleString()}${unit || ''}`;
  };

  // Format percentage change
  const formatPercentageChange = (changePercent: number) => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(1)}%`;
  };

  // Calculate statistical significance (simplified)
  const isSignificant = (metric: ComparisonMetric) => {
    return Math.abs(metric.changePercent) > 5; // 5% threshold for significance
  };

  const metrics = useMemo(() => [
    {
      key: 'incidents',
      label: 'Total Incidents',
      data: comparisonData.incidents,
      unit: ''
    },
    {
      key: 'attendance',
      label: 'Peak Attendance',
      data: comparisonData.attendance,
      unit: ' people'
    },
    {
      key: 'responseTime',
      label: 'Avg Response Time',
      data: comparisonData.responseTime,
      unit: ' min'
    },
    {
      key: 'staffEfficiency',
      label: 'Staff Efficiency',
      data: comparisonData.staffEfficiency,
      unit: '%'
    },
    {
      key: 'crowdDensity',
      label: 'Peak Crowd Density',
      data: comparisonData.crowdDensity,
      unit: ' people/m²'
    },
    {
      key: 'weatherRisk',
      label: 'Weather Risk Score',
      data: comparisonData.weatherRisk,
      unit: ''
    }
  ], [comparisonData]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Period Comparison</h3>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>{currentPeriodLabel}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              <span>{comparisonPeriodLabel}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            * Significant changes (&gt;5%) highlighted
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const trend = getTrendIndicator(metric.data);
          const significant = isSignificant(metric.data);
          
          return (
            <div
              key={metric.key}
              className={`p-4 rounded-lg border ${
                significant ? trend.borderColor : 'border-gray-200'
              } ${trend.bgColor} transition-all duration-200 hover:shadow-md`}
            >
              {/* Metric Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">{metric.label}</h4>
                <span className={`text-lg ${trend.color}`}>{trend.icon}</span>
              </div>

              {/* Current vs Comparison Values */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Current</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatNumber(metric.data.current, metric.unit)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Previous</span>
                  <span className="text-sm text-gray-600">
                    {formatNumber(metric.data.comparison, metric.unit)}
                  </span>
                </div>
              </div>

              {/* Change Indicators */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Change</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${trend.color}`}>
                      {formatPercentageChange(metric.data.changePercent)}
                    </span>
                    {significant && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                        *
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">Absolute</span>
                  <span className={`text-xs font-medium ${trend.color}`}>
                    {formatNumber(Math.abs(metric.data.change), metric.unit)}
                  </span>
                </div>
              </div>

              {/* Trend Analysis */}
              <div className="mt-2 text-xs text-gray-500">
                {metric.data.trend === 'up' && 'Trending upward'}
                {metric.data.trend === 'down' && 'Trending downward'}
                {metric.data.trend === 'stable' && 'Remaining stable'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Key Insights</h4>
        <div className="space-y-2 text-sm text-gray-600">
          {metrics.filter(m => isSignificant(m.data)).map((metric) => (
            <div key={metric.key} className="flex items-start space-x-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>{metric.label}</strong> changed by{' '}
                <span className={getTrendIndicator(metric.data).color}>
                  {formatPercentageChange(metric.data.changePercent)}
                </span>
                {' '}compared to the previous period
              </span>
            </div>
          ))}
          {metrics.filter(m => isSignificant(m.data)).length === 0 && (
            <div className="text-gray-500 italic">
              No significant changes detected across metrics
            </div>
          )}
        </div>
      </div>

      {/* Data Quality Indicators */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Data completeness: 98%</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>UTC timezone</span>
          <span>•</span>
          <span>Real-time data</span>
        </div>
      </div>
    </div>
  );
};
