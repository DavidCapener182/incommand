import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger'

let browserSupabaseClientPromise: Promise<SupabaseClient> | null = null;

async function getBrowserSupabaseClient(): Promise<SupabaseClient> {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client must be provided when using incident assignment utilities on the server');
  }

  if (!browserSupabaseClientPromise) {
    browserSupabaseClientPromise = import('./supabase').then(module => module.supabase as SupabaseClient);
  }

  return browserSupabaseClientPromise;
}

async function resolveSupabaseClient(client?: SupabaseClient): Promise<SupabaseClient> {
  if (client) {
    return client;
  }

  return getBrowserSupabaseClient();
}

// Caching for performance optimization
const staffCache = new Map<string, { data: StaffMember[]; timestamp: number }>();
const assignmentScoresCache = new Map<string, { data: AssignmentScore[]; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Error types for structured error handling
export enum AssignmentErrorType {
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  TABLE_NOT_FOUND = 'TABLE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_DATA = 'INVALID_DATA',
  STAFF_NOT_FOUND = 'STAFF_NOT_FOUND',
  ASSIGNMENT_FAILED = 'ASSIGNMENT_FAILED',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export interface AssignmentError {
  type: AssignmentErrorType;
  message: string;
  context: Record<string, any>;
  timestamp: number;
  originalError?: any;
}

// Error logging utility
function logAssignmentError(
  type: AssignmentErrorType,
  message: string,
  context: Record<string, any> = {},
  originalError?: any
): AssignmentError {
  const error: AssignmentError = {
    type,
    message,
    context,
    timestamp: Date.now(),
    originalError
  };

  logger.error('Assignment Error', { 
    component: 'IncidentAssignment', 
    action: 'logAssignmentError',
    type: error.type,
    message: error.message,
    context: error.context,
    timestamp: new Date(error.timestamp).toISOString(),
    originalError: error.originalError?.message || error.originalError
  });

  return error;
}

export interface StaffMember {
  id: string;
  full_name: string;
  skill_tags: string[];
  availability_status: 'available' | 'busy' | 'offline';
  active_assignments: number;
  current_location?: {
    latitude: number;
    longitude: number;
  };
  max_assignments: number;
  company_id: string;
}

export interface AssignmentScore {
  staff_id: string;
  score: number;
  reasons: string[];
  distance?: number;
  skill_match: number;
  availability_score: number;
  workload_score: number;
}

export interface AssignmentStats {
  totalStaff: number;
  availableStaff: number;
  assignedStaff: number;
  averageWorkload: number;
  skillGaps: string[];
}

// Assignment rules configuration - now configurable through database or config files
interface AssignmentRule {
  requiredSkills: string[];
  maxDistance: number; // km
  maxAssignments: number;
  priority: 'low' | 'medium' | 'high';
  autoAssign: boolean;
}

// Default assignment rules (fallback if database config not available)
const DEFAULT_ASSIGNMENT_RULES: Record<string, AssignmentRule> = {
  'medical': {
    requiredSkills: ['medical', 'first_aid'],
    maxDistance: 10,
    maxAssignments: 2,
    priority: 'high',
    autoAssign: true
  },
  'fire': {
    requiredSkills: ['fire_safety', 'firefighting'],
    maxDistance: 15,
    maxAssignments: 3,
    priority: 'high',
    autoAssign: true
  },
  'security': {
    requiredSkills: ['security', 'crowd_control'],
    maxDistance: 8,
    maxAssignments: 2,
    priority: 'medium',
    autoAssign: true
  },
  'logistics': {
    requiredSkills: ['logistics', 'coordination'],
    maxDistance: 20,
    maxAssignments: 4,
    priority: 'medium',
    autoAssign: true
  },
  'communications': {
    requiredSkills: ['communications', 'radio'],
    maxDistance: 12,
    maxAssignments: 2,
    priority: 'medium',
    autoAssign: true
  }
};

// Cache for database-loaded assignment rules
const assignmentRulesCache = new Map<string, { rules: Record<string, AssignmentRule>; timestamp: number }>();
const ASSIGNMENT_RULES_CACHE_DURATION = 300000; // 5 minutes

// Load assignment rules from database or config file
async function loadAssignmentRules(
  eventId?: string,
  supabaseClient?: SupabaseClient
): Promise<Record<string, AssignmentRule>> {
  const supabase = eventId ? await resolveSupabaseClient(supabaseClient) : null;
  try {
    // Check cache first
    const now = Date.now();
    const cacheKey = eventId || 'global';
    const cached = assignmentRulesCache.get(cacheKey);
    if (cached && now - cached.timestamp < ASSIGNMENT_RULES_CACHE_DURATION) {
      return cached.rules;
    }

    // Try to load from database first
    if (eventId && supabase) {
      const { data: dbRules, error } = await supabase
        .from('assignment_rules')
        .select('*')
        .eq('event_id', eventId)
        .eq('active', true);

      if (!error && dbRules && dbRules.length > 0) {
        const rules: Record<string, AssignmentRule> = {};
        dbRules.forEach(rule => {
          rules[rule.incident_type] = {
            requiredSkills: rule.required_skills || [],
            maxDistance: rule.max_distance || 20,
            maxAssignments: rule.max_assignments || 3,
            priority: rule.priority || 'medium',
            autoAssign: rule.auto_assign !== false
          };
        });

        // Update cache
        assignmentRulesCache.set(cacheKey, { rules, timestamp: now });
        return rules;
      }
    }

    // Fallback to config file or default rules
    try {
      // Try to load from config file
      const configResponse = await fetch('/api/assignment-rules');
      if (configResponse.ok) {
        const configRules = await configResponse.json();
        assignmentRulesCache.set(cacheKey, { rules: configRules, timestamp: now });
        return configRules;
      }
    } catch (configError) {
      console.warn('Failed to load assignment rules from config file:', configError);
    }

    // Return default rules
    assignmentRulesCache.set(cacheKey, { rules: DEFAULT_ASSIGNMENT_RULES, timestamp: now });
    return DEFAULT_ASSIGNMENT_RULES;

  } catch (error) {
    console.error('Error loading assignment rules:', error);
    return DEFAULT_ASSIGNMENT_RULES;
  }
}

// Get assignment rules for a specific incident type
async function getAssignmentRule(
  incidentType: string,
  eventId?: string,
  supabaseClient?: SupabaseClient
): Promise<AssignmentRule> {
  const rules = await loadAssignmentRules(eventId, supabaseClient);
  return rules[incidentType.toLowerCase()] || {
    requiredSkills: [],
    maxDistance: 20,
    maxAssignments: 3,
    priority: 'medium',
    autoAssign: true
  };
}

// Get available staff for an event
export async function getAvailableStaff(
  eventId: string,
  supabaseClient?: SupabaseClient
): Promise<StaffMember[]> {
  try {
    if (!eventId) {
      throw logAssignmentError(
        AssignmentErrorType.VALIDATION_ERROR,
        'Event ID is required for staff lookup',
        { eventId }
      );
    }

    const supabase = await resolveSupabaseClient(supabaseClient);

    // Check cache first
    const now = Date.now();
    const cached = staffCache.get(eventId);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Check if staff table exists with timeout
    const tableCheckPromise = supabase
      .from('staff')
      .select('id')
      .limit(1);

    const tableCheckResult = await Promise.race([
      tableCheckPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 10000)
      )
    ]) as any;

    if (tableCheckResult.error) {
      if (tableCheckResult.error.code === 'PGRST116') {
        throw logAssignmentError(
          AssignmentErrorType.TABLE_NOT_FOUND,
          'Staff table does not exist in database',
          { eventId, errorCode: tableCheckResult.error.code },
          tableCheckResult.error
        );
      } else if (tableCheckResult.error.code === 'PGRST301') {
        throw logAssignmentError(
          AssignmentErrorType.PERMISSION_DENIED,
          'Insufficient permissions to access staff table',
          { eventId, errorCode: tableCheckResult.error.code },
          tableCheckResult.error
        );
      } else {
        throw logAssignmentError(
          AssignmentErrorType.DATABASE_CONNECTION,
          'Failed to connect to staff table',
          { eventId, errorCode: tableCheckResult.error.code },
          tableCheckResult.error
        );
      }
    }

    // Optimized query using database joins instead of multiple sequential queries
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select(`
        id,
        full_name,
        skill_tags,
        availability_status,
        max_assignments,
        company_id,
        incident_logs!inner(
          assigned_staff_ids,
          is_closed
        ),
        callsign_assignments!inner(
          current_location
        )
      `)
      .eq('availability_status', 'available')
      .eq('active', true)
      .eq('incident_logs.event_id', eventId)
      .eq('incident_logs.is_closed', false)
      .eq('callsign_assignments.event_id', eventId);

    if (staffError) {
      if (staffError.code === 'PGRST301') {
        throw logAssignmentError(
          AssignmentErrorType.PERMISSION_DENIED,
          'Insufficient permissions to query staff data',
          { eventId, errorCode: staffError.code },
          staffError
        );
      } else if (staffError.code === 'PGRST116') {
        throw logAssignmentError(
          AssignmentErrorType.TABLE_NOT_FOUND,
          'Staff table not found or inaccessible',
          { eventId, errorCode: staffError.code },
          staffError
        );
      } else {
        throw logAssignmentError(
          AssignmentErrorType.DATABASE_CONNECTION,
          'Failed to fetch staff data from database',
          { eventId, errorCode: staffError.code },
          staffError
        );
      }
    }

    if (!staffData || staffData.length === 0) {
      logAssignmentError(
        AssignmentErrorType.STAFF_NOT_FOUND,
        'No available staff found for event',
        { eventId, staffCount: 0 }
      );
      return [];
    }

    // Process joined data efficiently
    const result = staffData?.map(staff => {
      // Validate staff data
      if (!staff.id || !staff.full_name) {
        logAssignmentError(
          AssignmentErrorType.INVALID_DATA,
          'Staff record missing required fields',
          { staffId: staff.id, eventId }
        );
        return null;
      }

      // Count active assignments from joined data
      const activeAssignments = staff.incident_logs?.reduce((count, incident) => {
        if (incident.assigned_staff_ids && Array.isArray(incident.assigned_staff_ids)) {
          return count + incident.assigned_staff_ids.filter((id: string) => id === staff.id).length;
        }
        return count;
      }, 0) || 0;

      // Get location from joined data
      const currentLocation = staff.callsign_assignments?.[0]?.current_location;

      return {
        ...staff,
        active_assignments: activeAssignments,
        current_location: currentLocation && 
          typeof currentLocation.latitude === 'number' && 
          typeof currentLocation.longitude === 'number' 
          ? currentLocation 
          : undefined,
        skill_tags: Array.isArray(staff.skill_tags) ? staff.skill_tags : [],
        max_assignments: staff.max_assignments || 3
      };
    }).filter(Boolean) as StaffMember[];

    // Update cache with error handling
    try {
      staffCache.set(eventId, { data: result, timestamp: now });
    } catch (cacheError) {
      logAssignmentError(
        AssignmentErrorType.CACHE_ERROR,
        'Failed to update staff cache',
        { eventId },
        cacheError
      );
    }

    return result;

  } catch (error) {
    // Re-throw structured errors
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }
    
    // Handle unexpected errors
    throw logAssignmentError(
      AssignmentErrorType.NETWORK_ERROR,
      'Unexpected error while fetching available staff',
      { eventId },
      error
    );
  }
}

