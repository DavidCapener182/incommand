/**
 * Card Registry System
 * Automatically discovers and registers all available analytics cards
 */

// Import all card components
import IncidentVolumeCard from '@/components/analytics/cards/IncidentVolumeCard'
import ResponseTimeDistributionCard from '@/components/analytics/cards/ResponseTimeDistributionCard'
import AttendanceTimelineCard from '@/components/analytics/cards/AttendanceTimelineCard'
import EjectionPatternsCard from '@/components/analytics/cards/EjectionPatternsCard'

// Quality cards
import OverallScoreCard from '@/components/analytics/cards/quality/OverallScoreCard'
import ScoreBreakdownCard from '@/components/analytics/cards/quality/ScoreBreakdownCard'
import QualityTrendCard from '@/components/analytics/cards/quality/QualityTrendCard'
import ScoreComponentsCard from '@/components/analytics/cards/quality/ScoreComponentsCard'
import EntryTypeDistributionCard from '@/components/analytics/cards/quality/EntryTypeDistributionCard'
import CompletenessByFieldCard from '@/components/analytics/cards/quality/CompletenessByFieldCard'
import TopOperatorsCard from '@/components/analytics/cards/quality/TopOperatorsCard'

// Compliance cards
import LegalReadinessCard from '@/components/analytics/cards/compliance/LegalReadinessCard'
import AuditTrailCard from '@/components/analytics/cards/compliance/AuditTrailCard'
import ImmutabilityCard from '@/components/analytics/cards/compliance/ImmutabilityCard'
import TimestampAccuracyCard from '@/components/analytics/cards/compliance/TimestampAccuracyCard'
import JustificationRateCard from '@/components/analytics/cards/compliance/JustificationRateCard'
import ComplianceTrendCard from '@/components/analytics/cards/compliance/ComplianceTrendCard'
import ComplianceBreakdownCard from '@/components/analytics/cards/compliance/ComplianceBreakdownCard'
import LegalReadinessChecklistCard from '@/components/analytics/cards/compliance/LegalReadinessChecklistCard'
import RecommendationsCard from '@/components/analytics/cards/compliance/RecommendationsCard'

// AI Insights cards
import AIOperationalSummaryCard from '@/components/analytics/cards/ai-insights/AIOperationalSummaryCard'
import OperationalReadinessCard from '@/components/analytics/cards/ai-insights/OperationalReadinessCard'
import ConfidenceMetricsCard from '@/components/analytics/cards/ai-insights/ConfidenceMetricsCard'
import IncidentVolumeTrendCard from '@/components/analytics/cards/ai-insights/IncidentVolumeTrendCard'
import ResponseTimeTrendCard from '@/components/analytics/cards/ai-insights/ResponseTimeTrendCard'
import LogQualityTrendCard from '@/components/analytics/cards/ai-insights/LogQualityTrendCard'
import PatternAnalysisCard from '@/components/analytics/cards/ai-insights/PatternAnalysisCard'
import AnomaliesCard from '@/components/analytics/cards/ai-insights/AnomaliesCard'
import TrendAnalysisCard from '@/components/analytics/cards/ai-insights/TrendAnalysisCard'
import PredictionsCard from '@/components/analytics/cards/ai-insights/PredictionsCard'

export interface CardMetadata {
  id: string
  name: string
  description: string
  category: 'operational' | 'quality' | 'compliance' | 'ai-insights'
  component: React.ComponentType<any>
  icon?: string
  requiredProps?: string[]
}

/**
 * Registry of all available analytics cards
 * When new cards are added, they should be registered here
 */
