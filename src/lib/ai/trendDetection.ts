/**
 * AI-Powered Trend Detection Engine
 * Analyzes incident patterns and provides intelligent insights
 */

export interface TrendData {
  period: string
  value: number
  timestamp: string
}

export interface TrendAnalysis {
  type: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  magnitude: 'low' | 'medium' | 'high'
  confidence: number // 0-100
  description: string
  recommendation: string
  dataPoints: TrendData[]
  trendLine: { x: number; y: number }[]
}

export interface AnomalyDetection {
  type: 'spike' | 'drop' | 'pattern_break' | 'unusual_time'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  timestamp: string
  value: number
  expectedValue: number
  deviation: number
  recommendation: string
}

export interface PredictiveForecast {
  metric: string
  currentValue: number
  predictedValue: number
  confidence: number
  timeframe: string
  factors: string[]
  recommendation: string
}

/**
 * Detect trends in incident data over time
 */
export function detectTrends(
  data: TrendData[],
  metric: string = 'incident_count'
): TrendAnalysis {
  if (data.length < 3) {
    return {
      type: 'stable',
      magnitude: 'low',
      confidence: 0,
      description: 'Insufficient data for trend analysis',
      recommendation: 'Collect more data points for accurate analysis',
      dataPoints: data,
      trendLine: []
    }
  }

  // Calculate trend using linear regression
  const n = data.length
  const x = data.map((_, index) => index)
  const y = data.map(d => d.value)

  // Linear regression calculation
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate R-squared for confidence
  const yMean = sumY / n
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0)
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
  const rSquared = 1 - (ssRes / ssTot)
  const confidence = Math.max(0, Math.min(100, rSquared * 100))

  // Determine trend type and magnitude
  const slopePercent = (slope / yMean) * 100
  let type: TrendAnalysis['type']
  let magnitude: TrendAnalysis['magnitude']

  if (Math.abs(slopePercent) < 5) {
    type = 'stable'
    magnitude = 'low'
  } else if (Math.abs(slopePercent) < 15) {
    type = slopePercent > 0 ? 'increasing' : 'decreasing'
    magnitude = 'low'
  } else if (Math.abs(slopePercent) < 30) {
    type = slopePercent > 0 ? 'increasing' : 'decreasing'
    magnitude = 'medium'
  } else {
    type = slopePercent > 0 ? 'increasing' : 'decreasing'
    magnitude = 'high'
  }

  // Check for volatility (high variance)
  const variance = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0) / n
  const coefficientOfVariation = Math.sqrt(variance) / yMean
  if (coefficientOfVariation > 0.3) {
    type = 'volatile'
  }

  // Generate trend line for visualization
  const trendLine = x.map((xi, i) => ({
    x: i,
    y: slope * xi + intercept
  }))

  // Generate descriptions and recommendations
  const description = generateTrendDescription(type, magnitude, metric, slopePercent)
  const recommendation = generateTrendRecommendation(type, magnitude, metric, confidence)

  return {
    type,
    magnitude,
    confidence,
    description,
    recommendation,
    dataPoints: data,
    trendLine
  }
}

/**
 * Detect anomalies in incident data
 */
export function detectAnomalies(
  data: TrendData[],
  metric: string = 'incident_count'
): AnomalyDetection[] {
  if (data.length < 7) return []

  const anomalies: AnomalyDetection[] = []
  const values = data.map(d => d.value)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  // Detect spikes and drops (3+ standard deviations)
  data.forEach((point, index) => {
    const deviation = Math.abs(point.value - mean)
    const zScore = deviation / stdDev

    if (zScore > 3) {
      const isSpike = point.value > mean
      const severity = zScore > 4 ? 'critical' : zScore > 3.5 ? 'high' : 'medium'
      
      anomalies.push({
        type: isSpike ? 'spike' : 'drop',
        severity,
        description: `${isSpike ? 'Unusual spike' : 'Unusual drop'} in ${metric}: ${point.value} (expected ~${mean.toFixed(1)})`,
        timestamp: point.timestamp,
        value: point.value,
        expectedValue: mean,
        deviation: deviation / mean * 100,
        recommendation: generateAnomalyRecommendation(isSpike ? 'spike' : 'drop', severity, metric)
      })
    }
  })

  // Detect pattern breaks (sudden changes in trend)
  if (data.length >= 14) {
    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))
    
    const firstMean = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length
    const secondMean = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length
    
    const changePercent = Math.abs(secondMean - firstMean) / firstMean * 100
    
    if (changePercent > 50) {
      anomalies.push({
        type: 'pattern_break',
        severity: changePercent > 100 ? 'high' : 'medium',
        description: `Pattern break detected: ${metric} changed by ${changePercent.toFixed(1)}% between periods`,
        timestamp: secondHalf[0].timestamp,
        value: secondMean,
        expectedValue: firstMean,
        deviation: changePercent,
        recommendation: 'Review operational changes or external factors that may have caused this shift'
      })
    }
  }

  // Detect unusual timing (incidents at unexpected hours)
  const hourlyData = groupByHour(data)
  const normalHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
  
  Object.entries(hourlyData).forEach(([hour, incidents]) => {
    const hourNum = parseInt(hour)
    if (!normalHours.includes(hourNum) && incidents.length > 0) {
      anomalies.push({
        type: 'unusual_time',
        severity: 'medium',
        description: `Unusual activity at ${hourNum}:00 - ${incidents.length} incidents`,
        timestamp: incidents[0].timestamp,
        value: incidents.length,
        expectedValue: 0,
        deviation: 100,
        recommendation: 'Consider if overnight security or early morning setup requires additional monitoring'
      })
    }
  })

  return anomalies.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}