// Get staff suggestions for incident assignment
export async function getStaffSuggestions(
  eventId: string,
  incidentType: string,
  priority: string,
  location?: { latitude: number; longitude: number },
  requiredSkills: string[] = [],
  supabaseClient?: SupabaseClient
): Promise<AssignmentScore[]> {
  try {
    if (!eventId || !incidentType || !priority) {
      throw logAssignmentError(
        AssignmentErrorType.VALIDATION_ERROR,
        'Missing required parameters for staff suggestions',
        { eventId, incidentType, priority }
      );
    }

    // Validate location data if provided
    if (location && (typeof location.latitude !== 'number' || typeof location.longitude !== 'number')) {
      throw logAssignmentError(
        AssignmentErrorType.VALIDATION_ERROR,
        'Invalid location data provided',
        { location, eventId, incidentType }
      );
    }

    // Check cache first
    const now = Date.now();
    const cacheKey = `${eventId}-${incidentType}-${priority}-${JSON.stringify(location)}-${requiredSkills.sort().join(',')}`;
    const cached = assignmentScoresCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const availableStaff = await getAvailableStaff(eventId, supabaseClient);
    
    if (availableStaff.length === 0) {
      logAssignmentError(
        AssignmentErrorType.STAFF_NOT_FOUND,
        'No available staff found for suggestions',
        { eventId, incidentType, priority }
      );
      return [];
    }

    const rules = await getAssignmentRule(incidentType, eventId, supabaseClient);

    const finalRequiredSkills = [...rules.requiredSkills, ...requiredSkills];
    const scores: AssignmentScore[] = [];

    for (const staff of availableStaff) {
      try {
        // Skip if staff has too many assignments
        if (staff.active_assignments >= rules.maxAssignments) continue;

        // Calculate skill match
        const skillMatch = calculateSkillMatch(staff.skill_tags, finalRequiredSkills);
        if (skillMatch === 0) continue; // Skip if no required skills

        // Calculate availability score
        const availabilityScore = calculateAvailabilityScore(staff, priority);

        // Calculate workload score
        const workloadScore = calculateWorkloadScore(staff);

        // Calculate distance score if location provided
        let distanceScore = 1;
        let distance: number | undefined;
        if (location && staff.current_location) {
          try {
            distance = calculateDistance(
              staff.current_location.latitude,
              staff.current_location.longitude,
              location.latitude,
              location.longitude
            );
            
            if (distance > rules.maxDistance) continue; // Skip if too far
            
            distanceScore = Math.max(0, 1 - (distance / rules.maxDistance));
          } catch (distanceError) {
            logAssignmentError(
              AssignmentErrorType.INVALID_DATA,
              'Failed to calculate distance for staff member',
              { staffId: staff.id, location, staffLocation: staff.current_location },
              distanceError
            );
            continue;
          }
        }

        // Calculate overall score
        const overallScore = (
          skillMatch * 0.4 +
          availabilityScore * 0.3 +
          workloadScore * 0.2 +
          distanceScore * 0.1
        );

        const reasons: string[] = [];
        if (skillMatch > 0.8) reasons.push('Excellent skill match');
        if (availabilityScore > 0.8) reasons.push('Highly available');
        if (workloadScore > 0.8) reasons.push('Low workload');
        if (distance && distance < 5) reasons.push('Close proximity');

        scores.push({
          staff_id: staff.id,
          score: overallScore,
          reasons,
          distance,
          skill_match: skillMatch,
          availability_score: availabilityScore,
          workload_score: workloadScore
        });
      } catch (staffError) {
        logAssignmentError(
          AssignmentErrorType.INVALID_DATA,
          'Error processing staff member for suggestions',
          { staffId: staff.id, eventId, incidentType },
          staffError
        );
        continue;
      }
    }

    // Sort by score (highest first)
    const result = scores.sort((a, b) => b.score - a.score);

    // Update cache with error handling
    try {
      assignmentScoresCache.set(cacheKey, { data: result, timestamp: now });
    } catch (cacheError) {
      logAssignmentError(
        AssignmentErrorType.CACHE_ERROR,
        'Failed to update assignment scores cache',
        { cacheKey },
        cacheError
      );
    }

    return result;

  } catch (error) {
    // Re-throw structured errors
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }
    
    throw logAssignmentError(
      AssignmentErrorType.NETWORK_ERROR,
      'Unexpected error while getting staff suggestions',
      { eventId, incidentType, priority },
      error
    );
  }
}

