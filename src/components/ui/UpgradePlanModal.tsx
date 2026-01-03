'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlanCode } from '@/config/PricingConfig'
import { getPlanDisplayName } from '@/lib/featureAccess'
import { Lock, Sparkles, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface UpgradePlanModalProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
  requiredPlan: PlanCode
  onUpgrade?: () => void
}

export function UpgradePlanModal({
  isOpen,
  onClose,
  featureName,
  requiredPlan,
  onUpgrade,
}: UpgradePlanModalProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      // Default behavior: navigate to pricing page
      window.location.href = '/pricing'
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">{featureName} is locked</DialogTitle>
              <DialogDescription className="mt-1">
                This feature requires a higher subscription tier
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>{featureName}</strong> is available on the{' '}
            <strong className="text-gray-900 dark:text-white">
              {getPlanDisplayName(requiredPlan)}
            </strong>{' '}
            plan or higher.
          </p>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Upgrade your subscription to unlock this feature and access additional capabilities.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpgrade} className="bg-blue-600 hover:bg-blue-700">
            View Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Inline upgrade card component for displaying upgrade prompts within gated features
 */
interface UpgradeFeatureCardProps {
  featureName: string
  requiredPlan: PlanCode
  description?: string
  onUpgrade?: () => void
  variant?: 'card' | 'banner' | 'compact'
  className?: string
}

export function UpgradeFeatureCard({
  featureName,
  requiredPlan,
  description,
  onUpgrade,
  variant = 'card',
  className = '',
}: UpgradeFeatureCardProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      window.location.href = '/pricing'
    }
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {featureName} requires {getPlanDisplayName(requiredPlan)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description || `Upgrade to unlock ${featureName} and access more powerful features.`}
              </p>
            </div>
          </div>
          <Button onClick={handleUpgrade} size="sm" className="bg-blue-600 hover:bg-blue-700">
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{featureName}</strong> requires{' '}
              <strong>{getPlanDisplayName(requiredPlan)}</strong>
            </span>
          </div>
          <Button onClick={handleUpgrade} size="sm" variant="outline">
            Upgrade
          </Button>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <Card className={`border-2 border-dashed border-gray-300 dark:border-gray-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
            <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{featureName} is locked</CardTitle>
            <CardDescription className="mt-1">
              Available on {getPlanDisplayName(requiredPlan)} plan or higher
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {description || `Upgrade to ${getPlanDisplayName(requiredPlan)} to unlock ${featureName} and access additional powerful features.`}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Sparkles className="h-4 w-4" />
          <span>Unlock more features with a higher tier</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpgrade} className="w-full bg-blue-600 hover:bg-blue-700">
          View Plans & Upgrade
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