export const CARD_REGISTRY: CardMetadata[] = [
  // Operational Cards
  {
    id: 'incident-volume',
    name: 'Incident Volume Over Time',
    description: 'Shows incident volume trends over time',
    category: 'operational',
    component: IncidentVolumeCard,
    icon: '📊',
    requiredProps: ['incidentVolumeData']
  },
  {
    id: 'response-time-distribution',
    name: 'Response Time Distribution',
    description: 'Distribution of response times across incidents',
    category: 'operational',
    component: ResponseTimeDistributionCard,
    icon: '⏱️',
    requiredProps: ['responseTimeData']
  },
  {
    id: 'attendance-timeline',
    name: 'Attendance Timeline',
    description: 'Timeline of attendance and occupancy',
    category: 'operational',
    component: AttendanceTimelineCard,
    icon: '👥',
    requiredProps: ['attendanceTimelineData']
  },
  {
    id: 'ejection-patterns',
    name: 'Ejection/Refusal Patterns',
    description: 'Patterns in ejections and refusals',
    category: 'operational',
    component: EjectionPatternsCard,
    icon: '🚫',
    requiredProps: ['ejectionPatternData']
  },

  // Quality Cards
  {
    id: 'overall-score',
    name: 'Overall Log Quality Score',
    description: 'Overall quality score for log entries',
    category: 'quality',
    component: OverallScoreCard,
    icon: '⭐',
    requiredProps: ['overallScore', 'totalLogs']
  },
  {
    id: 'score-breakdown',
    name: 'Score Breakdown',
    description: 'Breakdown of quality scores by component',
    category: 'quality',
    component: ScoreBreakdownCard,
    icon: '📈',
    requiredProps: ['completeness', 'timeliness', 'factualLanguage']
  },
  {
    id: 'quality-trend',
    name: 'Quality Trend Over Time',
    description: 'Quality trends over time',
    category: 'quality',
    component: QualityTrendCard,
    icon: '📉',
    requiredProps: ['trend']
  },
  {
    id: 'score-components',
    name: 'Score Components',
    description: 'Detailed breakdown of score components',
    category: 'quality',
    component: ScoreComponentsCard,
    icon: '🔍',
    requiredProps: ['completeness', 'timeliness', 'factualLanguage']
  },
  {
    id: 'entry-type-distribution',
    name: 'Entry Type Distribution',
    description: 'Distribution of entry types',
    category: 'quality',
    component: EntryTypeDistributionCard,
    icon: '📊',
    requiredProps: ['amendmentRate', 'retrospectiveRate']
  },
  {
    id: 'completeness-by-field',
    name: 'Completeness by Field',
    description: 'Field-level completeness analysis',
    category: 'quality',
    component: CompletenessByFieldCard,
    icon: '✅',
    requiredProps: ['breakdown']
  },
  {
    id: 'top-operators',
    name: 'Top Performing Operators',
    description: 'Top operators by quality score',
    category: 'quality',
    component: TopOperatorsCard,
    icon: '🏆',
    requiredProps: ['topOperators']
  },

  // Compliance Cards
  {
    id: 'legal-readiness',
    name: 'JESIP/JDM Compliance Grade',
    description: 'Overall legal readiness and compliance grade',
    category: 'compliance',
    component: LegalReadinessCard,
    icon: '⚖️',
    requiredProps: ['legalReadinessScore', 'overallCompliance', 'totalIncidents']
  },
  {
    id: 'audit-trail',
    name: 'Audit Trail Completeness',
    description: 'Completeness of audit trail',
    category: 'compliance',
    component: AuditTrailCard,
    icon: '📋',
    requiredProps: ['auditTrailCompleteness', 'missingTimestamps']
  },
  {
    id: 'immutability',
    name: 'Immutability Score',
    description: 'Score for data immutability',
    category: 'compliance',
    component: ImmutabilityCard,
    icon: '🔒',
    requiredProps: ['immutabilityScore', 'unamendedDeletes']
  },
  {
    id: 'timestamp-accuracy',
    name: 'Timestamp Accuracy',
    description: 'Accuracy of timestamps',
    category: 'compliance',
    component: TimestampAccuracyCard,
    icon: '🕐',
    requiredProps: ['timestampAccuracy']
  },
  {
    id: 'justification-rate',
    name: 'Amendment Justification Rate',
    description: 'Rate of justified amendments',
    category: 'compliance',
    component: JustificationRateCard,
    icon: '📝',
    requiredProps: ['amendmentJustificationRate', 'unjustifiedRetrospectives']
  },
  {
    id: 'compliance-trend',
    name: 'Compliance Trend',
    description: 'Compliance trends over time',
    category: 'compliance',
    component: ComplianceTrendCard,
    icon: '📊',
    requiredProps: ['trend']
  },
  {
    id: 'compliance-breakdown',
    name: 'Compliance Breakdown',
    description: 'Detailed compliance breakdown',
    category: 'compliance',
    component: ComplianceBreakdownCard,
    icon: '🔍',
    requiredProps: ['breakdown']
  },
  {
    id: 'legal-readiness-checklist',
    name: 'Legal Readiness Checklist',
    description: 'Checklist for legal readiness',
    category: 'compliance',
    component: LegalReadinessChecklistCard,
    icon: '✅',
    requiredProps: ['auditTrailCompleteness', 'immutabilityScore', 'timestampAccuracy', 'amendmentJustificationRate', 'overallCompliance', 'legalReadinessScore']
  },
  {
    id: 'recommendations',
    name: 'Recommendations',
    description: 'Compliance recommendations',
    category: 'compliance',
    component: RecommendationsCard,
    icon: '💡',
    requiredProps: ['recommendations']
  },

  // AI Insights Cards
  {
    id: 'ai-operational-summary',
    name: 'AI Operational Summary',
    description: 'AI-generated operational summary',
    category: 'ai-insights',
    component: AIOperationalSummaryCard,
    icon: '🤖',
    requiredProps: ['aiSummary', 'onRefresh', 'isGenerating', 'totalIncidents', 'highPriorityIncidents', 'hasIncidents']
  },
  {
    id: 'operational-readiness',
    name: 'Operational Readiness',
    description: 'AI-powered operational readiness assessment',
    category: 'ai-insights',
    component: OperationalReadinessCard,
    icon: '🎯',
    requiredProps: ['readiness']
  },
  {
    id: 'confidence-metrics',
    name: 'AI Confidence Metrics',
    description: 'Confidence scores for AI predictions',
    category: 'ai-insights',
    component: ConfidenceMetricsCard,
    icon: '📊',
    requiredProps: ['confidence']
  },
  {
    id: 'incident-volume-trend',
    name: 'Incident Volume Trend',
    description: 'AI-analyzed incident volume trends',
    category: 'ai-insights',
    component: IncidentVolumeTrendCard,
    icon: '📈',
    requiredProps: ['trend']
  },
  {
    id: 'response-time-trend',
    name: 'Response Times Trend',
    description: 'AI-analyzed response time trends',
    category: 'ai-insights',
    component: ResponseTimeTrendCard,
    icon: '⏱️',
    requiredProps: ['trend']
  },
  {
    id: 'log-quality-trend',
    name: 'Log Quality Trend',
    description: 'AI-analyzed log quality trends',
    category: 'ai-insights',
    component: LogQualityTrendCard,
    icon: '📝',
    requiredProps: ['trend']
  },
  {
    id: 'pattern-analysis',
    name: 'Pattern Analysis',
    description: 'AI-detected patterns in incidents',
    category: 'ai-insights',
    component: PatternAnalysisCard,
    icon: '🔍',
    requiredProps: ['patterns']
  },
  {
    id: 'anomalies',
    name: 'Anomalies Detected',
    description: 'AI-detected anomalies',
    category: 'ai-insights',
    component: AnomaliesCard,
    icon: '⚠️',
    requiredProps: ['anomalies']
  },
  {
    id: 'trend-analysis',
    name: 'Trend Visualization',
    description: 'Visualization of AI-detected trends',
    category: 'ai-insights',
    component: TrendAnalysisCard,
    icon: '📊',
    requiredProps: ['chartData']
  },
  {
    id: 'predictions',
    name: 'Predictions',
    description: 'AI-powered predictions',
    category: 'ai-insights',
    component: PredictionsCard,
    icon: '🔮',
    requiredProps: ['forecast']
  }
]

/**
 * Get all cards by category
 */
export function getCardsByCategory(category: CardMetadata['category']): CardMetadata[] {
  return CARD_REGISTRY.filter(card => card.category === category)
}

/**
 * Get a card by ID
 */
export function getCardById(id: string): CardMetadata | undefined {
  return CARD_REGISTRY.find(card => card.id === id)
}

/**
 * Get all available categories
 */
export function getCategories(): CardMetadata['category'][] {
  return Array.from(new Set(CARD_REGISTRY.map(card => card.category)))
}

