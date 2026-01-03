// Predictive Crowd Flow Analysis (Feature 4)
// Analyzes attendance_records to predict future crowd flow and risk

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const STAND_COUNTDOWN_OFFSETS = [0, 10, 20, 30, 40, 50, 60]
const DEFAULT_COUNTDOWN_PERCENTAGES: Record<number, number> = {
  60: 20,
  50: 30,
  40: 45,
  30: 65,
  20: 82,
  10: 92,
  0: 100,
}

export interface CrowdFlowPrediction {
  currentCount: number
  predictedCounts: {
    time: string // ISO timestamp
    minutesAhead: number
    predictedCount: number
    confidence: 'high' | 'medium' | 'low'
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  }[]
  peakPrediction: {
    time: string
    count: number
    confidence: 'high' | 'medium' | 'low'
  } | null
  riskFactors: string[]
  recommendations: string[]
}

export interface StandFlowPrediction {
  standId: string
  standName: string
  currentOccupancy: number
  capacity: number
  predictedOccupancy: {
    time: string
    minutesAhead: number
    predictedOccupancy: number
    percentage: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  }[]
  peakPrediction: {
    time: string
    occupancy: number
    percentage: number
  } | null
}

/**
 * Analyze historical attendance data to predict future flow
 */
export async function predictCrowdFlow(
  supabase: SupabaseClient<Database>,
  eventId: string,
  capacity: number,
  timeWindowMinutes: number = 60
): Promise<CrowdFlowPrediction> {
  try {
    // Get attendance records from the last 2 hours for trend analysis
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    const { data: attendanceRecords, error } = await supabase
      .from('attendance_records')
      .select('count, timestamp')
      .eq('event_id', eventId)
      .gte('timestamp', twoHoursAgo)
      .order('timestamp', { ascending: true })

    const attendanceRecordsList = (attendanceRecords ?? []) as Array<{ count: number; timestamp: string }>

    if (error || attendanceRecordsList.length === 0) {
      // No historical data - return conservative predictions
      const latestRecord = await supabase
        .from('attendance_records')
        .select('count, timestamp')
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()

      const currentCount = (latestRecord.data as { count?: number } | null)?.count ?? 0
      
      return {
        currentCount,
        predictedCounts: generateDefaultPredictions(currentCount, capacity, timeWindowMinutes),
        peakPrediction: null,
        riskFactors: ['Insufficient historical data for accurate prediction'],
        recommendations: ['Monitor attendance closely', 'Prepare for potential capacity issues']
      }
    }

    const currentCount = attendanceRecordsList[attendanceRecordsList.length - 1].count
    const predictions = calculatePredictions(attendanceRecordsList, capacity, timeWindowMinutes)
    const peakPrediction = findPeakPrediction(predictions)
    const riskFactors = analyzeRiskFactors(predictions, capacity)
    const recommendations = generateRecommendations(predictions, capacity, riskFactors)

    return {
      currentCount,
      predictedCounts: predictions,
      peakPrediction,
      riskFactors,
      recommendations
    }
  } catch (error) {
    console.error('Error predicting crowd flow:', error)
    throw error
  }
}

/**
 * Calculate predictions based on historical trend
 */
