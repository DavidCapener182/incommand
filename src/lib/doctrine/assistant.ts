/**
 * Doctrine Assistant Engine
 * Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine
 * 
 * Monitors operational conditions and suggests SOP adjustments
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type {
  ConditionMonitor,
  SOPSuggestion,
  DoctrineAssistantState,
  SOP,
  SOPAdjustmentCreateInput,
} from '@/types/sops'

export class DoctrineAssistant {
  private eventId: string
  private companyId: string
  private supabase: SupabaseClient<Database>

  constructor(
    eventId: string,
    companyId: string,
    supabaseClient: SupabaseClient<Database>
  ) {
    this.eventId = eventId
    this.companyId = companyId
    this.supabase = supabaseClient
  }

  /**
   * Get current doctrine assistant state
   */
  async getState(): Promise<DoctrineAssistantState> {
    const [activeSops, pendingAdjustments, monitoredConditions, suggestions] =
      await Promise.all([
        this.getActiveSOPs(),
        this.getPendingAdjustments(),
        this.monitorConditions(),
        this.generateSuggestions(),
      ])

    return {
      active_sops: activeSops,
      pending_adjustments: pendingAdjustments,
      suggestions,
      monitored_conditions: monitoredConditions,
      last_updated: new Date().toISOString(),
    }
  }

  /**
   * Get active SOPs for the event
   */
  private async getActiveSOPs(): Promise<SOP[]> {
    try {
      const { data: sops, error } = await this.supabase
        .from('sops')
        .select('*')
        .eq('event_id', this.eventId)
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        // If table doesn't exist, return empty array
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          return []
        }
        console.error('Error fetching active SOPs:', error)
        return []
      }

      return (sops as SOP[]) || []
    } catch (error: any) {
      // If table doesn't exist, return empty array
      if (error?.message?.includes('does not exist') || error?.code === '42P01') {
        return []
      }
      console.error('Error in getActiveSOPs:', error)
      return []
    }
  }

  /**
   * Get pending adjustments for active SOPs
   */
  private async getPendingAdjustments() {
    try {
      const { data: sops, error: sopsError } = await this.supabase
        .from('sops')
        .select('id')
        .eq('event_id', this.eventId)
        .eq('status', 'active')

      // If sops table doesn't exist, return empty array
      if (sopsError) {
        if (sopsError.message?.includes('does not exist') || sopsError.code === '42P01') {
          return []
        }
      }

      if (!sops || sops.length === 0) return []

      const sopIds = sops.map((s) => s.id)

      const { data: adjustments, error } = await this.supabase
        .from('sop_adjustments')
        .select('*')
        .in('sop_id', sopIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        // If table doesn't exist, return empty array
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          return []
        }
        console.error('Error fetching pending adjustments:', error)
        return []
      }

      return adjustments || []
    } catch (error: any) {
      // If table doesn't exist, return empty array
      if (error?.message?.includes('does not exist') || error?.code === '42P01') {
        return []
      }
      console.error('Error in getPendingAdjustments:', error)
      return []
    }
  }

  /**
   * Monitor operational conditions
   */
  private async monitorConditions(): Promise<ConditionMonitor[]> {
    const conditions: ConditionMonitor[] = []

    try {
      // Monitor incident pressure
      const { data: openIncidents } = await this.supabase
        .from('incident_logs')
        .select('id, priority')
        .eq('event_id', this.eventId)
        .eq('is_closed', false)

      const highPriorityCount =
        openIncidents?.filter(
          (inc: any) =>
            (inc.priority || '').toLowerCase() === 'urgent' ||
            (inc.priority || '').toLowerCase() === 'high'
        ).length || 0

      conditions.push({
        type: 'incident_pressure',
        current_value: openIncidents?.length || 0,
        threshold: 5,
        status:
          highPriorityCount > 3
            ? 'critical'
            : (openIncidents?.length || 0) > 5
              ? 'warning'
              : 'normal',
        last_checked: new Date().toISOString(),
      })

      // Monitor crowd density
      const { data: event } = await this.supabase
        .from('events')
        .select('venue_capacity, expected_attendance')
        .eq('id', this.eventId)
        .single()

      if (event) {
        const capacity = event.venue_capacity || event.expected_attendance || 10000

        const { data: attendanceLogs } = await this.supabase
          .from('attendance_logs')
          .select('current_count')
          .eq('event_id', this.eventId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        const currentCount = attendanceLogs?.current_count || 0
        const occupancyRatio = capacity > 0 ? currentCount / capacity : 0

        conditions.push({
          type: 'crowd_density',
          current_value: Math.round(occupancyRatio * 100),
          threshold: 90,
          status:
            occupancyRatio > 0.95
              ? 'critical'
              : occupancyRatio > 0.85
                ? 'warning'
                : 'normal',
          last_checked: new Date().toISOString(),
        })
      }

      // Monitor staffing (simplified - can be enhanced)
      const { data: assignments } = await this.supabase
        .from('callsign_assignments')
        .select('id')
        .eq('event_id', this.eventId)

      conditions.push({
        type: 'staffing',
        current_value: assignments?.length || 0,
        threshold: 10, // Minimum expected staff
        status:
          (assignments?.length || 0) < 5
            ? 'critical'
            : (assignments?.length || 0) < 10
              ? 'warning'
              : 'normal',
        last_checked: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error monitoring conditions:', error)
    }

    return conditions
  }

  /**
   * Generate SOP suggestions based on current conditions
   */
  private async generateSuggestions(): Promise<SOPSuggestion[]> {
    const suggestions: SOPSuggestion[] = []

    try {
      const conditions = await this.monitorConditions()
      const activeSops = await this.getActiveSOPs()

      // Check for critical conditions that might need SOP adjustments
      const criticalConditions = conditions.filter((c) => c.status === 'critical')
      const warningConditions = conditions.filter((c) => c.status === 'warning')

      // High incident pressure suggestion
      const incidentCondition = conditions.find((c) => c.type === 'incident_pressure')
      if (
        incidentCondition &&
        (incidentCondition.status === 'critical' || incidentCondition.status === 'warning')
      ) {
        const relevantSop = activeSops.find(
          (sop) =>
            sop.sop_type === 'incident_response' ||
            sop.sop_type === 'emergency_protocol' ||
            sop.title.toLowerCase().includes('incident')
        )

        if (relevantSop) {
          suggestions.push({
            sop_id: relevantSop.id,
            sop_title: relevantSop.title,
            reason: `High incident pressure detected (${incidentCondition.current_value} open incidents). Consider activating additional response protocols.`,
            urgency: incidentCondition.status === 'critical' ? 'high' : 'medium',
            triggered_conditions: ['incident_pressure'],
            suggested_adjustment: {
              sop_id: relevantSop.id,
              adjustment_type: 'suggested',
              reason: `High incident pressure (${incidentCondition.current_value} open incidents)`,
              suggested_by: 'system',
              changes: {
                conditions: {
                  ...relevantSop.conditions,
                  incident_threshold: incidentCondition.current_value,
                },
                actions: [
                  ...(relevantSop.actions || []),
                  {
                    step: (relevantSop.actions || []).length + 1,
                    action: 'Activate additional response teams',
                    description: 'Deploy backup teams to manage increased incident load',
                    responsible_role: 'Operations Manager',
                  },
                ],
              },
            },
          })
        }
      }

      // Crowd density suggestion
      const crowdCondition = conditions.find((c) => c.type === 'crowd_density')
      if (
        crowdCondition &&
        (crowdCondition.status === 'critical' || crowdCondition.status === 'warning')
      ) {
        const relevantSop = activeSops.find(
          (sop) =>
            sop.sop_type === 'crowd_management' ||
            sop.title.toLowerCase().includes('crowd') ||
            sop.title.toLowerCase().includes('capacity')
        )

        if (relevantSop) {
          suggestions.push({
            sop_id: relevantSop.id,
            sop_title: relevantSop.title,
            reason: `Venue approaching capacity (${crowdCondition.current_value}% occupied). Consider implementing crowd control measures.`,
            urgency: crowdCondition.status === 'critical' ? 'high' : 'medium',
            triggered_conditions: ['crowd_density'],
            suggested_adjustment: {
              sop_id: relevantSop.id,
              adjustment_type: 'suggested',
              reason: `High occupancy (${crowdCondition.current_value}%)`,
              suggested_by: 'system',
              changes: {
                conditions: {
                  ...relevantSop.conditions,
                  occupancy_threshold: crowdCondition.current_value,
                },
                actions: [
                  ...(relevantSop.actions || []),
                  {
                    step: (relevantSop.actions || []).length + 1,
                    action: 'Implement capacity management',
                    description: 'Activate crowd control measures and consider ingress restrictions',
                    responsible_role: 'Crowd Manager',
                  },
                ],
              },
            },
          })
        }
      }

      // Staffing suggestion
      const staffingCondition = conditions.find((c) => c.type === 'staffing')
      if (
        staffingCondition &&
        (staffingCondition.status === 'critical' || staffingCondition.status === 'warning')
      ) {
        const relevantSop = activeSops.find(
          (sop) =>
            sop.sop_type === 'staffing' ||
            sop.title.toLowerCase().includes('staff') ||
            sop.title.toLowerCase().includes('deployment')
        )

        if (relevantSop) {
          suggestions.push({
            sop_id: relevantSop.id,
            sop_title: relevantSop.title,
            reason: `Low staffing levels (${staffingCondition.current_value} on post). Consider redeployment or calling in additional staff.`,
            urgency: staffingCondition.status === 'critical' ? 'high' : 'medium',
            triggered_conditions: ['staffing'],
            suggested_adjustment: {
              sop_id: relevantSop.id,
              adjustment_type: 'suggested',
              reason: `Low staffing (${staffingCondition.current_value} on post)`,
              suggested_by: 'system',
              changes: {
                conditions: {
                  ...relevantSop.conditions,
                  minimum_staff: staffingCondition.current_value,
                },
                actions: [
                  ...(relevantSop.actions || []),
                  {
                    step: (relevantSop.actions || []).length + 1,
                    action: 'Review staffing levels',
                    description: 'Assess need for additional staff deployment',
                    responsible_role: 'Staffing Manager',
                  },
                ],
              },
            },
          })
        }
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
    }

    return suggestions
  }

  /**
   * Create an adjustment suggestion
   */
  async createSuggestion(suggestion: SOPSuggestion): Promise<void> {
    if (!suggestion.suggested_adjustment) return

    try {
      await this.supabase.from('sop_adjustments').insert({
        sop_id: suggestion.suggested_adjustment.sop_id,
        adjustment_type: suggestion.suggested_adjustment.adjustment_type,
        reason: suggestion.suggested_adjustment.reason,
        suggested_by: suggestion.suggested_adjustment.suggested_by || 'system',
        changes: suggestion.suggested_adjustment.changes,
      })
    } catch (error) {
      console.error('Error creating suggestion:', error)
    }
  }
}