// Auto-assign staff to an incident
export async function autoAssignIncident(
  incidentId: string,
  eventId: string,
  incidentType: string,
  priority: string,
  location?: { latitude: number; longitude: number },
  requiredSkills: string[] = [],
  supabaseClient?: SupabaseClient
): Promise<{ assignedStaff: string[]; assignmentNotes: string }> {
  try {
    if (!incidentId || !eventId || !incidentType || !priority) {
      throw logAssignmentError(
        AssignmentErrorType.VALIDATION_ERROR,
        'Missing required parameters for auto-assignment',
        { incidentId, eventId, incidentType, priority }
      );
    }

    const supabase = await resolveSupabaseClient(supabaseClient);

    // Check if incident_logs table exists
    const { error: tableCheckError } = await supabase
      .from('incident_logs')
      .select('id')
      .eq('id', incidentId)
      .limit(1);

    if (tableCheckError) {
      if (tableCheckError.code === 'PGRST116') {
        throw logAssignmentError(
          AssignmentErrorType.TABLE_NOT_FOUND,
          'Incident logs table not found',
          { incidentId, eventId, errorCode: tableCheckError.code },
          tableCheckError
        );
      } else if (tableCheckError.code === 'PGRST301') {
        throw logAssignmentError(
          AssignmentErrorType.PERMISSION_DENIED,
          'Insufficient permissions to access incident logs',
          { incidentId, eventId, errorCode: tableCheckError.code },
          tableCheckError
        );
      } else {
        throw logAssignmentError(
          AssignmentErrorType.DATABASE_CONNECTION,
          'Failed to verify incident exists',
          { incidentId, eventId, errorCode: tableCheckError.code },
          tableCheckError
        );
      }
    }

    const suggestions = await getStaffSuggestions(
      eventId,
      incidentType,
      priority,
      location,
      requiredSkills,
      supabase
    );

    if (suggestions.length === 0) {
      logAssignmentError(
        AssignmentErrorType.STAFF_NOT_FOUND,
        'No suitable staff available for auto-assignment',
        { incidentId, eventId, incidentType, priority }
      );
      return {
        assignedStaff: [],
        assignmentNotes: 'No suitable staff available for assignment'
      };
    }

    // Determine how many staff to assign based on incident type and priority
    const staffCount = await getRequiredStaffCount(incidentType, priority, eventId, supabase);
    const selectedStaff = suggestions.slice(0, staffCount);
    const assignedStaffIds = selectedStaff.map(s => s.staff_id);

    // Update the incident with assigned staff
    const { error: updateError } = await supabase
      .from('incident_logs')
      .update({
        assigned_staff_ids: assignedStaffIds,
        auto_assigned: true,
        assignment_notes: `Auto-assigned ${assignedStaffIds.length} staff member(s) based on skills and availability`
      })
      .eq('id', incidentId);

    if (updateError) {
      if (updateError.code === 'PGRST301') {
        throw logAssignmentError(
          AssignmentErrorType.PERMISSION_DENIED,
          'Insufficient permissions to update incident assignment',
          { incidentId, eventId, errorCode: updateError.code },
          updateError
        );
      } else if (updateError.code === 'PGRST116') {
        throw logAssignmentError(
          AssignmentErrorType.TABLE_NOT_FOUND,
          'Incident logs table not found during update',
          { incidentId, eventId, errorCode: updateError.code },
          updateError
        );
      } else {
        throw logAssignmentError(
          AssignmentErrorType.ASSIGNMENT_FAILED,
          'Failed to update incident with assignment data',
          { incidentId, eventId, errorCode: updateError.code },
          updateError
        );
      }
    }

    // Clear relevant caches
    try {
      clearAssignmentCache(eventId);
    } catch (cacheError) {
      logAssignmentError(
        AssignmentErrorType.CACHE_ERROR,
        'Failed to clear assignment cache after assignment',
        { eventId },
        cacheError
      );
    }

    return {
      assignedStaff: assignedStaffIds,
      assignmentNotes: `Auto-assigned ${assignedStaffIds.length} staff member(s). ${selectedStaff[0]?.reasons.join(', ')}`
    };

  } catch (error) {
    // Re-throw structured errors
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }
    
    throw logAssignmentError(
      AssignmentErrorType.NETWORK_ERROR,
      'Unexpected error during auto-assignment',
      { incidentId, eventId, incidentType },
      error
    );
  }
}