function calculatePredictions(
  records: Array<{ count: number; timestamp: string }>,
  capacity: number,
  timeWindowMinutes: number
): CrowdFlowPrediction['predictedCounts'] {
  if (records.length < 2) {
    return generateDefaultPredictions(records[0]?.count || 0, capacity, timeWindowMinutes)
  }

  // Calculate average rate of change (people per minute)
  const rates: number[] = []
  for (let i = 1; i < records.length; i++) {
    const timeDiff = (new Date(records[i].timestamp).getTime() - new Date(records[i - 1].timestamp).getTime()) / 60000 // minutes
    const countDiff = records[i].count - records[i - 1].count
    if (timeDiff > 0) {
      rates.push(countDiff / timeDiff)
    }
  }

  const avgRate = rates.length > 0 
    ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length 
    : 0

  // Use weighted average (more recent rates weighted higher)
  const weightedRates = rates.map((rate, index) => rate * (index + 1))
  const weightedAvgRate = weightedRates.length > 0
    ? weightedRates.reduce((sum, rate) => sum + rate, 0) / weightedRates.reduce((sum, _, i) => sum + (i + 1), 0)
    : avgRate

  const currentCount = records[records.length - 1].count
  const predictions: CrowdFlowPrediction['predictedCounts'] = []
  const now = new Date()

  // Generate predictions for next timeWindowMinutes in 10-minute intervals
  for (let minutesAhead = 10; minutesAhead <= timeWindowMinutes; minutesAhead += 10) {
    const predictedTime = new Date(now.getTime() + minutesAhead * 60000)
    
    // Simple linear projection with decay factor (crowd growth slows as capacity approaches)
    const capacityFactor = 1 - (currentCount / capacity) * 0.5 // Decay as capacity fills
    const predictedCount = Math.min(
      capacity * 1.1, // Allow slight over-capacity prediction
      currentCount + (weightedAvgRate * minutesAhead * capacityFactor)
    )

    // Determine confidence based on data quality
    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (records.length >= 10 && rates.length >= 5) {
      confidence = 'high'
    } else if (records.length >= 5 && rates.length >= 2) {
      confidence = 'medium'
    }

    // Determine risk level
    const percentage = (predictedCount / capacity) * 100
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (percentage >= 100) riskLevel = 'critical'
    else if (percentage >= 90) riskLevel = 'high'
    else if (percentage >= 75) riskLevel = 'medium'

    predictions.push({
      time: predictedTime.toISOString(),
      minutesAhead,
      predictedCount: Math.round(predictedCount),
      confidence,
      riskLevel
    })
  }

  return predictions
}

/**
 * Generate default predictions when insufficient data
 */
function generateDefaultPredictions(
  currentCount: number,
  capacity: number,
  timeWindowMinutes: number
): CrowdFlowPrediction['predictedCounts'] {
  const predictions: CrowdFlowPrediction['predictedCounts'] = []
  const now = new Date()
  
  // Conservative estimate: assume slow growth
  const estimatedRate = capacity > 0 ? (capacity - currentCount) / (timeWindowMinutes * 2) : 0

  for (let minutesAhead = 10; minutesAhead <= timeWindowMinutes; minutesAhead += 10) {
    const predictedTime = new Date(now.getTime() + minutesAhead * 60000)
    const predictedCount = Math.min(capacity * 1.05, currentCount + (estimatedRate * minutesAhead))
    const percentage = (predictedCount / capacity) * 100

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (percentage >= 100) riskLevel = 'critical'
    else if (percentage >= 90) riskLevel = 'high'
    else if (percentage >= 75) riskLevel = 'medium'

    predictions.push({
      time: predictedTime.toISOString(),
      minutesAhead,
      predictedCount: Math.round(predictedCount),
      confidence: 'low',
      riskLevel
    })
  }

  return predictions
}

/**
 * Find peak prediction
 */
function findPeakPrediction(
  predictions: CrowdFlowPrediction['predictedCounts']
): CrowdFlowPrediction['peakPrediction'] {
  if (predictions.length === 0) return null

  const peak = predictions.reduce((max, pred) => 
    pred.predictedCount > max.predictedCount ? pred : max
  )

  return {
    time: peak.time,
    count: peak.predictedCount,
    confidence: peak.confidence
  }
}

/**
 * Analyze risk factors
 */
function analyzeRiskFactors(
  predictions: CrowdFlowPrediction['predictedCounts'],
  capacity: number
): string[] {
  const factors: string[] = []

  const criticalPredictions = predictions.filter(p => p.riskLevel === 'critical')
  const highRiskPredictions = predictions.filter(p => p.riskLevel === 'high')

  if (criticalPredictions.length > 0) {
    factors.push(`Predicted to exceed capacity within ${criticalPredictions[0].minutesAhead} minutes`)
  } else if (highRiskPredictions.length > 0) {
    factors.push(`Predicted to reach 90%+ capacity within ${highRiskPredictions[0].minutesAhead} minutes`)
  }

  // Check for rapid growth
  if (predictions.length >= 2) {
    const growthRate = (predictions[predictions.length - 1].predictedCount - predictions[0].predictedCount) / predictions[0].predictedCount
    if (growthRate > 0.2) {
      factors.push('Rapid crowd growth detected')
    }
  }

  // Check if approaching capacity quickly
  const nearCapacity = predictions.filter(p => (p.predictedCount / capacity) >= 0.85)
  if (nearCapacity.length > 0 && nearCapacity[0].minutesAhead < 30) {
    factors.push('Approaching capacity faster than expected')
  }

  return factors
}

