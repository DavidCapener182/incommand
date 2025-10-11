/**
 * Predictive Analytics Engine
 * AI-powered trend detection and incident prediction
 */

interface TimeSeriesData {
  timestamp: number
  value: number
}

interface Prediction {
  predictedValue: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
  anomaly: boolean
}

interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable'
  strength: number // 0-1
  velocity: number // Rate of change
  acceleration: number // Change in rate
  seasonality: boolean
}

interface Forecast {
  timestamp: number
  value: number
  confidence: number
  upperBound: number
  lowerBound: number
}

class PredictiveAnalytics {
  /**
   * Predict next value in time series
   */
  predictNext(data: TimeSeriesData[], horizon: number = 1): Prediction[] {
    if (data.length < 3) {
      return []
    }

    const predictions: Prediction[] = []
    
    // Simple linear regression for predictions
    const { slope, intercept } = this.linearRegression(data)
    
    // Calculate standard deviation for confidence
    const stdDev = this.calculateStdDev(data, slope, intercept)
    
    const lastTimestamp = data[data.length - 1].timestamp
    const timeInterval = this.calculateAverageInterval(data)

    for (let i = 1; i <= horizon; i++) {
      const nextTimestamp = lastTimestamp + (timeInterval * i)
      const predictedValue = slope * (data.length + i - 1) + intercept
      
      // Calculate confidence (decreases with distance)
      const confidence = Math.max(0.5, 0.95 - (i * 0.1))
      
      // Detect trend
      const trend = slope > 0.5 ? 'increasing' : slope < -0.5 ? 'decreasing' : 'stable'
      
      // Simple anomaly detection
      const anomaly = Math.abs(predictedValue - this.calculateMean(data)) > (2 * stdDev)

      predictions.push({
        predictedValue: Math.max(0, predictedValue),
        confidence,
        trend,
        anomaly
      })
    }

    return predictions
  }

  /**
   * Analyze trend in data
   */
  analyzeTrend(data: TimeSeriesData[]): TrendAnalysis {
    if (data.length < 3) {
      return {
        direction: 'stable',
        strength: 0,
        velocity: 0,
        acceleration: 0,
        seasonality: false
      }
    }

    const { slope } = this.linearRegression(data)
    const velocity = slope
    
    // Calculate acceleration (change in slope over time)
    const midPoint = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, midPoint)
    const secondHalf = data.slice(midPoint)
    
    const firstSlope = this.linearRegression(firstHalf).slope
    const secondSlope = this.linearRegression(secondHalf).slope
    const acceleration = secondSlope - firstSlope

    // Determine direction
    let direction: 'up' | 'down' | 'stable' = 'stable'
    if (slope > 0.5) direction = 'up'
    else if (slope < -0.5) direction = 'down'

    // Calculate strength (R-squared)
    const strength = this.calculateRSquared(data, slope)

    // Simple seasonality detection
    const seasonality = this.detectSeasonality(data)