// Get assignment statistics
export async function getAssignmentStats(
  eventId: string,
  supabaseClient?: SupabaseClient
): Promise<AssignmentStats> {
  try {
    if (!eventId) {
      throw logAssignmentError(
        AssignmentErrorType.VALIDATION_ERROR,
        'Event ID is required for assignment statistics',
        { eventId }
      );
    }

    const availableStaff = await getAvailableStaff(eventId, supabaseClient);
    const totalStaff = availableStaff.length;
    
    const assignedStaff = availableStaff.filter(staff => staff.active_assignments > 0).length;
    const averageWorkload = totalStaff > 0 
      ? availableStaff.reduce((sum, staff) => sum + staff.active_assignments, 0) / totalStaff 
      : 0;

    // Calculate skill gaps
    const allSkills = new Set<string>();
    const skillCounts: Record<string, number> = {};

    availableStaff.forEach(staff => {
      if (Array.isArray(staff.skill_tags)) {
        staff.skill_tags.forEach(skill => {
          allSkills.add(skill);
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      }
    });

    const skillGaps = Object.entries(skillCounts)
      .filter(([_, count]) => count < 2)
      .map(([skill]) => skill);

    return {
      totalStaff,
      availableStaff: totalStaff - assignedStaff,
      assignedStaff,
      averageWorkload,
      skillGaps
    };

  } catch (error) {
    // Re-throw structured errors
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }
    
    throw logAssignmentError(
      AssignmentErrorType.NETWORK_ERROR,
      'Unexpected error while getting assignment statistics',
      { eventId },
      error
    );
  }
}

// Helper functions
function calculateSkillMatch(staffSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 1;
  
  if (!Array.isArray(staffSkills)) {
    return 0;
  }
  
  const matchingSkills = requiredSkills.filter(skill => 
    staffSkills.includes(skill)
  );
  
  return matchingSkills.length / requiredSkills.length;
}

function calculateAvailabilityScore(staff: StaffMember, priority: string): number {
  const baseScore = staff.availability_status === 'available' ? 1 : 0;
  
  // Adjust based on priority and current workload
  const workloadFactor = Math.max(0, 1 - (staff.active_assignments / staff.max_assignments));
  
  // Higher priority incidents get preference for less busy staff
  const priorityFactor = priority === 'urgent' ? 1.2 : priority === 'high' ? 1.1 : 1;
  
  return baseScore * workloadFactor * priorityFactor;
}

function calculateWorkloadScore(staff: StaffMember): number {
  const maxAssignments = staff.max_assignments || 3;
  return Math.max(0, 1 - (staff.active_assignments / maxAssignments));
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Validate input coordinates
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    throw new Error('Invalid coordinates provided for distance calculation');
  }
  
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    throw new Error('Latitude must be between -90 and 90 degrees');
  }
  
  if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
    throw new Error('Longitude must be between -180 and 180 degrees');
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function getRequiredStaffCount(
  incidentType: string,
  priority: string,
  eventId?: string,
  supabaseClient?: SupabaseClient
): Promise<number> {
  const rule = await getAssignmentRule(incidentType, eventId, supabaseClient);
  const baseCount = rule.maxAssignments || 2;
  
  // Adjust based on priority
  switch (priority) {
    case 'urgent':
      return Math.min(baseCount + 1, 4);
    case 'high':
      return baseCount;
    case 'medium':
      return Math.max(1, baseCount - 1);
    case 'low':
      return 1;
    default:
      return baseCount;
  }
}