/**
 * Generate predictive forecasts based on historical data
 */
export function generateForecast(
  data: TrendData[],
  metric: string = 'incident_count',
  timeframe: string = 'next 4 hours'
): PredictiveForecast {
  if (data.length < 5) {
    return {
      metric,
      currentValue: data[data.length - 1]?.value || 0,
      predictedValue: 0,
      confidence: 0,
      timeframe,
      factors: ['Insufficient historical data'],
      recommendation: 'Collect more data for accurate forecasting'
    }
  }

  // Simple linear extrapolation
  const recentData = data.slice(-5) // Use last 5 data points
  const trend = detectTrends(recentData, metric)
  
  const currentValue = data[data.length - 1].value
  const timeSteps = timeframe.includes('hour') ? 4 : timeframe.includes('day') ? 1 : 2
  
  // Predict based on trend slope
  const predictedValue = Math.max(0, currentValue + (trend.trendLine[1]?.y - trend.trendLine[0]?.y || 0) * timeSteps)
  
  // Calculate confidence based on trend stability
  const confidence = Math.max(20, Math.min(90, trend.confidence * 0.8))
  
  // Identify contributing factors
  const factors = []
  if (trend.type === 'increasing') factors.push('Upward trend in recent data')
  if (trend.type === 'decreasing') factors.push('Downward trend in recent data')
  if (trend.magnitude === 'high') factors.push('Strong trend momentum')
  if (trend.confidence > 70) factors.push('High data consistency')
  
  // Generate recommendation
  const recommendation = generateForecastRecommendation(metric, predictedValue, currentValue, confidence)

  return {
    metric,
    currentValue,
    predictedValue,
    confidence,
    timeframe,
    factors,
    recommendation
  }
}

// Helper functions

function generateTrendDescription(
  type: TrendAnalysis['type'],
  magnitude: TrendAnalysis['magnitude'],
  metric: string,
  slopePercent: number
): string {
  const metricNames: Record<string, string> = {
    'incident_count': 'incident volume',
    'response_time': 'response times',
    'quality_score': 'log quality scores',
    'compliance_rate': 'compliance rates'
  }

  const metricName = metricNames[metric] || metric
  const magnitudeText = magnitude === 'high' ? 'significantly' : magnitude === 'medium' ? 'moderately' : 'slightly'
  
  switch (type) {
    case 'increasing':
      return `${metricName.charAt(0).toUpperCase() + metricName.slice(1)} are ${magnitudeText} increasing (${slopePercent.toFixed(1)}% per period)`
    case 'decreasing':
      return `${metricName.charAt(0).toUpperCase() + metricName.slice(1)} are ${magnitudeText} decreasing (${Math.abs(slopePercent).toFixed(1)}% per period)`
    case 'volatile':
      return `${metricName.charAt(0).toUpperCase() + metricName.slice(1)} show high volatility with unpredictable patterns`
    default:
      return `${metricName.charAt(0).toUpperCase() + metricName.slice(1)} remain relatively stable`
  }
}

function generateTrendRecommendation(
  type: TrendAnalysis['type'],
  magnitude: TrendAnalysis['magnitude'],
  metric: string,
  confidence: number
): string {
  if (confidence < 50) {
    return 'Low confidence in trend - collect more data before making operational changes'
  }

  switch (type) {
    case 'increasing':
      if (metric === 'incident_count') {
        return magnitude === 'high' 
          ? 'Consider deploying additional staff and reviewing operational procedures'
          : 'Monitor closely and prepare for potential resource scaling'
      }
      if (metric === 'response_time') {
        return 'Review staff allocation and consider additional training or resources'
      }
      return 'Investigate root causes and implement corrective measures'
      
    case 'decreasing':
      return 'Positive trend - consider documenting successful practices for replication'
      
    case 'volatile':
      return 'High volatility suggests need for more flexible resource allocation and contingency planning'
      
    default:
      return 'Stable patterns allow for consistent resource planning'
  }
}

function generateAnomalyRecommendation(
  type: 'spike' | 'drop',
  severity: AnomalyDetection['severity'],
  metric: string
): string {
  if (type === 'spike') {
    switch (severity) {
      case 'critical':
        return 'Immediate investigation required - consider emergency protocols'
      case 'high':
        return 'Investigate immediately and consider additional resources'
      default:
        return 'Monitor closely and investigate potential causes'
    }
  } else {
    return 'Verify data accuracy and investigate if this represents a genuine improvement'
  }
}

function generateForecastRecommendation(
  metric: string,
  predictedValue: number,
  currentValue: number,
  confidence: number
): string {
  const change = predictedValue - currentValue
  const changePercent = (change / currentValue) * 100

  if (confidence < 60) {
    return 'Low forecast confidence - use as general guidance only'
  }

  if (metric === 'incident_count') {
    if (change > currentValue * 0.2) {
      return 'Prepare for increased incident volume - consider additional staff deployment'
    } else if (change < -currentValue * 0.2) {
      return 'Expected decrease in incidents - may allow for resource reallocation'
    }
  }

  return `Expected ${Math.abs(changePercent).toFixed(1)}% change - monitor and adjust resources accordingly`
}

function groupByHour(data: TrendData[]): Record<string, TrendData[]> {
  const grouped: Record<string, TrendData[]> = {}
  
  data.forEach(point => {
    const hour = new Date(point.timestamp).getHours()
    if (!grouped[hour]) grouped[hour] = []
    grouped[hour].push(point)
  })
  
  return grouped
}
