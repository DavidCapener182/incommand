export type CrowdBehaviorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type WelfareConcernLevel = 'normal' | 'watch' | 'warning' | 'critical'

export interface CrowdBehaviorReading {
  id: string
  event_id: string
  zone_id?: string | null
  zone_label?: string | null
  behavior_type: string
  severity: CrowdBehaviorSeverity
  source: string
  sentiment_score?: number | null
  confidence?: number | null
  metadata: Record<string, any>
  detected_at: string
  created_at: string
}

export interface WelfareSentimentReading {
  id: string
  event_id: string
  zone_id?: string | null
  zone_label?: string | null
  sentiment_score: number
  concern_level: WelfareConcernLevel
  keywords: string[]
  sample_count: number
  source: string
  metadata: Record<string, any>
  captured_at: string
  created_at: string
}

export interface CrowdBehaviorInsight {
  zoneId?: string | null
  zoneLabel?: string | null
  dominantBehavior?: string | null
  severity: CrowdBehaviorSeverity
  lastDetected?: string | null
  confidence?: number | null
  supportingSources: string[]
}

export interface WelfareSentimentInsight {
  zoneId?: string | null
  zoneLabel?: string | null
  averageSentiment: number
  concernLevel: WelfareConcernLevel
  keywords: string[]
  sampleCount: number
  sourceBreakdown: Record<string, number>
  lastUpdated?: string | null
}

export interface ZoneRiskScore {
  zoneId?: string | null
  zoneLabel?: string | null
  combinedScore: number
  behaviorSeverity?: CrowdBehaviorSeverity
  concernLevel?: WelfareConcernLevel
  dominantBehavior?: string | null
  averageSentiment?: number | null
  lastUpdated?: string | null
  signalCount: number
}

export interface SentimentTrendPoint {
  label: string
  value: number
}

export interface KeywordHighlight {
  keyword: string
  mentions: number
}

export interface CrowdIntelligenceSummary {
  insightsGeneratedAt: string
  behaviorInsights: CrowdBehaviorInsight[]
  welfareInsights: WelfareSentimentInsight[]
  criticalAlerts: Array<{
    type: 'behavior' | 'welfare'
    severity: CrowdBehaviorSeverity | WelfareConcernLevel
    zoneLabel?: string | null
    message: string
    timestamp: string
  }>
  metrics: {
    totalSignals: number
    highSeveritySignals: number
    averageSentiment: number | null
    concernZones: number
  }
  zoneRiskScores: ZoneRiskScore[]
  sentimentTrend: SentimentTrendPoint[]
  keywordHighlights: KeywordHighlight[]
}


