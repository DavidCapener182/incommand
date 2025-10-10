/**
 * Custom Metric Builder System
 * Allows users to create custom KPIs and calculations
 */

export interface CustomMetric {
  id: string
  name: string
  description: string
  category: 'operational' | 'quality' | 'compliance' | 'performance' | 'financial'
  formula: string
  dataSource: 'incidents' | 'logs' | 'staff' | 'events' | 'combined'
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max' | 'median' | 'custom'
  timeWindow: 'hour' | 'day' | 'week' | 'month' | 'event' | 'custom'
  filters: MetricFilter[]
  thresholds: MetricThreshold[]
  visualization: VisualizationConfig
  createdAt: string
  updatedAt: string
  createdBy: string
  isPublic: boolean
  tags: string[]
}

export interface MetricFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in'
  value: any
  label: string
}

export interface MetricThreshold {
  level: 'warning' | 'critical' | 'target' | 'minimum' | 'maximum'
  value: number
  color: string
  label: string
}

export interface VisualizationConfig {
  type: 'number' | 'gauge' | 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  color: string
  size: 'small' | 'medium' | 'large'
  showTrend: boolean
  showComparison: boolean
  yAxisLabel?: string
  xAxisLabel?: string
}

export interface MetricCalculation {
  metric: CustomMetric
  value: number
  previousValue: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'critical'
  timestamp: string
  dataPoints: DataPoint[]
}

export interface DataPoint {
  timestamp: string
  value: number
  metadata?: Record<string, any>
}

export interface MetricTemplate {
  id: string
  name: string
  description: string
  category: string
  industry: string
  formula: string
  dataSource: string
  aggregation: string
  timeWindow: string
  filters: MetricFilter[]
  thresholds: MetricThreshold[]
  visualization: VisualizationConfig
  tags: string[]
}

/**
 * Metric Builder Engine
 */
export class MetricBuilder {
  private metrics: Map<string, CustomMetric> = new Map()
  private templates: Map<string, MetricTemplate> = new Map()

  constructor() {
    this.initializeTemplates()
  }

  /**
   * Create a new custom metric
   */
  createMetric(metric: Omit<CustomMetric, 'id' | 'createdAt' | 'updatedAt'>): CustomMetric {
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const newMetric: CustomMetric = {
      ...metric,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.metrics.set(id, newMetric)
    return newMetric
  }

  /**
   * Update an existing metric
   */
  updateMetric(id: string, updates: Partial<CustomMetric>): CustomMetric | null {
    const existing = this.metrics.get(id)
    if (!existing) return null

    const updated: CustomMetric = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    }

    this.metrics.set(id, updated)
    return updated
  }

  /**
   * Delete a metric
   */
  deleteMetric(id: string): boolean {
    return this.metrics.delete(id)
  }

