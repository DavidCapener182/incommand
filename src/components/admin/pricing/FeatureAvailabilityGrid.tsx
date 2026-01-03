'use client'

import React from 'react'
import { CardContainer } from '@/components/ui/CardContainer'
import { FEATURE_MATRIX, getFeaturesByCategory, FeatureKey } from '@/config/FeatureMatrix'
import { PlanCode } from '@/config/PricingConfig'
import { isFeatureEnabled } from '@/lib/featureAccess'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

const TIER_ORDER: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']
const TIER_DISPLAY_NAMES: Record<PlanCode, string> = {
  starter: 'Starter',
  operational: 'Operational',
  command: 'Command',
  enterprise: 'Enterprise',
}

export default function FeatureAvailabilityGrid() {
  const featuresByCategory = getFeaturesByCategory()
  const categories = Object.keys(featuresByCategory).sort()

  return (
    <CardContainer className="overflow-x-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Feature Availability Matrix
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          View which features are available in each subscription tier
        </p>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {category}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Feature
                      </th>
                      {TIER_ORDER.map((tier) => (
                        <th
                          key={tier}
                          className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white min-w-[120px]"
                        >
                          {TIER_DISPLAY_NAMES[tier]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featuresByCategory[category].map(({ key, feature }) => (
                      <tr
                        key={key}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {feature.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {feature.description}
                            </div>
                          </div>
                        </td>
                        {TIER_ORDER.map((tier) => {
                          const enabled = isFeatureEnabled(tier, key)
                          return (
                            <td key={tier} className="text-center py-3 px-4">
                              {enabled ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                              ) : (
                                <XCircleIcon className="h-5 w-5 text-gray-300 dark:text-gray-600 mx-auto" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardContainer>
  )
}



