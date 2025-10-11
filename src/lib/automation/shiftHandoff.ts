/**
 * Shift Handoff Automation
 * Generates automated end-of-shift reports and briefings
 */

import { emailService } from '@/lib/notifications/emailService'
import * as summaryGenerator from '@/lib/ai/summaryGenerator'

export interface ShiftHandoffReport {
  shiftId: string
  shiftName: string
  date: string
  startTime: string
  endTime: string
  duration: number // hours
  officer: {
    name: string
    callsign: string
    email?: string
  }
  incidents: {
    total: number
    open: number
    closed: number
    byType: Record<string, number>
    byPriority: Record<string, number>
    keyIncidents: any[]
  }
  staff: {
    onDuty: number
    totalLogs: number
    mostActiveOperators: Array<{ callsign: string; logCount: number }>
  }
  performance: {
    averageResponseTime: number
    averageResolutionTime: number
    qualityScore: number
    complianceRate: number
  }
  notes: string
  recommendations: string[]
  nextShiftActions: string[]
  aiSummary?: string
}

export interface ShiftHandoffOptions {
  eventId: string
  shiftStart: Date
  shiftEnd: Date
  officerCallsign: string
  includeAISummary?: boolean
  autoSend?: boolean
  recipients?: string[]
}

export class ShiftHandoffAutomation {
  /**
   * Generate shift handoff report
   */
  async generateReport(options: ShiftHandoffOptions): Promise<ShiftHandoffReport> {
    const {
      eventId,
      shiftStart,
      shiftEnd,
      officerCallsign,
      includeAISummary = true
    } = options

    try {
      // Fetch shift data from Supabase
      const supabase = (await import('@/lib/supabase')).supabase

      // Get incidents during shift
      const { data: incidents, error: incidentsError } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', eventId)
        .gte('timestamp', shiftStart.toISOString())
        .lte('timestamp', shiftEnd.toISOString())
        .order('timestamp', { ascending: false })

      if (incidentsError) throw incidentsError

      // Get staff activity
      const { data: staffLogs, error: staffError } = await supabase
        .from('incident_logs')
        .select('logged_by_callsign')
        .eq('event_id', eventId)
        .gte('timestamp', shiftStart.toISOString())
        .lte('timestamp', shiftEnd.toISOString())

      if (staffError) throw staffError

      // Calculate metrics
      const totalIncidents = incidents?.length || 0
      const openIncidents = incidents?.filter(inc => !inc.is_closed).length || 0
      const closedIncidents = totalIncidents - openIncidents

      // Incidents by type
      const byType: Record<string, number> = {}
      incidents?.forEach(inc => {
        byType[inc.incident_type] = (byType[inc.incident_type] || 0) + 1
      })

      // Incidents by priority
      const byPriority: Record<string, number> = {}
      incidents?.forEach(inc => {
        byPriority[inc.priority] = (byPriority[inc.priority] || 0) + 1
      })

      // Key incidents (high priority or still open)
      const keyIncidents = incidents?.filter(inc => 
        inc.priority === 'high' || inc.priority === 'critical' || !inc.is_closed
      ).slice(0, 10) || []

      // Staff metrics
      const staffCallsigns = new Set(staffLogs?.map(log => log.logged_by_callsign))
      const operatorActivity = Array.from(staffCallsigns).map(callsign => ({
        callsign,
        logCount: staffLogs?.filter(log => log.logged_by_callsign === callsign).length || 0
      })).sort((a, b) => b.logCount - a.logCount)

      // Performance metrics
      const responseTimes = incidents?.map(inc => {
        if (inc.responded_at && inc.timestamp) {
          return (new Date(inc.responded_at).getTime() - new Date(inc.timestamp).getTime()) / (1000 * 60)
        }
        return null
      }).filter(Boolean) || []

      const resolutionTimes = incidents?.map(inc => {
        if (inc.resolved_at && inc.timestamp) {
          return (new Date(inc.resolved_at).getTime() - new Date(inc.timestamp).getTime()) / (1000 * 60)
        }
        return null
      }).filter(Boolean) || []

      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.filter(time => time !== null && time !== undefined).reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0

      const averageResolutionTime = resolutionTimes.length > 0
        ? resolutionTimes.filter(time => time !== null && time !== undefined).reduce((sum, time) => sum + time, 0) / resolutionTimes.length
        : 0

      // Quality metrics
      const qualityScores = incidents?.map(inc => {
        let score = 50
        if (inc.entry_type === 'contemporaneous') score += 20
        if (!inc.is_amended) score += 15
        if (inc.headline && inc.source && inc.facts_observed) score += 15
        return Math.min(100, score)
      }) || []

      const qualityScore = qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 0

      const complianceRate = incidents?.filter(inc => 
        inc.entry_type === 'contemporaneous'
      ).length / Math.max(1, totalIncidents) * 100 || 0

      // Generate AI summary if enabled
      let aiSummary: string | undefined
      if (includeAISummary && incidents && incidents.length > 0) {
        try {
          const staffActivity = operatorActivity.map(op => ({
            userId: op.callsign,
            callsign: op.callsign,
            logCount: op.logCount,
            retrospectiveRate: 0,
            amendmentRate: 0
          }))

          const summary = summaryGenerator.generateAISummary({
            eventName: 'Shift Event',
            incidents: incidents.map(inc => ({
              ...inc,
              logged_by_callsign: inc.logged_by_callsign || 'Unknown'
            })),
            staffActivity,
            startDate: shiftStart,
            endDate: shiftEnd
          })

          aiSummary = summary.executiveSummary
        } catch (error) {
          console.error('AI summary generation error:', error)
        }
      }

      // Generate recommendations
      const recommendations: string[] = []
      if (openIncidents > 0) {
        recommendations.push(`${openIncidents} incident(s) remain open - ensure next shift is briefed`)
      }
      if (byPriority['high'] > 5) {
        recommendations.push('High incident volume - consider increased staffing for next shift')
      }
      if (averageResponseTime > 10) {
        recommendations.push('Response times above target - review staff allocation')
      }
      if (qualityScore < 75) {
        recommendations.push('Log quality below standard - provide refresher training')
      }

      // Next shift actions
      const nextShiftActions: string[] = []
      keyIncidents.forEach(inc => {
        if (!inc.is_closed) {
          nextShiftActions.push(`Follow up on ${inc.incident_type} incident (${inc.log_number})`)
        }
      })

      const report: ShiftHandoffReport = {
        shiftId: `shift_${Date.now()}`,
        shiftName: this.getShiftName(shiftStart),
        date: shiftStart.toLocaleDateString(),
        startTime: shiftStart.toLocaleTimeString(),
        endTime: shiftEnd.toLocaleTimeString(),
        duration: (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60),
        officer: {
          name: officerCallsign,
          callsign: officerCallsign
        },
        incidents: {
          total: totalIncidents,
          open: openIncidents,
          closed: closedIncidents,
          byType,
          byPriority,
          keyIncidents
        },
        staff: {
          onDuty: staffCallsigns.size,
          totalLogs: staffLogs?.length || 0,
          mostActiveOperators: operatorActivity.slice(0, 5)
        },
        performance: {
          averageResponseTime,
          averageResolutionTime,
          qualityScore,
          complianceRate
        },
        notes: '',
        recommendations,
        nextShiftActions,
        aiSummary
      }

      return report

    } catch (error) {
      console.error('Error generating shift handoff report:', error)
      throw error
    }
  }