  /**
   * Get a metric by ID
   */
  getMetric(id: string): CustomMetric | null {
    return this.metrics.get(id) || null
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): CustomMetric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: CustomMetric['category']): CustomMetric[] {
    return this.getAllMetrics().filter(metric => metric.category === category)
  }

  /**
   * Calculate metric value
   */
  async calculateMetric(
    metric: CustomMetric, 
    data: any[], 
    timeRange?: { start: Date; end: Date }
  ): Promise<MetricCalculation> {
    try {
      // Filter data based on metric filters
      const filteredData = this.applyFilters(data, metric.filters)
      
      // Apply time window filtering
      const timeFilteredData = this.applyTimeWindow(filteredData, metric.timeWindow, timeRange)
      
      // Calculate aggregation
      const value = this.calculateAggregation(timeFilteredData, metric.aggregation, metric.formula)
      
      // Calculate trend (compare with previous period)
      const previousValue = await this.calculatePreviousValue(metric, data, timeRange)
      const change = value - previousValue
      const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0
      
      // Determine trend direction
      const trend = this.determineTrend(changePercent)
      
      // Determine status based on thresholds
      const status = this.determineStatus(value, metric.thresholds)
      
      // Generate data points for visualization
      const dataPoints = this.generateDataPoints(timeFilteredData, metric)
      
      return {
        metric,
        value,
        previousValue,
        change,
        changePercent,
        trend,
        status,
        timestamp: new Date().toISOString(),
        dataPoints
      }
    } catch (error) {
      console.error('Error calculating metric:', error)
      throw error
    }
  }

  /**
   * Validate metric configuration
   */
  validateMetric(metric: Partial<CustomMetric>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!metric.name || metric.name.trim().length === 0) {
      errors.push('Metric name is required')
    }

    if (!metric.description || metric.description.trim().length === 0) {
      errors.push('Metric description is required')
    }

    if (!metric.formula || metric.formula.trim().length === 0) {
      errors.push('Metric formula is required')
    }

    if (!metric.dataSource) {
      errors.push('Data source is required')
    }

    if (!metric.aggregation) {
      errors.push('Aggregation method is required')
    }

    // Validate formula syntax (basic validation)
    if (metric.formula && !this.isValidFormula(metric.formula)) {
      errors.push('Invalid formula syntax')
    }

    // Validate thresholds
    if (metric.thresholds) {
      for (const threshold of metric.thresholds) {
        if (typeof threshold.value !== 'number') {
          errors.push(`Threshold value must be a number for ${threshold.label}`)
        }
        if (!threshold.color || !this.isValidColor(threshold.color)) {
          errors.push(`Invalid color for threshold ${threshold.label}`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get available templates
   */
  getTemplates(): MetricTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get templates by industry
   */
  getTemplatesByIndustry(industry: string): MetricTemplate[] {
    return this.getTemplates().filter(template => 
      template.industry === industry || template.industry === 'general'
    )
  }

  /**
   * Create metric from template
   */
  createFromTemplate(templateId: string, customizations?: Partial<CustomMetric>): CustomMetric {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const metric: Omit<CustomMetric, 'id' | 'createdAt' | 'updatedAt'> = {
      name: template.name,
      description: template.description,
      category: template.category as CustomMetric['category'],
      formula: template.formula,
      dataSource: template.dataSource as CustomMetric['dataSource'],
      aggregation: template.aggregation as CustomMetric['aggregation'],
      timeWindow: template.timeWindow as CustomMetric['timeWindow'],
      filters: template.filters,
      thresholds: template.thresholds,
      visualization: template.visualization,
      createdBy: 'user', // This would come from auth context
      isPublic: false,
      tags: template.tags,
      ...customizations
    }

    return this.createMetric(metric)
  }

  // Private helper methods

  private generateId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private applyFilters(data: any[], filters: MetricFilter[]): any[] {
    return data.filter(item => {
      return filters.every(filter => {
        const fieldValue = this.getFieldValue(item, filter.field)
        return this.evaluateFilter(fieldValue, filter.operator, filter.value)
      })
    })
  }

  private applyTimeWindow(data: any[], timeWindow: string, timeRange?: { start: Date; end: Date }): any[] {
    if (!timeRange) return data

    const now = new Date()
    let startTime: Date

    switch (timeWindow) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'event':
        return data // Use full event data
      default:
        return data.filter(item => {
          const itemTime = new Date(item.timestamp)
          return itemTime >= timeRange.start && itemTime <= timeRange.end
        })
    }

    return data.filter(item => {
      const itemTime = new Date(item.timestamp)
      return itemTime >= startTime
    })
  }

  private calculateAggregation(data: any[], aggregation: string, formula: string): number {
    if (data.length === 0) return 0

    switch (aggregation) {
      case 'sum':
        return data.reduce((sum, item) => sum + this.evaluateFormula(item, formula), 0)
      case 'average':
        return data.reduce((sum, item) => sum + this.evaluateFormula(item, formula), 0) / data.length
      case 'count':
        return data.length
      case 'min':
        return Math.min(...data.map(item => this.evaluateFormula(item, formula)))
      case 'max':
        return Math.max(...data.map(item => this.evaluateFormula(item, formula)))
      case 'median':
        const values = data.map(item => this.evaluateFormula(item, formula)).sort((a, b) => a - b)
        const mid = Math.floor(values.length / 2)
        return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid]
      case 'custom':
        return this.evaluateCustomFormula(data, formula)
      default:
        return 0
    }
  }

  private evaluateFormula(item: any, formula: string): number {
    // Simple formula evaluation - in production, use a proper expression parser
    try {
      // Replace field references with actual values
      let evaluatedFormula = formula
      const fieldMatches = formula.match(/\{(\w+)\}/g)
      
      if (fieldMatches) {
        for (const match of fieldMatches) {
          const field = match.slice(1, -1) // Remove { }
          const value = this.getFieldValue(item, field)
          evaluatedFormula = evaluatedFormula.replace(match, value.toString())
        }
      }
      
      // Evaluate the formula (basic math operations)
      return Function('"use strict"; return (' + evaluatedFormula + ')')()
    } catch (error) {
      console.error('Error evaluating formula:', error)
      return 0
    }
  }

  private evaluateCustomFormula(data: any[], formula: string): number {
    // For custom formulas that work on the entire dataset
    try {
      // Replace dataset references
      let evaluatedFormula = formula
      evaluatedFormula = evaluatedFormula.replace(/\{count\}/g, data.length.toString())
      
      if (data.length > 0) {
        const values = data.map(item => this.getFieldValue(item, 'value') || 0)
        const sum = values.reduce((a, b) => a + b, 0)
        const avg = sum / values.length
        
        evaluatedFormula = evaluatedFormula.replace(/\{sum\}/g, sum.toString())
        evaluatedFormula = evaluatedFormula.replace(/\{avg\}/g, avg.toString())
      }
      
      return Function('"use strict"; return (' + evaluatedFormula + ')')()
    } catch (error) {
      console.error('Error evaluating custom formula:', error)
      return 0
    }
  }

  private getFieldValue(item: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], item)
  }

  private evaluateFilter(fieldValue: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === filterValue
      case 'not_equals':
        return fieldValue !== filterValue
      case 'greater_than':
        return Number(fieldValue) > Number(filterValue)
      case 'less_than':
        return Number(fieldValue) < Number(filterValue)
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase())
      case 'in':
        return Array.isArray(filterValue) ? filterValue.includes(fieldValue) : false
      case 'not_in':
        return Array.isArray(filterValue) ? !filterValue.includes(fieldValue) : true
      default:
        return true
    }
  }

  private async calculatePreviousValue(
    metric: CustomMetric, 
    data: any[], 
    timeRange?: { start: Date; end: Date }
  ): Promise<number> {
    // Calculate value for previous time period
    if (!timeRange) return 0
    
    const duration = timeRange.end.getTime() - timeRange.start.getTime()
    const previousStart = new Date(timeRange.start.getTime() - duration)
    const previousEnd = new Date(timeRange.start.getTime())
    
    const previousData = data.filter(item => {
      const itemTime = new Date(item.timestamp)
      return itemTime >= previousStart && itemTime < previousEnd
    })
    
    const filteredData = this.applyFilters(previousData, metric.filters)
    return this.calculateAggregation(filteredData, metric.aggregation, metric.formula)
  }

  private determineTrend(changePercent: number): 'up' | 'down' | 'stable' {
    if (changePercent > 5) return 'up'
    if (changePercent < -5) return 'down'
    return 'stable'
  }

  private determineStatus(value: number, thresholds: MetricThreshold[]): 'good' | 'warning' | 'critical' {
    const criticalThreshold = thresholds.find(t => t.level === 'critical')
    const warningThreshold = thresholds.find(t => t.level === 'warning')
    
    if (criticalThreshold && this.evaluateThreshold(value, criticalThreshold)) {
      return 'critical'
    }
    if (warningThreshold && this.evaluateThreshold(value, warningThreshold)) {
      return 'warning'
    }
    return 'good'
  }

  private evaluateThreshold(value: number, threshold: MetricThreshold): boolean {
    switch (threshold.level) {
      case 'critical':
      case 'warning':
        return value >= threshold.value
      case 'target':
        return Math.abs(value - threshold.value) <= threshold.value * 0.1 // Within 10%
      case 'minimum':
        return value >= threshold.value
      case 'maximum':
        return value <= threshold.value
      default:
        return false
    }
  }

  private generateDataPoints(data: any[], metric: CustomMetric): DataPoint[] {
    // Group data by time periods and calculate values
    const timeGroups = this.groupByTime(data, metric.timeWindow)
    
    return Object.entries(timeGroups).map(([timestamp, groupData]) => ({
      timestamp,
      value: this.calculateAggregation(groupData, metric.aggregation, metric.formula),
      metadata: {
        count: groupData.length,
        category: metric.category
      }
    }))
  }

  private groupByTime(data: any[], timeWindow: string): Record<string, any[]> {
    const groups: Record<string, any[]> = {}
    
    data.forEach(item => {
      const timestamp = new Date(item.timestamp)
      let key: string
      
      switch (timeWindow) {
        case 'hour':
          key = timestamp.toISOString().slice(0, 13) + ':00:00.000Z'
          break
        case 'day':
          key = timestamp.toISOString().slice(0, 10) + 'T00:00:00.000Z'
          break
        case 'week':
          const weekStart = new Date(timestamp)
          weekStart.setDate(timestamp.getDate() - timestamp.getDay())
          key = weekStart.toISOString().slice(0, 10) + 'T00:00:00.000Z'
          break
        case 'month':
          key = timestamp.toISOString().slice(0, 7) + '-01T00:00:00.000Z'
          break
        default:
          key = timestamp.toISOString()
      }
      
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    
    return groups
  }

  private isValidFormula(formula: string): boolean {
    // Basic formula validation
    try {
      // Check for balanced parentheses
      let count = 0
      for (const char of formula) {
        if (char === '(') count++
        if (char === ')') count--
        if (count < 0) return false
      }
      return count === 0
    } catch {
      return false
    }
  }

  private isValidColor(color: string): boolean {
    // Basic color validation
    return /^#[0-9A-F]{6}$/i.test(color) || 
           /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color) ||
           /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color)
  }

  private initializeTemplates(): void {
    const templates: MetricTemplate[] = [
      {
        id: 'incident_response_time',
        name: 'Average Response Time',
        description: 'Average time to respond to incidents',
        category: 'performance',
        industry: 'security',
        formula: '{response_time}',
        dataSource: 'incidents',
        aggregation: 'average',
        timeWindow: 'day',
        filters: [],
        thresholds: [
          { level: 'warning', value: 10, color: '#F59E0B', label: 'Slow Response' },
          { level: 'critical', value: 20, color: '#EF4444', label: 'Very Slow' }
        ],
        visualization: {
          type: 'gauge',
          color: '#3B82F6',
          size: 'medium',
          showTrend: true,
          showComparison: true,
          yAxisLabel: 'Minutes'
        },
        tags: ['performance', 'response', 'incidents']
      },
      {
        id: 'log_quality_score',
        name: 'Log Quality Score',
        description: 'Overall quality of incident logs',
        category: 'quality',
        industry: 'general',
        formula: '{quality_score}',
        dataSource: 'logs',
        aggregation: 'average',
        timeWindow: 'day',
        filters: [],
        thresholds: [
          { level: 'warning', value: 70, color: '#F59E0B', label: 'Needs Improvement' },
          { level: 'critical', value: 50, color: '#EF4444', label: 'Poor Quality' }
        ],
        visualization: {
          type: 'line',
          color: '#10B981',
          size: 'medium',
          showTrend: true,
          showComparison: false,
          yAxisLabel: 'Score (0-100)'
        },
        tags: ['quality', 'logging', 'compliance']
      },
      {
        id: 'staff_utilization',
        name: 'Staff Utilization Rate',
        description: 'Percentage of staff actively engaged',
        category: 'operational',
        industry: 'security',
        formula: '{active_staff} / {total_staff} * 100',
        dataSource: 'staff',
        aggregation: 'average',
        timeWindow: 'hour',
        filters: [],
        thresholds: [
          { level: 'warning', value: 80, color: '#F59E0B', label: 'High Utilization' },
          { level: 'critical', value: 95, color: '#EF4444', label: 'Overutilized' }
        ],
        visualization: {
          type: 'gauge',
          color: '#8B5CF6',
          size: 'medium',
          showTrend: true,
          showComparison: true,
          yAxisLabel: 'Percentage'
        },
        tags: ['staffing', 'utilization', 'operational']
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }
}

// Export singleton instance
export const metricBuilder = new MetricBuilder()
