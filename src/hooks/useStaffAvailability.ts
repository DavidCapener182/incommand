import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  getAvailableStaff, 
  getStaffSuggestions, 
  getAssignmentStats,
  type StaffMember,
  type AssignmentScore 
} from '../lib/incidentAssignment';

export interface StaffAvailabilityState {
  availableStaff: StaffMember[];
  loading: boolean;
  error: string | null;
  stats: {
    totalStaff: number;
    availableStaff: number;
    assignedStaff: number;
    averageWorkload: number;
    skillGaps: string[];
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface StaffSuggestion {
  incidentId?: string;
  incidentType?: string;
  priority?: string;
  suggestions: AssignmentScore[];
  location?: { latitude: number; longitude: number };
}

// Performance optimization constants
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const CACHE_DURATION = 30000; // 30 seconds
const FETCH_COOLDOWN = 2000; // 2 seconds
const DEBOUNCE_DELAY = 500; // 500ms debounce
const INCREMENTAL_UPDATE_THRESHOLD = 100; // Use incremental updates for datasets > 100

// Advanced caching with LRU-like behavior
class StaffCache {
  private cache = new Map<string, {
    data: StaffMember[];
    timestamp: number;
    version: number;
    incremental: boolean;
  }>();
  private maxSize = 10;
  private version = 0;

  set(key: string, data: StaffMember[], incremental = false): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      version: ++this.version,
      incremental
    });
  }

  get(key: string): { data: StaffMember[]; timestamp: number; version: number; incremental: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  clear(): void {
    this.cache.clear();
  }

  clearByPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Pagination helper
class PaginationManager {
  private currentPage = 1;
  private pageSize = DEFAULT_PAGE_SIZE;
  private totalItems = 0;

  constructor(pageSize = DEFAULT_PAGE_SIZE) {
    this.pageSize = Math.min(pageSize, MAX_PAGE_SIZE);
  }

  getPageData<T>(data: T[]): T[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return data.slice(startIndex, endIndex);
  }

  getPaginationInfo() {
    return {
      page: this.currentPage,
      pageSize: this.pageSize,
      totalPages: Math.ceil(this.totalItems / this.pageSize),
      hasMore: this.currentPage < Math.ceil(this.totalItems / this.pageSize)
    };
  }

  setTotalItems(total: number) {
    this.totalItems = total;
  }

  setPage(page: number) {
    this.currentPage = Math.max(1, page);
  }

  setPageSize(size: number) {
    this.pageSize = Math.min(size, MAX_PAGE_SIZE);
    this.currentPage = 1; // Reset to first page
  }

  nextPage() {
    if (this.hasMore()) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  hasMore(): boolean {
    return this.currentPage < Math.ceil(this.totalItems / this.pageSize);
  }
}

/**
 * Hook for managing staff availability with global subscription management.
 * 
 * This hook implements a global subscription manager to prevent multiple
 * real-time subscriptions when the hook is used in multiple components
 * simultaneously. The global manager ensures that only one set of subscriptions
 * exists per event, improving performance and preventing subscription conflicts.
 * 
 * @param eventId - The event ID to monitor staff availability for
 * @param pageSize - Number of staff members to load per page
 * @returns Staff availability state and management functions
 */
export function useStaffAvailability(eventId: string, pageSize = DEFAULT_PAGE_SIZE) {
  const [state, setState] = useState<StaffAvailabilityState>({
    availableStaff: [],
    loading: true,
    error: null,
    stats: {
      totalStaff: 0,
      availableStaff: 0,
      assignedStaff: 0,
      averageWorkload: 0,
      skillGaps: []
    },
    pagination: {
      page: 1,
      pageSize,
      totalPages: 1,
      hasMore: false
    }
  });

  const [suggestions, setSuggestions] = useState<StaffSuggestion[]>([]);
  const [allStaffData, setAllStaffData] = useState<StaffMember[]>([]);

  // Performance optimization refs
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastFetchRef = useRef<number>(0);
  const staffCacheRef = useRef<StaffCache>(new StaffCache());
  const assignmentScoresCacheRef = useRef<Map<string, {
    scores: AssignmentScore[];
    timestamp: number;
  }>>(new Map());
  const paginationManagerRef = useRef<PaginationManager>(new PaginationManager(pageSize));
  const incrementalUpdateRef = useRef<{
    lastUpdate: number;
    pendingUpdates: Map<string, Partial<StaffMember>>;
  }>({
    lastUpdate: 0,
    pendingUpdates: new Map()
  });

  // Memoized filtered data for performance
  const filteredStaffData = useMemo(() => {
    return paginationManagerRef.current.getPageData(allStaffData);
  }, [allStaffData]);

  // Optimized fetch with incremental updates
  const calculateStatsIncremental = useCallback((existingData: StaffMember[], changes: any[]) => {
    const stats = {
      totalStaff: existingData.length,
      availableStaff: existingData.filter(s => s.availability_status === 'available').length,
      assignedStaff: existingData.filter(s => s.active_assignments > 0).length,
      averageWorkload: existingData.reduce((sum, s) => sum + s.active_assignments, 0) / existingData.length,
      skillGaps: []
    };

    changes.forEach(change => {
      const existingStaff = existingData.find(s => s.id === change.id);
      if (existingStaff) {
        if (existingStaff.availability_status !== change.availability_status) {
          if (change.availability_status === 'available') {
            stats.availableStaff++;
          } else if (existingStaff.availability_status === 'available') {
            stats.availableStaff--;
          }
        }

        if (existingStaff.active_assignments !== change.active_assignments) {
          if (existingStaff.active_assignments === 0 && change.active_assignments > 0) {
            stats.assignedStaff++;
          } else if (existingStaff.active_assignments > 0 && change.active_assignments === 0) {
            stats.assignedStaff--;
          }
        }
      }
    });

    const totalWorkload = existingData.reduce((sum, s) => sum + s.active_assignments, 0);
    stats.averageWorkload = totalWorkload / existingData.length;

    return stats;
  }, []);

  const fetchStaffAvailability = useCallback(async (force = false, incremental = false) => {
    if (!eventId) return;

    const now = Date.now();
    const cacheKey = `${eventId}-${paginationManagerRef.current.getPaginationInfo().page}`;
    
    // Check cache first (unless forcing refresh)
    if (!force && !incremental) {
      const cached = staffCacheRef.current.get(cacheKey);
      if (cached) {
        setAllStaffData(cached.data);
        paginationManagerRef.current.setTotalItems(cached.data.length);
        setState(prev => ({
          ...prev,
          availableStaff: paginationManagerRef.current.getPageData(cached.data),
          loading: false,
          error: null,
          pagination: paginationManagerRef.current.getPaginationInfo()
        }));
        return;
      }
    }

    // Debounce rapid requests
    if (!force && now - lastFetchRef.current < FETCH_COOLDOWN) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        fetchStaffAvailability(true, incremental);
      }, FETCH_COOLDOWN - (now - lastFetchRef.current));
      
      return;
    }

    lastFetchRef.current = now;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check if the required tables exist
      const { error: tableCheckError } = await supabase
        .from('staff')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.warn('Staff table not found, returning empty data:', tableCheckError);
        const emptyState = {
          availableStaff: [],
          loading: false,
          error: null,
          stats: {
            totalStaff: 0,
            availableStaff: 0,
            assignedStaff: 0,
            averageWorkload: 0,
            skillGaps: []
          },
          pagination: {
            page: 1,
            pageSize,
            totalPages: 1,
            hasMore: false
          }
        };
        setState(emptyState);
        setAllStaffData([]);
        return;
      }

      // Use incremental updates for large datasets
      const useIncremental = allStaffData.length > INCREMENTAL_UPDATE_THRESHOLD && incremental;
      
      let staffData: StaffMember[];
      let statsData: any;

      if (useIncremental) {
        // Incremental update - only fetch changed records
        const { data: changes, error: changesError } = await supabase
          .from('staff')
          .select('id, availability_status, active_assignments, skill_tags')
          .eq('availability_status', 'available')
          .eq('active', true)
          .gte('updated_at', new Date(Date.now() - CACHE_DURATION).toISOString());

        if (changesError) {
          throw changesError;
        }

        // Apply incremental updates
        const updatedData = [...allStaffData];
        changes?.forEach(change => {
          if (change && typeof change === 'object' && 'id' in change && !('code' in change)) {
            const changeWithId = change as { id: string } & Record<string, any>;
            const index = updatedData.findIndex(staff => staff.id === changeWithId.id);
            if (index !== -1) {
              updatedData[index] = { ...updatedData[index], ...changeWithId };
            }
          }
        });

        staffData = updatedData;
        
        // Recalculate stats incrementally
        statsData = calculateStatsIncremental(allStaffData, changes || []);
      } else {
        // Full fetch
        [staffData, statsData] = await Promise.all([
          getAvailableStaff(eventId),
          getAssignmentStats(eventId)
        ]);
      }

      // Update cache
      staffCacheRef.current.set(cacheKey, staffData, useIncremental);
      setAllStaffData(staffData);
      paginationManagerRef.current.setTotalItems(staffData.length);

      setState({
        availableStaff: paginationManagerRef.current.getPageData(staffData),
        loading: false,
        error: null,
        stats: statsData,
        pagination: paginationManagerRef.current.getPaginationInfo()
      });

    } catch (error) {
      console.error('Error fetching staff availability:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch staff availability'
      }));
    }
  }, [allStaffData, calculateStatsIncremental, eventId, pageSize]);

  // Optimized staff suggestions with caching
  const getSuggestions = useCallback(async (
    incidentType: string,
    priority: string,
    location?: { latitude: number; longitude: number },
    requiredSkills: string[] = []
  ): Promise<AssignmentScore[]> => {
    if (!eventId) return [];

    const now = Date.now();
    const cacheKey = `${eventId}-${incidentType}-${priority}-${JSON.stringify(location)}-${requiredSkills.sort().join(',')}`;
    
    // Check cache first
    const cached = assignmentScoresCacheRef.current.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.scores;
    }

    try {
      const scores = await getStaffSuggestions(
        eventId,
        incidentType,
        priority,
        location,
        requiredSkills
      );
      
      // Update cache
      assignmentScoresCacheRef.current.set(cacheKey, {
        scores,
        timestamp: now
      });
      
      return scores;
    } catch (error) {
      console.error('Error getting staff suggestions:', error);
      return [];
    }
  }, [eventId]);

  // Pagination controls
  const nextPage = useCallback(() => {
    if (paginationManagerRef.current.hasMore()) {
      paginationManagerRef.current.nextPage();
      setState(prev => ({
        ...prev,
        availableStaff: paginationManagerRef.current.getPageData(allStaffData),
        pagination: paginationManagerRef.current.getPaginationInfo()
      }));
    }
  }, [allStaffData]);

  const prevPage = useCallback(() => {
    paginationManagerRef.current.prevPage();
    setState(prev => ({
      ...prev,
      availableStaff: paginationManagerRef.current.getPageData(allStaffData),
      pagination: paginationManagerRef.current.getPaginationInfo()
    }));
  }, [allStaffData]);

  const setPage = useCallback((page: number) => {
    paginationManagerRef.current.setPage(page);
    setState(prev => ({
      ...prev,
      availableStaff: paginationManagerRef.current.getPageData(allStaffData),
      pagination: paginationManagerRef.current.getPaginationInfo()
    }));
  }, [allStaffData]);

  const setPageSize = useCallback((size: number) => {
    paginationManagerRef.current.setPageSize(size);
    setState(prev => ({
      ...prev,
      availableStaff: paginationManagerRef.current.getPageData(allStaffData),
      pagination: paginationManagerRef.current.getPaginationInfo()
    }));
  }, [allStaffData]);

  // Add suggestion to the list
  const addSuggestion = useCallback((suggestion: StaffSuggestion) => {
    setSuggestions(prev => [...prev, suggestion]);
  }, []);

  // Remove suggestion from the list
  const removeSuggestion = useCallback((index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Optimized filtering methods with memoization
  const getStaffBySkills = useCallback((skills: string[]): StaffMember[] => {
    if (skills.length === 0) return filteredStaffData;

    return filteredStaffData.filter(staff =>
      skills.some(skill => staff.skill_tags.includes(skill))
    );
  }, [filteredStaffData]);

  const getStaffByStatus = useCallback((status: 'available' | 'busy' | 'offline'): StaffMember[] => {
    return filteredStaffData.filter(staff => staff.availability_status === status);
  }, [filteredStaffData]);

  const getStaffByWorkload = useCallback((maxAssignments: number): StaffMember[] => {
    return filteredStaffData.filter(staff => staff.active_assignments <= maxAssignments);
  }, [filteredStaffData]);

  const getStaffByProximity = useCallback((
    location: { latitude: number; longitude: number },
    maxDistanceKm: number = 5
  ): StaffMember[] => {
    return filteredStaffData.filter(staff => {
      if (!staff.current_location) return false;
      
      const distance = calculateDistance(
        staff.current_location.latitude,
        staff.current_location.longitude,
        location.latitude,
        location.longitude
      );
      
      return distance <= maxDistanceKm;
    });
  }, [filteredStaffData]);

  // Calculate distance between two GPS coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get optimal staff for incident assignment
  const getOptimalStaff = useCallback(async (
    incidentType: string,
    priority: string,
    location?: { latitude: number; longitude: number },
    requiredSkills: string[] = []
  ): Promise<StaffMember[]> => {
    const suggestions = await getSuggestions(incidentType, priority, location, requiredSkills);
    const suggestionIds = suggestions.map(s => s.staff_id);
    
    return filteredStaffData.filter(staff => suggestionIds.includes(staff.id));
  }, [filteredStaffData, getSuggestions]);

  // Check if staff is available for assignment
  const isStaffAvailable = useCallback((staffId: string): boolean => {
    const staff = filteredStaffData.find(s => s.id === staffId);
    return staff ? staff.availability_status === 'available' && staff.active_assignments < 3 : false;
  }, [filteredStaffData]);

  // Get staff workload distribution
  const getWorkloadDistribution = useCallback(() => {
    const distribution = {
      '0 assignments': 0,
      '1 assignment': 0,
      '2 assignments': 0,
      '3+ assignments': 0
    };

    filteredStaffData.forEach(staff => {
      if (staff.active_assignments === 0) distribution['0 assignments']++;
      else if (staff.active_assignments === 1) distribution['1 assignment']++;
      else if (staff.active_assignments === 2) distribution['2 assignments']++;
      else distribution['3+ assignments']++;
    });

    return distribution;
  }, [filteredStaffData]);

  // Get skill coverage analysis
  const getSkillCoverage = useCallback(() => {
    const allSkills = new Set<string>();
    const skillCounts: Record<string, number> = {};

    filteredStaffData.forEach(staff => {
      staff.skill_tags.forEach(skill => {
        allSkills.add(skill);
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    return {
      totalSkills: allSkills.size,
      skillCounts,
      understaffedSkills: Object.entries(skillCounts)
        .filter(([_, count]) => count < 2)
        .map(([skill]) => skill)
    };
  }, [filteredStaffData]);

  // Global subscription manager to prevent multiple subscriptions
  const globalSubscriptionManager = useRef<{
    subscriptions: Map<string, any>;
    eventId: string | null;
    isSubscribed: boolean;
    cleanupTimer: NodeJS.Timeout | null;
    componentCount: Map<string, number>;
  }>({
    subscriptions: new Map(),
    eventId: null,
    isSubscribed: false,
    cleanupTimer: null,
    componentCount: new Map()
  });

  // Optimized real-time subscriptions with global management
  useEffect(() => {
    if (!eventId) return;
    const manager = globalSubscriptionManager.current;

    // Initial fetch
    fetchStaffAvailability(true);

    // Track component instances per event
    const currentCount = manager.componentCount.get(eventId) || 0;
    manager.componentCount.set(eventId, currentCount + 1);

    // Check if we already have subscriptions for this event
    if (manager.eventId === eventId && manager.isSubscribed) {
      return; // Already subscribed to this event
    }

    // Clean up existing subscriptions if switching events
    if (manager.eventId && manager.eventId !== eventId) {
      manager.subscriptions.forEach((sub) => {
        try {
          supabase.removeChannel(sub);
        } catch (error) {
          console.warn('Error removing subscription during event switch:', error);
        }
      });
      manager.subscriptions.clear();
      manager.isSubscribed = false;
      manager.componentCount.clear();
    }

    // Throttled update function with proper cleanup
    const throttledUpdate = (() => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          // Only update if component is still mounted and event is still valid
          if (manager.eventId === eventId) {
            staffCacheRef.current.clear();
            assignmentScoresCacheRef.current.clear();
            fetchStaffAvailability(false, true); // Use incremental update
          }
        }, DEBOUNCE_DELAY);
      };
    })();

    // Create optimized subscriptions with specific filters
    const subscriptionKeys = [
      'staff_availability_incidents',
      'staff_availability_staff', 
      'staff_availability_callsigns'
    ];

    const subscriptions = [
      // Incident changes affecting staff assignments
      supabase
        .channel('staff_availability_incidents')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'incident_logs',
            filter: `event_id=eq.${eventId} AND (assigned_staff_ids IS NOT NULL OR is_closed=eq.true)`
          },
          throttledUpdate
        )
        .subscribe(),

      // Staff availability changes
      supabase
        .channel('staff_availability_staff')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'staff',
            filter: 'availability_status=in.(available,busy,offline) OR active=eq.true'
          },
          throttledUpdate
        )
        .subscribe(),

      // Callsign assignment changes (location tracking not available in current schema)
      supabase
        .channel('staff_availability_callsigns')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'callsign_assignments',
            filter: `event_id=eq.${eventId}`
          },
          throttledUpdate
        )
        .subscribe()
    ];

    // Store subscriptions in global manager
    subscriptionKeys.forEach((key, index) => {
      manager.subscriptions.set(key, subscriptions[index]);
    });
    manager.eventId = eventId;
    manager.isSubscribed = true;

    return () => {
      // Decrement component count for this event
      const currentCount = manager.componentCount.get(eventId) || 0;
      const newCount = Math.max(0, currentCount - 1);
      
      if (newCount === 0) {
        // No more components using this event, clean up subscriptions
        manager.componentCount.delete(eventId);
        
        // Clear existing cleanup timer
        if (manager.cleanupTimer) {
          clearTimeout(manager.cleanupTimer);
        }
        
        // Immediate cleanup for last component
        manager.subscriptions.forEach((sub) => {
          try {
            supabase.removeChannel(sub);
          } catch (error) {
            console.warn('Error removing subscription:', error);
          }
        });
        manager.subscriptions.clear();
        manager.isSubscribed = false;
        manager.eventId = null;
        manager.cleanupTimer = null;
      } else {
        // Other components still using this event, update count
        manager.componentCount.set(eventId, newCount);
      }
      
      // Clean up debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [eventId, fetchStaffAvailability]);

  // Refresh data manually
  const refresh = useCallback(() => {
    fetchStaffAvailability(true);
  }, [fetchStaffAvailability]);

  return {
    // State
    ...state,
    suggestions,
    
    // Actions
    fetchStaffAvailability,
    getSuggestions,
    addSuggestion,
    removeSuggestion,
    clearSuggestions,
    refresh,
    
    // Pagination
    nextPage,
    prevPage,
    setPage,
    setPageSize,
    
    // Filtering methods
    getStaffBySkills,
    getStaffByStatus,
    getStaffByWorkload,
    getStaffByProximity,
    getOptimalStaff,
    
    // Analysis methods
    isStaffAvailable,
    getWorkloadDistribution,
    getSkillCoverage
  };
}