  /**
   * Send shift handoff report
   */
  async sendReport(report: ShiftHandoffReport, recipients: string[]): Promise<boolean> {
    try {
      return await emailService.sendShiftHandoffReport(report, recipients)
    } catch (error) {
      console.error('Error sending shift handoff report:', error)
      throw error
    }
  }

  /**
   * Schedule automatic shift handoff
   */
  scheduleAutomatedHandoff(options: {
    eventId: string
    shiftTimes: Date[]
    recipients: string[]
    includeAISummary?: boolean
  }): void {
    const { eventId, shiftTimes, recipients, includeAISummary = true } = options

    shiftTimes.forEach(shiftEnd => {
      const now = new Date()
      const timeUntilShift = shiftEnd.getTime() - now.getTime()

      if (timeUntilShift > 0) {
        setTimeout(async () => {
          // Calculate shift start (8 hours before end)
          const shiftStart = new Date(shiftEnd.getTime() - 8 * 60 * 60 * 1000)

          const report = await this.generateReport({
            eventId,
            shiftStart,
            shiftEnd,
            officerCallsign: 'System',
            includeAISummary,
            autoSend: true,
            recipients
          })

          await this.sendReport(report, recipients)
          
          console.log(`Automated shift handoff sent for ${shiftEnd.toLocaleString()}`)
        }, timeUntilShift)

        console.log(`Scheduled shift handoff for ${shiftEnd.toLocaleString()}`)
      }
    })
  }

  /**
   * Get shift name from time
   */
  private getShiftName(date: Date): string {
    const hour = date.getHours()
    
    if (hour >= 6 && hour < 14) return 'Morning Shift'
    if (hour >= 14 && hour < 22) return 'Evening Shift'
    return 'Night Shift'
  }
}

// Export singleton instance
export const shiftHandoffAutomation = new ShiftHandoffAutomation()
