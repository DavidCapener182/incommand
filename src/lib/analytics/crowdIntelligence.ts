import { SupabaseClient } from '@supabase/supabase-js'
import {
  CrowdBehaviorInsight,
  CrowdBehaviorReading,
  CrowdBehaviorSeverity,
  CrowdIntelligenceSummary,
  KeywordHighlight,
  SentimentTrendPoint,
  WelfareConcernLevel,
  WelfareSentimentInsight,
  WelfareSentimentReading,
  ZoneRiskScore,
} from '@/types/crowdIntelligence'

// These tables (crowd_behavior_readings, welfare_sentiment) live in a feature-specific schema
// that isn't covered by the generated Supabase types yet, so we use 'any' here to avoid type errors
type Supabase = SupabaseClient<any>

const BEHAVIOR_LOOKBACK_MINUTES = 60
const WELFARE_LOOKBACK_MINUTES = 90

function getFallbackSummary(): CrowdIntelligenceSummary {
  return {
    insightsGeneratedAt: new Date().toISOString(),
    behaviorInsights: [],
    welfareInsights: [],
    criticalAlerts: [],
    metrics: {
      totalSignals: 0,
      highSeveritySignals: 0,
      averageSentiment: null,
      concernZones: 0,
    },
    zoneRiskScores: [],
    sentimentTrend: [],
    keywordHighlights: [],
  }
}

function mapSeverityToScore(level: CrowdBehaviorSeverity | WelfareConcernLevel): number {
  switch (level) {
    case 'critical':
      return 1
    case 'high':
    case 'warning':
      return 0.75
    case 'medium':
    case 'watch':
      return 0.5
    default:
      return 0.25
  }
}

export async function getCrowdIntelligenceSummary(
  supabase: Supabase,
  eventId: string
): Promise<CrowdIntelligenceSummary> {
  if (!eventId) {
    return getFallbackSummary()
  }

  const now = new Date()
  const behaviorSince = new Date(now.getTime() - BEHAVIOR_LOOKBACK_MINUTES * 60 * 1000).toISOString()
  const welfareSince = new Date(now.getTime() - WELFARE_LOOKBACK_MINUTES * 60 * 1000).toISOString()

  try {
    const [
      { data: behaviorData, error: behaviorError },
      { data: welfareData, error: welfareError },
    ] = await Promise.all([
      supabase
        .from('crowd_behavior_readings')
        .select('*')
        .eq('event_id', eventId)
        .gte('detected_at', behaviorSince)
        .order('detected_at', { ascending: false })
        .limit(200),
      supabase
        .from('welfare_sentiment')
        .select('*')
        .eq('event_id', eventId)
        .gte('captured_at', welfareSince)
        .order('captured_at', { ascending: false })
        .limit(200),
    ]);

    if (behaviorError || welfareError) {
      throw new Error(
        `Supabase fetch failed: behaviorError=${behaviorError?.message ?? "none"}, welfareError=${welfareError?.message ?? "none"}`
      );
    }

    const behaviorInsights = generateBehaviorInsights(behaviorData ?? [])
    const welfareInsights = generateWelfareInsights(welfareData ?? [])
    const criticalAlerts = createCriticalAlerts(behaviorInsights, welfareInsights);
    const zoneRiskScores = buildZoneRiskScores(behaviorInsights, welfareInsights);
    const sentimentTrend = buildSentimentTrend(Array.isArray(welfareData) ? welfareData : []);
    const keywordHighlights = buildKeywordHighlights(Array.isArray(welfareData) ? welfareData : []);

    const totalSignals =
      (Array.isArray(behaviorData) ? behaviorData.length : 0) +
      (Array.isArray(welfareData) ? welfareData.length : 0)

    const highSeverityBehavior = Array.isArray(behaviorData)
      ? behaviorData.filter(
          b =>
            b &&
            typeof b.severity === 'string' &&
            (b.severity === 'high' || b.severity === 'critical')
        ).length
      : 0

    const highSeverityWelfare = Array.isArray(welfareData)
      ? welfareData.filter(
          w =>
            w &&
            typeof w.concern_level === 'string' &&
            (w.concern_level === 'warning' || w.concern_level === 'critical')
        ).length
      : 0

    const highSeveritySignals = highSeverityBehavior + highSeverityWelfare

    const validSentiments = Array.isArray(welfareData)
      ? (welfareData
          .map(item => item?.sentiment_score)
          .filter(score => typeof score === 'number' && !Number.isNaN(score)) as number[])
      : []

    const averageSentiment =
      validSentiments.length > 0
        ? validSentiments.reduce((sum, score) => sum + score, 0) / validSentiments.length
        : null

    const concernZones = welfareInsights.filter(
      insight => insight.concernLevel === 'warning' || insight.concernLevel === 'critical'
    ).length

    return {
      insightsGeneratedAt: now.toISOString(),
      behaviorInsights,
      welfareInsights,
      criticalAlerts,
      zoneRiskScores,
      sentimentTrend,
      keywordHighlights,
      metrics: {
        totalSignals,
        highSeveritySignals,
        averageSentiment,
        concernZones,
      },
    }
  } catch (error) {
    console.warn('Crowd intelligence summary failed, returning fallback', error)
    return getFallbackSummary()
  }
}