// Get required skills for incident type
export function getRequiredSkillsForIncidentType(incidentType: string): string[] {
  const skillMap: Record<string, string[]> = {
    'Medical': ['medical', 'first_aid', 'emergency'],
    'Ejection': ['security', 'conflict_resolution', 'physical_intervention'],
    'Refusal': ['security', 'conflict_resolution', 'communication'],
    'Welfare': ['welfare', 'safeguarding', 'mental_health'],
    'Suspicious Behaviour': ['security', 'surveillance', 'threat_assessment'],
    'Lost Property': ['customer_service', 'investigation'],
    'Technical Issue': ['technical', 'it_support'],
    'Site Issue': ['maintenance', 'safety'],
    'Weather Disruption': ['safety', 'crowd_management'],
    'Queue Build-Up': ['crowd_management', 'communication'],
    'Aggressive Behaviour': ['security', 'conflict_resolution', 'physical_intervention'],
    'Fire Alarm': ['emergency', 'evacuation', 'safety'],
    'Evacuation': ['emergency', 'crowd_management', 'safety'],
    'Counter-Terror Alert': ['security', 'emergency', 'threat_assessment'],
    'Sexual Misconduct': ['safeguarding', 'investigation', 'confidentiality'],
    'Missing Child/Person': ['safeguarding', 'investigation', 'communication'],
    'Fire': ['fire_safety', 'firefighting', 'emergency'],
    'Security': ['security', 'crowd_control', 'conflict_resolution'],
    'Hostile Act': ['security', 'emergency', 'threat_assessment'],
    'Alcohol / Drug Related': ['security', 'conflict_resolution', 'investigation'],
    'Weapon Related': ['security', 'emergency', 'threat_assessment'],
    'Theft': ['security', 'investigation', 'customer_service'],
    'Entry Breach': ['security', 'crowd_control', 'investigation'],
    'Noise Complaint': ['communications', 'customer_service', 'conflict_resolution'],
    'Animal Incident': ['safety', 'crowd_management', 'communications'],
    'Emergency Show Stop': ['emergency', 'crowd_management', 'communications'],
    'Accreditation': ['customer_service', 'communications', 'investigation'],
    'Staffing': ['communications', 'coordination', 'management'],
    'Accsessablity': ['customer_service', 'communications', 'safety'],
    'Suspected Fire': ['fire_safety', 'emergency', 'evacuation'],
    'Showdown': ['communications', 'coordination'],
    'Fight': ['security', 'conflict_resolution', 'physical_intervention'],
    'Artist Movement': ['security', 'crowd_management', 'communications'],
    'Artist On Stage': ['crowd_management', 'communications', 'safety'],
    'Artist Off Stage': ['crowd_management', 'communications', 'safety'],
    'Event Timing': ['communications', 'coordination'],
    'Crowd Management': ['crowd_management', 'communications', 'safety'],
    'Timings': ['communications', 'coordination'],
    'Sit Rep': ['communications', 'coordination'],
    'Attendance': ['communications', 'coordination'],
    'Environmental': ['safety', 'maintenance', 'communications'],
    'Other': ['communications', 'coordination']
  };
  
  return skillMap[incidentType] || [];
}

