// Predictive Crowd Flow Analysis (Feature 4)
// Analyzes attendance_records to predict future crowd flow and risk

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

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

    if (error || !attendanceRecords || attendanceRecords.length === 0) {
      // No historical data - return conservative predictions
      const latestRecord = await supabase
        .from('attendance_records')
        .select('count, timestamp')
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()

      const currentCount = latestRecord.data?.count || 0
      
      return {
        currentCount,
        predictedCounts: generateDefaultPredictions(currentCount, capacity, timeWindowMinutes),
        peakPrediction: null,
        riskFactors: ['Insufficient historical data for accurate prediction'],
        recommendations: ['Monitor attendance closely', 'Prepare for potential capacity issues']
      }
    }

    const currentCount = attendanceRecords[attendanceRecords.length - 1].count
    const predictions = calculatePredictions(attendanceRecords, capacity, timeWindowMinutes)
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
  currentOccupancy?: number // Allow passing current occupancy directly
): Promise<StandFlowPrediction> {
  try {
    // Get stand occupancy history from the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    let current = currentOccupancy ?? 0
    
    // Try to get current occupancy from database if not provided
    if (currentOccupancy === undefined) {
      // First try to get the stand_id from stand name or use provided standId
      const { data: stand } = await supabase
        .from('stands')
        .select('id')
        .eq('event_id', eventId)
        .or(`id.eq.${standId},name.eq.${standName}`)
        .maybeSingle()

      if (stand) {
        // Get occupancy history (if we have timestamped records)
        const { data: occupancyData } = await supabase
          .from('stand_occupancy')
          .select('current_occupancy, recorded_at')
          .eq('event_id', eventId)
          .eq('stand_id', stand.id)
          .maybeSingle()

        current = occupancyData?.current_occupancy || 0
      }
    }

    // For stands, we'll use venue-level attendance trend as proxy
    // (assuming stands fill proportionally to venue)
    const { data: venueRecords } = await supabase
      .from('attendance_records')
      .select('count, timestamp')
      .eq('event_id', eventId)
      .gte('timestamp', twoHoursAgo)
      .order('timestamp', { ascending: true })
      .limit(20)

    let predictedOccupancy: StandFlowPrediction['predictedOccupancy'] = []

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
    } else {
      // Default predictions
      const now = new Date()
      const estimatedRate = capacity > 0 ? (capacity - current) / (timeWindowMinutes * 2) : 0
      
      for (let minutesAhead = 10; minutesAhead <= timeWindowMinutes; minutesAhead += 10) {
        const predictedTime = new Date(now.getTime() + minutesAhead * 60000)
        const predicted = Math.min(capacity * 1.05, current + (estimatedRate * minutesAhead))
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

    // Find peak
    const peak = predictedOccupancy.length > 0
      ? predictedOccupancy.reduce((max, pred) => 
          pred.predictedOccupancy > max.predictedOccupancy ? pred : max
        )
      : null

    return {
      standId: stand.id,
      standName,
      currentOccupancy: current,
      capacity,
      predictedOccupancy,
      peakPrediction: peak ? {
        time: peak.time,
        occupancy: peak.predictedOccupancy,
        percentage: peak.percentage
      } : null
    }
  } catch (error) {
    console.error('Error predicting stand flow:', error)
    throw error
  }
}