/**
 * Generate recommendations based on predictions
 */
function generateRecommendations(
  predictions: CrowdFlowPrediction['predictedCounts'],
  capacity: number,
  riskFactors: string[]
): string[] {
  const recommendations: string[] = []

  const criticalPredictions = predictions.filter(p => p.riskLevel === 'critical')
  const highRiskPredictions = predictions.filter(p => p.riskLevel === 'high')

  if (criticalPredictions.length > 0) {
    recommendations.push('Consider implementing crowd control measures')
    recommendations.push('Prepare overflow areas if available')
    recommendations.push('Alert security and management teams')
  } else if (highRiskPredictions.length > 0) {
    recommendations.push('Monitor entry rates closely')
    recommendations.push('Prepare for potential capacity management')
  }

  // Check growth rate
  if (predictions.length >= 2) {
    const earlyPred = predictions[0]
    const latePred = predictions[predictions.length - 1]
    const growthRate = (latePred.predictedCount - earlyPred.predictedCount) / earlyPred.predictedCount
    
    if (growthRate > 0.15) {
      recommendations.push('Consider increasing entry processing capacity')
    }
  }

  return recommendations
}

/**
 * Predict stand occupancy flow
 */
export async function predictStandFlow(
  supabase: SupabaseClient<Database>,
  eventId: string,
  standId: string,
  standName: string,
  capacity: number,
  timeWindowMinutes: number = 60,
  currentOccupancy?: number,
  companyId?: string,
  kickoffTime?: Date
): Promise<StandFlowPrediction> {
  try {
    const supabaseClient = supabase as SupabaseClient<any>
    // Get stand occupancy history from the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    let current = currentOccupancy ?? 0
    let resolvedStandId = standId
    
    // Try to get current occupancy from database if not provided
    if (currentOccupancy === undefined) {
      // First try to get the stand_id from stand name or use provided standId
      const { data: stand } = await supabaseClient
        .from('stands' as any)
        .select('id')
        .eq('event_id', eventId)
        .or(`id.eq.${standId},name.eq.${standName}`)
        .maybeSingle()

      if (stand) {
        resolvedStandId = stand.id
        // Get occupancy history (if we have timestamped records)
        const { data: occupancyData } = await supabaseClient
          .from('stand_occupancy' as any)
          .select('current_occupancy, recorded_at')
          .eq('event_id', eventId)
          .eq('stand_id', stand.id)
          .maybeSingle()

        current = occupancyData?.current_occupancy || 0
      }
    }

    // For stands, we'll use venue-level attendance trend as proxy
    // (assuming stands fill proportionally to venue)
    const { data: venueRecords } = await supabaseClient
      .from('attendance_records' as any)
      .select('count, timestamp')
      .eq('event_id', eventId)
      .gte('timestamp', twoHoursAgo)
      .order('timestamp', { ascending: true })
      .limit(20)

    let predictedOccupancy: StandFlowPrediction['predictedOccupancy'] = []

    if (companyId && kickoffTime) {
      const historical = await getHistoricalStandPercentages(
        supabaseClient,
        companyId,
        eventId,
        kickoffTime
      )

      if (historical.length > 0) {
        predictedOccupancy = historical.map(({ offset, percentage }) => {
          const targetTime = new Date(kickoffTime.getTime() - offset * 60000)
          const predicted = Math.min(capacity * 1.05, (percentage / 100) * capacity)

          let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
          if (percentage >= 100) riskLevel = 'critical'
          else if (percentage >= 90) riskLevel = 'high'
          else if (percentage >= 75) riskLevel = 'medium'

          return {
            time: targetTime.toISOString(),
            minutesAhead: offset,
            predictedOccupancy: Math.round(predicted),
            percentage: Math.round(percentage),
            riskLevel,
          }
        })
      }
    }

    if (predictedOccupancy.length > 0) {
      return buildStandPredictionResponse(resolvedStandId, standName, current, capacity, predictedOccupancy)
    }

    if (venueRecords && venueRecords.length >= 2) {
      // Calculate venue growth rate
      const venueRates: number[] = []
      for (let i = 1; i < venueRecords.length; i++) {
        const timeDiff = (new Date(venueRecords[i].timestamp).getTime() - new Date(venueRecords[i - 1].timestamp).getTime()) / 60000
        const countDiff = venueRecords[i].count - venueRecords[i - 1].count
        if (timeDiff > 0) {
          venueRates.push(countDiff / timeDiff)
        }
      }

      const avgVenueRate = venueRates.length > 0
        ? venueRates.reduce((sum, rate) => sum + rate, 0) / venueRates.length
        : 0

      // Estimate stand growth as proportional to venue (assuming stand fills at similar rate)
      const standProportion = capacity > 0 ? current / capacity : 0
      const estimatedStandRate = avgVenueRate * (capacity / (venueRecords[venueRecords.length - 1].count || 1))

      const now = new Date()
      for (let minutesAhead = 10; minutesAhead <= timeWindowMinutes; minutesAhead += 10) {
        const predictedTime = new Date(now.getTime() + minutesAhead * 60000)
        const capacityFactor = 1 - standProportion * 0.5
        const predicted = Math.min(capacity * 1.05, current + (estimatedStandRate * minutesAhead * capacityFactor))
        const percentage = (predicted / capacity) * 100

        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
        if (percentage >= 100) riskLevel = 'critical'
        else if (percentage >= 90) riskLevel = 'high'
        else if (percentage >= 75) riskLevel = 'medium'

        predictedOccupancy.push({
          time: predictedTime.toISOString(),
          minutesAhead,
          predictedOccupancy: Math.round(predicted),
          percentage: Math.round(percentage),
          riskLevel
        })
      }
    }

    if (predictedOccupancy.length === 0) {
      predictedOccupancy = buildBehavioralStandCurve(capacity, kickoffTime)
    }

    return buildStandPredictionResponse(resolvedStandId, standName, current, capacity, predictedOccupancy)
  } catch (error) {
    console.error('Error predicting stand flow:', error)
    throw error
  }
}

