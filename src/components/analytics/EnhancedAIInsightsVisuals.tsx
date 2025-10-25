'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  type ChartOptions,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import annotationPlugin from 'chartjs-plugin-annotation'
import { Line, Radar, Doughnut } from 'react-chartjs-2'
import { motion } from 'framer-motion'

import type { PredictiveForecast, PatternAnalysis } from '@/components/EnhancedAIInsights'

type ViewMode = 'insights' | 'charts' | 'predictions' | 'patterns'

let chartRegistered = false
const ensureChartsRegistered = () => {
  if (!chartRegistered) {
    ChartJS.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      BarElement,
      ArcElement,
      RadialLinearScale,
      Title,
      Tooltip,
      Legend,
      TimeScale,
      Filler,
      annotationPlugin
    )
    chartRegistered = true
  }
}

ensureChartsRegistered()

interface EnhancedAIInsightsVisualsProps {
  viewMode: ViewMode
  showAdvancedCharts: boolean
  predictiveData: PredictiveForecast | null
  patternData: PatternAnalysis[]
}

const getChartTheme = () => {
  const isDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  return {
    textColor: isDark ? '#ffffff' : '#1f2937',
    gridColor: isDark ? '#374151' : '#e5e7eb',
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
  }
}

export default function EnhancedAIInsightsVisuals({
  viewMode,
  showAdvancedCharts,
  predictiveData,
  patternData,
}: EnhancedAIInsightsVisualsProps) {
  const theme = useMemo(getChartTheme, [viewMode, predictiveData, patternData])

  if (viewMode === 'charts' && showAdvancedCharts) {
    const chartData = {
      labels: ['Current', '30min', '1hr', '1.5hr', '2hr'],
      datasets: [
        {
          label: 'Incident Probability',
          data: predictiveData
            ? [
                predictiveData.predictions.incidentCount * 0.5,
                predictiveData.predictions.incidentCount * 0.7,
                predictiveData.predictions.incidentCount * 0.85,
                predictiveData.predictions.incidentCount * 0.95,
                predictiveData.predictions.incidentCount,
              ]
            : [0, 0, 0, 0, 0],
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Crowd Density',
          data: predictiveData
            ? [
                predictiveData.predictions.crowdDensity * 0.8,
                predictiveData.predictions.crowdDensity * 0.9,
                predictiveData.predictions.crowdDensity * 0.95,
                predictiveData.predictions.crowdDensity * 0.98,
                predictiveData.predictions.crowdDensity,
              ]
            : [0, 0, 0, 0, 0],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    }

    const chartOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: theme.textColor,
            usePointStyle: true,
          },
        },
        title: {
          display: true,
          text: 'Predictive Forecast',
          color: theme.textColor,
          font: { size: 16, weight: 'bold' },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time Horizon',
            color: theme.textColor,
          },
          ticks: { color: theme.textColor },
          grid: { color: theme.gridColor },
        },
        y: {
          title: {
            display: true,
            text: 'Probability (%)',
            color: theme.textColor,
          },
          ticks: { color: theme.textColor },
          grid: { color: theme.gridColor },
        },
      },
    }

    const patternRadarData = {
      labels: ['Temporal', 'Spatial', 'Behavioral', 'Correlation', 'Seasonal', 'Anomaly'],
      datasets: [
        {
          label: 'Pattern Confidence',
          data: patternData.map((p) => p.confidence),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)',
        },
      ],
    }

    const patternOptions: ChartOptions<'radar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: theme.textColor },
        },
        title: {
          display: true,
          text: 'Pattern Recognition Analysis',
          color: theme.textColor,
          font: { size: 16, weight: 'bold' },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: theme.textColor,
            backdropColor: 'transparent',
          },
          grid: { color: theme.gridColor },
          pointLabels: { color: theme.textColor },
        },
      },
    }

    const riskData = {
      labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
      datasets: [
        {
          data: [25, 35, 25, 15],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: ['rgb(34, 197, 94)', 'rgb(234, 179, 8)', 'rgb(249, 115, 22)', 'rgb(239, 68, 68)'],
          borderWidth: 2,
        },
      ],
    }

    const riskOptions: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: theme.textColor },
        },
        title: {
          display: true,
          text: 'Risk Assessment Distribution',
          color: theme.textColor,
          font: { size: 16, weight: 'bold' },
        },
      },
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="h-64">
            <Radar data={patternRadarData} options={patternOptions} />
          </div>
        </div>
        <div className="h-64">
          <Doughnut data={riskData} options={riskOptions} />
        </div>
      </div>
    )
  }

  if (viewMode === 'predictions' && predictiveData) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-900/20 dark:to-indigo-900/20">
          <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Predictive Forecast - {predictiveData.timeHorizon}
          </h4>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <PredictionStat label="Predicted Incidents" value={predictiveData.predictions.incidentCount} colour="text-red-600 dark:text-red-400" />
            <PredictionStat label="Crowd Density" value={`${predictiveData.predictions.crowdDensity}%`} colour="text-blue-600 dark:text-blue-400" />
            <PredictionStat label="Risk Level" value={`${predictiveData.predictions.riskLevel}%`} colour="text-orange-600 dark:text-orange-400" />
            <PredictionStat label="Avg Response" value={`${predictiveData.predictions.responseTime}m`} colour="text-green-600 dark:text-green-400" />
          </div>
          <div className="mt-4 rounded-lg bg-white p-4 dark:bg-gray-700">
            <h5 className="mb-2 font-semibold text-gray-900 dark:text-white">Trend Analysis</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {predictiveData.trends.direction === 'increasing' ? '📈' : '📉'}{' '}
              {predictiveData.trends.direction.charAt(0).toUpperCase() + predictiveData.trends.direction.slice(1)} trend ({predictiveData.trends.magnitude}% change)
            </p>
            <div className="mt-2">
              <h6 className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">Contributing Factors:</h6>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                {predictiveData.trends.factors.map((factor, index) => (
                  <li key={index}>• {factor}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'patterns' && patternData.length > 0) {
    return (
      <div className="space-y-4">
        {patternData.map((pattern, index) => (
          <motion.div
            key={`${pattern.patternType}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-lg border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:from-purple-900/20 dark:to-pink-900/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center space-x-2">
                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    {pattern.patternType.charAt(0).toUpperCase() + pattern.patternType.slice(1)} Pattern
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{pattern.confidence}% confidence</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      pattern.impact === 'positive'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : pattern.impact === 'negative'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}
                  >
                    {pattern.impact}
                  </span>
                </div>
                <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">{pattern.description}</p>
                <div>
                  <h6 className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">Recommendations:</h6>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {pattern.recommendations.map((rec, recIndex) => (
                      <li key={recIndex}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  return null
}

interface PredictionStatProps {
  label: string
  value: string | number
  colour: string
}

function PredictionStat({ label, value, colour }: PredictionStatProps) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${colour}`}>{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  )
}
