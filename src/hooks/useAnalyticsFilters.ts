import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface DateRange {
  from: string; // ISO date string
  to: string; // ISO date string
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  compareMode: 'none' | 'previousEvent' | 'customPeriod' | 'customEvent';
  compareEventId?: string;
  compareDateRange?: DateRange;
  eventId: string;
}

export interface FilterPreset {
  id: string;
  label: string;
  getDateRange: () => DateRange;
}

export interface FilterErrors {
  dateRange?: string;
  comparison?: string;
}

export interface ExportData {
  format: 'pdf' | 'csv' | 'excel' | 'json';
  scope: 'current' | 'all' | 'comparison' | 'summary' | 'custom';
  filename?: string;
  includeCharts: boolean;
  includeBranding: boolean;
}

export const useAnalyticsFilters = (eventId: string) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [filters, setFilters] = useState<AnalyticsFilters>(() => {
    // Default values
    const today = new Date().toISOString().split('T')[0];
    
    return {
      dateRange: {
        from: today,
        to: today
      },
      compareMode: 'none' as const,
      compareEventId: undefined,
      compareDateRange: undefined,
      eventId: eventId || ''
    };
  });

  // Update filters when searchParams change
  useEffect(() => {
    if (!searchParams || !eventId) return;
    
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const compareMode = (searchParams.get('compareMode') as AnalyticsFilters['compareMode']) || 'none';
    const compareEventId = searchParams.get('compareEventId') || undefined;
    const compareFrom = searchParams.get('compareFrom') || '';
    const compareTo = searchParams.get('compareTo') || '';

    const newFilters: AnalyticsFilters = {
      dateRange: {
        from: from || new Date().toISOString().split('T')[0],
        to: to || new Date().toISOString().split('T')[0]
      },
      compareMode,
      compareEventId,
      compareDateRange: compareFrom && compareTo ? { from: compareFrom, to: compareTo } : undefined,
      eventId
    };

    setFilters(newFilters);
  }, [searchParams, eventId]);

  const [errors, setErrors] = useState<FilterErrors>({});
  const [exportData, setExportData] = useState<ExportData>({
    format: 'pdf',
    scope: 'current',
    includeCharts: true,
    includeBranding: true
  });

  // Date range presets
  const presets: FilterPreset[] = useMemo(() => [
    {
      id: 'today',
      label: 'Today',
      getDateRange: () => {
        const today = new Date();
        return {
          from: today.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'yesterday',
      label: 'Yesterday',
      getDateRange: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          from: yesterday.toISOString().split('T')[0],
          to: yesterday.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'last7days',
      label: 'Last 7 Days',
      getDateRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return {
          from: start.toISOString().split('T')[0],
          to: end.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'last30days',
      label: 'Last 30 Days',
      getDateRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return {
          from: start.toISOString().split('T')[0],
          to: end.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'thisMonth',
      label: 'This Month',
      getDateRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          from: start.toISOString().split('T')[0],
          to: end.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'lastMonth',
      label: 'Last Month',
      getDateRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          from: start.toISOString().split('T')[0],
          to: end.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'thisYear',
      label: 'This Year',
      getDateRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return {
          from: start.toISOString().split('T')[0],
          to: end.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'lastYear',
      label: 'Last Year',
      getDateRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear() - 1, 0, 1);
        const end = new Date(now.getFullYear() - 1, 11, 31);
        return {
          from: start.toISOString().split('T')[0],
          to: end.toISOString().split('T')[0]
        };
      }
    }
  ], []);

  // Validation functions
  const validateDateRange = useCallback((dateRange: DateRange): string | undefined => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return 'Invalid date format';
    }
    
    if (fromDate > toDate) {
      return 'Start date must be before end date';
    }
    
    return undefined;
  }, []);

  const validateFilters = useCallback((newFilters: AnalyticsFilters): FilterErrors => {
    const errors: FilterErrors = {};
    
    // Validate main date range
    const dateRangeError = validateDateRange(newFilters.dateRange);
    if (dateRangeError) {
      errors.dateRange = dateRangeError;
    }
    
    // Validate comparison date range if applicable
    if (newFilters.compareMode === 'customPeriod' && newFilters.compareDateRange) {
      const compareError = validateDateRange(newFilters.compareDateRange);
      if (compareError) {
        errors.comparison = compareError;
      }
    }
    
    return errors;
  }, [validateDateRange]);

  // Update URL with current filters
  const updateURL = useCallback((newFilters: AnalyticsFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.dateRange.from) params.set('from', newFilters.dateRange.from);
    if (newFilters.dateRange.to) params.set('to', newFilters.dateRange.to);
    if (newFilters.compareMode !== 'none') params.set('compareMode', newFilters.compareMode);
    if (newFilters.compareEventId) params.set('compareEventId', newFilters.compareEventId);
    if (newFilters.compareDateRange?.from) params.set('compareFrom', newFilters.compareDateRange.from);
    if (newFilters.compareDateRange?.to) params.set('compareTo', newFilters.compareDateRange.to);
    
    const newURL = `${window.location.pathname}?${params.toString()}`;
    router.replace(newURL, { scroll: false });
  }, [router]);

  // Set date range
  const setDateRange = useCallback((dateRange: DateRange) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, dateRange };
      const newErrors = validateFilters(newFilters);
      setErrors(newErrors);
      updateURL(newFilters);
      return newFilters;
    });
  }, [validateFilters, updateURL]);

  // Set comparison mode and data
  const setComparison = useCallback((
    mode: AnalyticsFilters['compareMode'],
    compareEventId?: string,
    compareDateRange?: DateRange
  ) => {
    setFilters(prevFilters => {
      const newFilters = {
        ...prevFilters,
        compareMode: mode,
        compareEventId: mode === 'customEvent' ? compareEventId : undefined,
        compareDateRange: mode === 'customPeriod' ? compareDateRange : undefined
      };
      
      const newErrors = validateFilters(newFilters);
      setErrors(newErrors);
      updateURL(newFilters);
      return newFilters;
    });
  }, [validateFilters, updateURL]);

  // Apply preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setDateRange(preset.getDateRange());
    }
  }, [presets, setDateRange]);

  // Check if filters are valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Convert filters to Supabase query parameters
  const toSupabaseParams = useCallback(() => {
    return {
      from: filters.dateRange.from,
      to: filters.dateRange.to,
      compareMode: filters.compareMode,
      compareEventId: filters.compareEventId,
      compareFrom: filters.compareDateRange?.from,
      compareTo: filters.compareDateRange?.to
    };
  }, [filters]);

  // Convert filters to API endpoint URL
  const toAPIUrl = useCallback((endpoint: string) => {
    const params = toSupabaseParams();
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return `/api/analytics/${endpoint}?${queryString}`;
  }, [toSupabaseParams]);

  // Update export data
  const updateExportData = useCallback((newExportData: Partial<ExportData>) => {
    setExportData(prev => ({ ...prev, ...newExportData }));
  }, []);

  return {
    filters,
    setDateRange,
    setComparison,
    presets,
    applyPreset,
    isValid,
    errors,
    exportData,
    updateExportData,
    toSupabaseParams,
    toAPIUrl
  };
};