function buildStandPredictionResponse(
  standId: string,
  standName: string,
  currentOccupancy: number,
  capacity: number,
  predictedOccupancy: StandFlowPrediction['predictedOccupancy']
): StandFlowPrediction {
  const normalized = enforceMonotonicPredictions(predictedOccupancy, capacity)
  const peakPrediction =
    normalized.length > 0
      ? normalized.reduce((max, point) => (point.predictedOccupancy > max.predictedOccupancy ? point : max))
      : null

  return {
    standId,
    standName,
    currentOccupancy,
    capacity,
    predictedOccupancy: normalized,
    peakPrediction: peakPrediction
      ? {
          time: peakPrediction.time,
          occupancy: peakPrediction.predictedOccupancy,
          percentage: peakPrediction.percentage,
        }
      : null,
  }
}

function buildBehavioralStandCurve(capacity: number, kickoffTime?: Date | null) {
  const referenceTime = kickoffTime ?? new Date()
  return STAND_COUNTDOWN_OFFSETS.filter((offset) => offset > 0).map((offset) => {
    const percentage = DEFAULT_COUNTDOWN_PERCENTAGES[offset] ?? 75
    const predicted = Math.round(((percentage / 100) * (capacity || 0)))
    const targetTime = kickoffTime
      ? new Date(kickoffTime.getTime() - offset * 60000)
      : new Date(referenceTime.getTime() + offset * 60000)

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (percentage >= 100) riskLevel = 'critical'
    else if (percentage >= 90) riskLevel = 'high'
    else if (percentage >= 75) riskLevel = 'medium'

    return {
      time: targetTime.toISOString(),
      minutesAhead: offset,
      predictedOccupancy: predicted,
      percentage: Math.min(100, percentage),
      riskLevel,
    }
  })
}