// Clear cache for performance management
export function clearAssignmentCache(eventId?: string) {
  try {
    if (eventId) {
      staffCache.delete(eventId);
      // Clear all assignment scores for this event
      const keys = Array.from(assignmentScoresCache.keys());
      for (const key of keys) {
        if (key.startsWith(eventId)) {
          assignmentScoresCache.delete(key);
        }
      }
      // Clear assignment rules cache for this event
      assignmentRulesCache.delete(eventId);
    } else {
      staffCache.clear();
      assignmentScoresCache.clear();
      assignmentRulesCache.clear();
    }
  } catch (error) {
    logAssignmentError(
      AssignmentErrorType.CACHE_ERROR,
      'Failed to clear assignment cache',
      { eventId },
      error
    );
  }
}

// Export functions for managing assignment rules
export async function getAssignmentRules(
  eventId?: string,
  supabaseClient?: SupabaseClient
): Promise<Record<string, AssignmentRule>> {
  return await loadAssignmentRules(eventId, supabaseClient);
}

export async function updateAssignmentRule(
  incidentType: string,
  rule: Partial<AssignmentRule>,
  eventId?: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  try {
    if (eventId) {
      const supabase = await resolveSupabaseClient(supabaseClient);
      // Update in database
      const { error } = await supabase
        .from('assignment_rules')
        .upsert({
          event_id: eventId,
          incident_type: incidentType,
          required_skills: rule.requiredSkills,
          max_distance: rule.maxDistance,
          max_assignments: rule.maxAssignments,
          priority: rule.priority,
          auto_assign: rule.autoAssign,
          active: true,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
    }

    // Clear cache to force reload
    clearAssignmentCache(eventId);
  } catch (error) {
    logAssignmentError(
      AssignmentErrorType.VALIDATION_ERROR,
      'Failed to update assignment rule',
      { incidentType, eventId },
      error
    );
    throw error;
  }
}

export async function deleteAssignmentRule(
  incidentType: string,
  eventId?: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  try {
    if (eventId) {
      const supabase = await resolveSupabaseClient(supabaseClient);
      // Soft delete in database
      const { error } = await supabase
        .from('assignment_rules')
        .update({ active: false })
        .eq('event_id', eventId)
        .eq('incident_type', incidentType);

      if (error) {
        throw error;
      }
    }

    // Clear cache to force reload
    clearAssignmentCache(eventId);
  } catch (error) {
    logAssignmentError(
      AssignmentErrorType.VALIDATION_ERROR,
      'Failed to delete assignment rule',
      { incidentType, eventId },
      error
    );
    throw error;
  }
}

// Validate assignment rules
export async function validateAssignmentRules(
  staffId: string,
  incidentType: string,
  currentAssignments: number,
  staffSkills: string[] = [],
  supabaseClient?: SupabaseClient
): Promise<{ valid: boolean; reason?: string }> {
  try {
    if (!staffId || !incidentType) {
      return {
        valid: false,
        reason: 'Staff ID and incident type are required for validation'
      };
    }

    if (typeof currentAssignments !== 'number' || currentAssignments < 0) {
      return {
        valid: false,
        reason: 'Current assignments must be a non-negative number'
      };
    }

    const rules = await getAssignmentRule(incidentType, undefined, supabaseClient);
    
    if (!rules) {
      return { valid: true }; // No specific rules for this incident type
    }

    // Check workload limits
    if (currentAssignments >= rules.maxAssignments) {
      return {
        valid: false,
        reason: `Staff member already has ${currentAssignments} assignments (max: ${rules.maxAssignments})`
      };
    }

    // Check skill requirements for critical incident types
    if (rules.requiredSkills && rules.requiredSkills.length > 0) {
      if (!Array.isArray(staffSkills)) {
        return {
          valid: false,
          reason: 'Staff skills must be provided as an array'
        };
      }

      const hasRequiredSkills = rules.requiredSkills.some(skill => 
        staffSkills.includes(skill)
      );
      
      if (!hasRequiredSkills) {
        const missingSkills = rules.requiredSkills.filter(skill => 
          !staffSkills.includes(skill)
        );
        
        return {
          valid: false,
          reason: `Staff member lacks required skills for ${incidentType} incident. Missing: ${missingSkills.join(', ')}. Required: ${rules.requiredSkills.join(', ')}`
        };
      }
    }

    // Special validation for critical incident types
    const criticalIncidentTypes = ['Medical', 'Fire', 'Security', 'Counter-Terror Alert', 'Hostile Act'];
    if (criticalIncidentTypes.includes(incidentType)) {
      const criticalSkills = {
        'Medical': ['medical', 'first_aid', 'emergency'],
        'Fire': ['fire_safety', 'firefighting', 'emergency'],
        'Security': ['security', 'crowd_control', 'conflict_resolution'],
        'Counter-Terror Alert': ['security', 'emergency', 'threat_assessment'],
        'Hostile Act': ['security', 'emergency', 'threat_assessment']
      };
      
      const requiredCriticalSkills = criticalSkills[incidentType as keyof typeof criticalSkills] || [];
      const hasCriticalSkills = requiredCriticalSkills.some(skill => 
        staffSkills.includes(skill)
      );
      
      if (!hasCriticalSkills) {
        return {
          valid: false,
          reason: `Critical incident type '${incidentType}' requires specialized skills. Staff member must have at least one of: ${requiredCriticalSkills.join(', ')}`
        };
      }
    }

    return { valid: true };
  } catch (error) {
    logAssignmentError(
      AssignmentErrorType.VALIDATION_ERROR,
      'Error during assignment rule validation',
      { staffId, incidentType, currentAssignments },
      error
    );
    return {
      valid: false,
      reason: 'Validation error occurred'
    };
  }
}
