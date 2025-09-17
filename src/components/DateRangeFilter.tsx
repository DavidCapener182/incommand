import React, { useState, useCallback, useEffect } from 'react';
import { useAnalyticsFilters, DateRange } from '../hooks/useAnalyticsFilters';

interface DateRangeFilterProps {
  eventId: string;
  onFiltersChange?: (filters: any) => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  eventId,
  onFiltersChange,
  className = ''
}) => {
  const normalizedEventId = eventId ?? '';

  const {
    filters,
    setDateRange,
    setComparison,
    presets,
    applyPreset,
    isValid,
    errors
  } = useAnalyticsFilters(normalizedEventId);

  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showComparison, setShowComparison] = useState(filters?.compareMode !== 'none');

  // Update showComparison when filters change
  useEffect(() => {
    setShowComparison(filters?.compareMode !== 'none');
  }, [filters?.compareMode]);

  // Handle preset button click
  const handlePresetClick = useCallback((presetId: string) => {
    applyPreset(presetId);
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [applyPreset, onFiltersChange, filters]);

  // Handle custom date range change
  const handleCustomDateChange = useCallback((field: 'from' | 'to', value: string) => {
    const newDateRange = {
      ...filters.dateRange,
      [field]: value
    };
    setDateRange(newDateRange);
    if (onFiltersChange) {
      onFiltersChange({ ...filters, dateRange: newDateRange });
    }
  }, [filters, setDateRange, onFiltersChange]);

  // Handle comparison mode change
  const handleComparisonModeChange = useCallback((mode: 'none' | 'previousEvent' | 'customPeriod' | 'customEvent') => {
    setComparison(mode);
    if (onFiltersChange) {
      onFiltersChange({ ...filters, compareMode: mode });
    }
  }, [setComparison, onFiltersChange, filters]);

  // Handle comparison date range change
  const handleComparisonDateChange = useCallback((field: 'from' | 'to', value: string) => {
    const newCompareRange = {
      ...filters.compareDateRange,
      [field]: value
    } as DateRange;
    
    setComparison('customPeriod', undefined, newCompareRange);
    if (onFiltersChange) {
      onFiltersChange({ ...filters, compareDateRange: newCompareRange });
    }
  }, [filters, setComparison, onFiltersChange]);

  if (!eventId) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Date Range Filter</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">UTC Timezone</span>
          {!isValid && (
            <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
              Invalid date range
            </span>
          )}
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.id)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filters.dateRange.from === preset.getDateRange().from &&
                filters.dateRange.to === preset.getDateRange().to
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Custom Date Range
          </label>
          <button
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showCustomPicker ? 'Hide' : 'Show'} Custom Picker
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.dateRange.from}
              onChange={(e) => handleCustomDateChange('from', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.dateRange ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.dateRange.to}
              onChange={(e) => handleCustomDateChange('to', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.dateRange ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
        </div>
        
        {errors.dateRange && (
          <p className="mt-1 text-sm text-red-600">{errors.dateRange}</p>
        )}
      </div>

      {/* Comparison Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Comparison Mode
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="comparison-toggle"
              checked={showComparison}
              onChange={(e) => handleComparisonModeChange(e.target.checked ? 'previousEvent' : 'none')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="comparison-toggle" className="ml-2 text-sm text-gray-700">
              Enable Comparison
            </label>
          </div>
        </div>

        {showComparison && (
          <div className="space-y-4">
            {/* Comparison Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comparison Type
              </label>
              <select
                value={filters.compareMode}
                onChange={(e) => handleComparisonModeChange(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="previousEvent">Previous Event</option>
                <option value="customPeriod">Custom Period</option>
                <option value="customEvent">Specific Event</option>
              </select>
            </div>

            {/* Custom Period Date Range */}
            {filters.compareMode === 'customPeriod' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comparison Date Range
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.compareDateRange?.from || ''}
                      onChange={(e) => handleComparisonDateChange('from', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.comparison ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.compareDateRange?.to || ''}
                      onChange={(e) => handleComparisonDateChange('to', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.comparison ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                {errors.comparison && (
                  <p className="mt-1 text-sm text-red-600">{errors.comparison}</p>
                )}
              </div>
            )}

            {/* Specific Event Selection */}
            {filters.compareMode === 'customEvent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comparison Event
                </label>
                <input
                  type="text"
                  placeholder="Enter event ID"
                  value={filters.compareEventId || ''}
                  onChange={(e) => setComparison('customEvent', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      <div className="bg-gray-50 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div>
            <span className="font-medium">Date Range:</span> {filters.dateRange.from} to {filters.dateRange.to}
          </div>
          {showComparison && (
            <div>
              <span className="font-medium">Comparison:</span> {filters.compareMode}
              {filters.compareMode === 'customPeriod' && filters.compareDateRange && (
                <span> ({filters.compareDateRange.from} to {filters.compareDateRange.to})</span>
              )}
              {filters.compareMode === 'customEvent' && filters.compareEventId && (
                <span> (Event: {filters.compareEventId})</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