function enforceMonotonicPredictions(
  predictions: StandFlowPrediction['predictedOccupancy'],
  capacity: number
): StandFlowPrediction['predictedOccupancy'] {
  const sortedDesc = [...predictions].sort((a, b) => b.minutesAhead - a.minutesAhead)
  let lastOccupancy = 0
  const adjustedDesc = sortedDesc.map((entry) => {
    const occupancy = Math.max(entry.predictedOccupancy, lastOccupancy)
    const percentage = capacity > 0 ? Math.min(100, (occupancy / capacity) * 100) : 0
    lastOccupancy = occupancy
    return {
      ...entry,
      predictedOccupancy: occupancy,
      percentage,
    }
  })

  return adjustedDesc.sort((a, b) => a.minutesAhead - b.minutesAhead)
}

async function getHistoricalStandPercentages(
  supabase: SupabaseClient<any>,
  companyId: string,
  currentEventId: string,
  kickoffTime: Date
): Promise<Array<{ offset: number; percentage: number }>> {
  const fetchEvents = async (companyFilter?: string | null) => {
    let query = supabase
      .from('events' as any)
      .select('id, company_id, event_type, event_date, start_datetime, main_act_start_time, venue_capacity, expected_attendance')
      .ilike('event_type', '%football%')
      .neq('id', currentEventId)
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4)

    if (companyFilter) {
      query = query.eq('company_id', companyFilter)
    }

    const { data } = await query
    return data ?? []
  }

  let previousEvents = await fetchEvents(companyId)
  if (!previousEvents || previousEvents.length === 0) {
    previousEvents = await fetchEvents(null)
  }

  if (!previousEvents || previousEvents.length === 0) {
    return STAND_COUNTDOWN_OFFSETS.map((offset) => ({
      offset,
      percentage: DEFAULT_COUNTDOWN_PERCENTAGES[offset] ?? 80,
    }))
  }

  const accumulator: Record<number, number[]> = {}

  for (const event of previousEvents) {
    const eventKickoff = deriveKickoffFromEvent(event)
    const capacity = event.venue_capacity || event.expected_attendance || 0
    if (!eventKickoff || !capacity) continue

    const fromTime = new Date(eventKickoff.getTime() - 2 * 60 * 60 * 1000).toISOString()
    const toTime = eventKickoff.toISOString()

    const { data: records } = await supabase
      .from('attendance_records' as any)
      .select('count, timestamp')
      .eq('event_id', event.id)
      .gte('timestamp', fromTime)
      .lte('timestamp', toTime)
      .order('timestamp', { ascending: true })

    if (!records || records.length === 0) continue

    for (const offset of STAND_COUNTDOWN_OFFSETS) {
      const targetTime = new Date(eventKickoff.getTime() - offset * 60000)
      const nearest = records.reduce(
        (closest, record) => {
          const diff = Math.abs(new Date(record.timestamp).getTime() - targetTime.getTime())
          if (diff < closest.diff) {
            return { diff, record }
          }
          return closest
        },
        { diff: Infinity, record: null as { count: number } | null }
      ).record

      if (!nearest) continue

      const percentage = Math.min(100, (nearest.count / capacity) * 100)
      if (!accumulator[offset]) {
        accumulator[offset] = []
      }
      accumulator[offset].push(percentage)
    }
  }

  return STAND_COUNTDOWN_OFFSETS.map((offset) => {
    const samples = accumulator[offset]
    if (!samples || samples.length === 0) return null
    const avg = samples.reduce((sum, value) => sum + value, 0) / samples.length
    return { offset, percentage: avg }
  })
    .filter(Boolean)
    .map((entry) => entry as { offset: number; percentage: number })
    .concat(
      STAND_COUNTDOWN_OFFSETS.filter((offset) => !accumulator[offset] || accumulator[offset].length === 0).map(
        (offset) => ({
          offset,
          percentage: DEFAULT_COUNTDOWN_PERCENTAGES[offset] ?? 80,
        })
      )
    )
    .sort((a, b) => b.offset - a.offset)
}

function deriveKickoffFromEvent(event: {
  start_datetime?: string | null
  event_date?: string | null
  main_act_start_time?: string | null
}): Date | null {
  if (event.start_datetime) {
    return new Date(event.start_datetime)
  }
  if (event.event_date && event.main_act_start_time) {
    const time = event.main_act_start_time.includes(':')
      ? event.main_act_start_time
      : `${event.main_act_start_time}:00`
    const normalized = time.length === 5 ? `${time}:00` : time
    return new Date(`${event.event_date}T${normalized}`)
  }
  return null
}