function generateBehaviorInsights(readings: CrowdBehaviorReading[]): CrowdBehaviorInsight[] {
  if (readings.length === 0) return []

  const grouped = new Map<string, CrowdBehaviorReading[]>()
  readings.forEach(reading => {
    const key = reading.zone_id || reading.zone_label || 'unknown'
    grouped.set(key, [...(grouped.get(key) ?? []), reading])
  })

  const insights: CrowdBehaviorInsight[] = []
  grouped.forEach(groupReadings => {
    const latest = groupReadings[0]
    const severityScore =
      groupReadings.reduce((sum, reading) => sum + mapSeverityToScore(reading.severity), 0) / groupReadings.length

    const behaviorMap = groupReadings.reduce<Record<string, number>>((acc, reading) => {
      acc[reading.behavior_type] = (acc[reading.behavior_type] || 0) + 1
      return acc
    }, {})

    const dominantBehavior = Object.entries(behaviorMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    insights.push({
      zoneId: latest.zone_id,
      zoneLabel: latest.zone_label,
      dominantBehavior,
      severity: severityScore >= 0.75 ? 'critical' : severityScore >= 0.5 ? 'high' : severityScore >= 0.35 ? 'medium' : 'low',
      lastDetected: latest.detected_at,
      confidence: latest.confidence ?? null,
      supportingSources: Array.from(new Set(groupReadings.map(r => r.source))).slice(0, 3),
    })
  })

  return insights.sort((a, b) => mapSeverityToScore(b.severity) - mapSeverityToScore(a.severity))
}

function generateWelfareInsights(readings: WelfareSentimentReading[]): WelfareSentimentInsight[] {
  if (readings.length === 0) return []

  const grouped = new Map<string, WelfareSentimentReading[]>()
  readings.forEach(reading => {
    const key = reading.zone_id || reading.zone_label || 'unknown'
    grouped.set(key, [...(grouped.get(key) ?? []), reading])
  })

  const insights: WelfareSentimentInsight[] = []
  grouped.forEach(groupReadings => {
    const averageSentiment =
      groupReadings.reduce((sum, reading) => sum + reading.sentiment_score, 0) / groupReadings.length

    const concernScore =
      groupReadings.reduce((sum, reading) => sum + mapSeverityToScore(reading.concern_level), 0) / groupReadings.length

    const concernLevel: WelfareConcernLevel =
      concernScore >= 0.75 ? 'critical' : concernScore >= 0.5 ? 'warning' : concernScore >= 0.35 ? 'watch' : 'normal'

    const keywords = Array.from(
      new Set(groupReadings.flatMap(reading => reading.keywords ?? []).filter(Boolean))
    ).slice(0, 6)

    const sourceBreakdown = groupReadings.reduce<Record<string, number>>((acc, reading) => {
      acc[reading.source] = (acc[reading.source] || 0) + 1
      return acc
    }, {})

    const latest = groupReadings[0]

    insights.push({
      zoneId: latest.zone_id,
      zoneLabel: latest.zone_label,
      averageSentiment,
      concernLevel,
      keywords,
      sampleCount: groupReadings.reduce((sum, reading) => sum + reading.sample_count, 0),
      sourceBreakdown,
      lastUpdated: latest.captured_at,
    })
  })

  return insights.sort((a, b) => mapSeverityToScore(b.concernLevel) - mapSeverityToScore(a.concernLevel))
}

function createCriticalAlerts(
  behaviorInsights: CrowdBehaviorInsight[],
  welfareInsights: WelfareSentimentInsight[]
) {
  const alerts: CrowdIntelligenceSummary['criticalAlerts'] = []

  behaviorInsights
    .filter(insight => insight.severity === 'high' || insight.severity === 'critical')
    .slice(0, 5)
    .forEach(insight => {
      alerts.push({
        type: 'behavior',
        severity: insight.severity,
        zoneLabel: insight.zoneLabel,
        message: `Detected ${insight.dominantBehavior ?? 'unusual activity'} (${insight.severity})`,
        timestamp: insight.lastDetected || new Date().toISOString(),
      })
    })

  welfareInsights
    .filter(insight => insight.concernLevel === 'warning' || insight.concernLevel === 'critical')
    .slice(0, 5)
    .forEach(insight => {
      alerts.push({
        type: 'welfare',
        severity: insight.concernLevel,
        zoneLabel: insight.zoneLabel,
        message: `Welfare concern (${insight.concernLevel}) with sentiment ${insight.averageSentiment.toFixed(2)}`,
        timestamp: insight.lastUpdated || new Date().toISOString(),
      })
    })

  return alerts
}

function buildZoneRiskScores(
  behaviorInsights: CrowdBehaviorInsight[],
  welfareInsights: WelfareSentimentInsight[]
): ZoneRiskScore[] {
  if (behaviorInsights.length === 0 && welfareInsights.length === 0) return []

  type Combined = ZoneRiskScore & { behaviorWeight?: number; welfareWeight?: number }
  const combined = new Map<string, Combined>()

  behaviorInsights.forEach(insight => {
    const key = insight.zoneId || insight.zoneLabel || 'unknown'
    const existing = combined.get(key) ?? {
      zoneId: insight.zoneId,
      zoneLabel: insight.zoneLabel ?? 'Unassigned Zone',
      combinedScore: 0,
      signalCount: 0,
    }
    existing.behaviorSeverity = insight.severity
    existing.dominantBehavior = insight.dominantBehavior
    existing.lastUpdated = insight.lastDetected ?? existing.lastUpdated
    existing.signalCount += 1
    existing.behaviorWeight = mapSeverityToScore(insight.severity)
    combined.set(key, existing)
  })

  welfareInsights.forEach(insight => {
    const key = insight.zoneId || insight.zoneLabel || 'unknown'
    const existing = combined.get(key) ?? {
      zoneId: insight.zoneId,
      zoneLabel: insight.zoneLabel ?? 'Unassigned Zone',
      combinedScore: 0,
      signalCount: 0,
    }
    existing.concernLevel = insight.concernLevel
    existing.averageSentiment = insight.averageSentiment
    existing.lastUpdated = insight.lastUpdated ?? existing.lastUpdated
    existing.signalCount += 1
    existing.welfareWeight = mapSeverityToScore(insight.concernLevel)
    combined.set(key, existing)
  })

  const scores = Array.from(combined.values()).map(entry => {
    const weights = [entry.behaviorWeight, entry.welfareWeight].filter(
      weight => typeof weight === 'number'
    ) as number[]

    const combinedScore =
      weights.length > 0 ? weights.reduce((sum, weight) => sum + weight, 0) / weights.length : 0

    return {
      zoneId: entry.zoneId,
      zoneLabel: entry.zoneLabel,
      combinedScore,
      behaviorSeverity: entry.behaviorSeverity,
      concernLevel: entry.concernLevel,
      dominantBehavior: entry.dominantBehavior,
      averageSentiment: entry.averageSentiment,
      lastUpdated: entry.lastUpdated,
      signalCount: entry.signalCount,
    }
  })

  return scores.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, 8)
}