    return {
      direction,
      strength,
      velocity,
      acceleration,
      seasonality
    }
  }

  /**
   * Generate forecast with confidence intervals
   */
  forecast(data: TimeSeriesData[], periods: number = 24): Forecast[] {
    if (data.length < 3) return []

    const { slope, intercept } = this.linearRegression(data)
    const stdDev = this.calculateStdDev(data, slope, intercept)
    const timeInterval = this.calculateAverageInterval(data)
    const lastTimestamp = data[data.length - 1].timestamp

    const forecasts: Forecast[] = []

    for (let i = 1; i <= periods; i++) {
      const timestamp = lastTimestamp + (timeInterval * i)
      const value = slope * (data.length + i - 1) + intercept
      const confidence = Math.max(0.5, 0.95 - (i * 0.02))
      
      // Confidence intervals (95%)
      const margin = 1.96 * stdDev * Math.sqrt(1 + 1/data.length)
      
      forecasts.push({
        timestamp,
        value: Math.max(0, value),
        confidence,
        upperBound: Math.max(0, value + margin),
        lowerBound: Math.max(0, value - margin)
      })
    }

    return forecasts
  }

  /**
   * Detect anomalies in data
   */
  detectAnomalies(data: TimeSeriesData[], threshold: number = 2): number[] {
    if (data.length < 10) return []

    const values = data.map(d => d.value)
    const mean = this.calculateMean(data)
    const stdDev = this.calculateSimpleStdDev(values)

    const anomalyIndices: number[] = []

    data.forEach((point, index) => {
      const zScore = Math.abs((point.value - mean) / stdDev)
      if (zScore > threshold) {
        anomalyIndices.push(index)
      }
    })

    return anomalyIndices
  }

  /**
   * Calculate moving average
   */
  movingAverage(data: TimeSeriesData[], window: number = 5): TimeSeriesData[] {
    if (data.length < window) return data

    const result: TimeSeriesData[] = []

    for (let i = window - 1; i < data.length; i++) {
      const windowData = data.slice(i - window + 1, i + 1)
      const avg = windowData.reduce((sum, d) => sum + d.value, 0) / window
      
      result.push({
        timestamp: data[i].timestamp,
        value: avg
      })
    }

    return result
  }

  /**
   * Calculate exponential moving average
   */
  exponentialMovingAverage(data: TimeSeriesData[], alpha: number = 0.3): TimeSeriesData[] {
    if (data.length === 0) return []

    const result: TimeSeriesData[] = [data[0]]

    for (let i = 1; i < data.length; i++) {
      const ema = alpha * data[i].value + (1 - alpha) * result[i - 1].value
      result.push({
        timestamp: data[i].timestamp,
        value: ema
      })
    }

    return result
  }

  /**
   * Linear regression
   */
  private linearRegression(data: TimeSeriesData[]): { slope: number; intercept: number } {
    const n = data.length
    const xValues = data.map((_, i) => i)
    const yValues = data.map(d => d.value)

    const sumX = xValues.reduce((a, b) => a + b, 0)
    const sumY = yValues.reduce((a, b) => a + b, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  /**
   * Calculate R-squared
   */
  private calculateRSquared(data: TimeSeriesData[], slope: number): number {
    const yValues = data.map(d => d.value)
    const mean = this.calculateMean(data)
    
    const totalSS = yValues.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0)
    const residualSS = yValues.reduce((sum, y, i) => {
      const predicted = slope * i + mean
      return sum + Math.pow(y - predicted, 2)
    }, 0)

    return 1 - (residualSS / totalSS)
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(data: TimeSeriesData[], slope: number, intercept: number): number {
    const squaredErrors = data.map((point, i) => {
      const predicted = slope * i + intercept
      return Math.pow(point.value - predicted, 2)
    })

    const mse = squaredErrors.reduce((a, b) => a + b, 0) / data.length
    return Math.sqrt(mse)
  }

  /**
   * Calculate simple standard deviation
   */
  private calculateSimpleStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
    return Math.sqrt(variance)
  }

  /**
   * Calculate mean
   */
  private calculateMean(data: TimeSeriesData[]): number {
    return data.reduce((sum, d) => sum + d.value, 0) / data.length
  }

  /**
   * Calculate average time interval
   */
  private calculateAverageInterval(data: TimeSeriesData[]): number {
    if (data.length < 2) return 1

    const intervals = []
    for (let i = 1; i < data.length; i++) {
      intervals.push(data[i].timestamp - data[i - 1].timestamp)
    }

    return intervals.reduce((a, b) => a + b, 0) / intervals.length
  }

  /**
   * Simple seasonality detection
   */
  private detectSeasonality(data: TimeSeriesData[]): boolean {
    if (data.length < 14) return false

    // Check for repeating patterns using autocorrelation
    const values = data.map(d => d.value)
    const mean = this.calculateMean(data)
    
    // Check common periods (hourly, daily patterns)
    const periods = [24, 12, 8, 6] // hours
    
    for (const period of periods) {
      if (data.length < period * 2) continue
      
      let correlation = 0
      let count = 0
      
      for (let i = 0; i < data.length - period; i++) {
        correlation += (values[i] - mean) * (values[i + period] - mean)
        count++
      }
      
      correlation /= count
      
      // If correlation is strong, we detected seasonality
      if (Math.abs(correlation) > 0.5) {
        return true
      }
    }

    return false
  }
}

// Create singleton instance
export const predictiveAnalytics = new PredictiveAnalytics()

// Convenience functions
export const predictNextValue = (data: TimeSeriesData[], horizon?: number) => {
  return predictiveAnalytics.predictNext(data, horizon)
}

export const analyzeTrend = (data: TimeSeriesData[]) => {
  return predictiveAnalytics.analyzeTrend(data)
}

export const generateForecast = (data: TimeSeriesData[], periods?: number) => {
  return predictiveAnalytics.forecast(data, periods)
}

export const detectAnomalies = (data: TimeSeriesData[], threshold?: number) => {
  return predictiveAnalytics.detectAnomalies(data, threshold)
}

// React hook
export function usePredictiveAnalytics() {
  return {
    predictNext: predictiveAnalytics.predictNext.bind(predictiveAnalytics),
    analyzeTrend: predictiveAnalytics.analyzeTrend.bind(predictiveAnalytics),
    forecast: predictiveAnalytics.forecast.bind(predictiveAnalytics),
    detectAnomalies: predictiveAnalytics.detectAnomalies.bind(predictiveAnalytics),
    movingAverage: predictiveAnalytics.movingAverage.bind(predictiveAnalytics),
    exponentialMovingAverage: predictiveAnalytics.exponentialMovingAverage.bind(predictiveAnalytics)
  }
}