function buildSentimentTrend(readings: WelfareSentimentReading[]): SentimentTrendPoint[] {
  if (readings.length === 0) return []

  const sorted = [...readings].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  )

  const bucketMap = new Map<string, number[]>()
  sorted.forEach(reading => {
    const date = new Date(reading.captured_at)
    const bucketMinutes = Math.floor(date.getMinutes() / 10) * 10
    const label = `${date.getHours().toString().padStart(2, '0')}:${bucketMinutes
      .toString()
      .padStart(2, '0')}`
    bucketMap.set(label, [...(bucketMap.get(label) ?? []), reading.sentiment_score])
  })

  return Array.from(bucketMap.entries())
    .map(([label, scores]) => ({
      label,
      value: Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-6)
}

function buildKeywordHighlights(readings: WelfareSentimentReading[]): KeywordHighlight[] {
  if (readings.length === 0) return []

  const frequency = readings.reduce<Record<string, number>>((acc, reading) => {
    reading.keywords?.forEach(keyword => {
      if (!keyword) return
      const normalized = keyword.trim().toLowerCase()
      if (!normalized) return
      acc[normalized] = (acc[normalized] || 0) + 1
    })
    return acc
  }, {})

  return Object.entries(frequency)
    .map(([keyword, mentions]) => ({ keyword, mentions }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 8)
}


