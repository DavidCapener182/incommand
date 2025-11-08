'use client'

import React, { useState, useEffect } from 'react'
import { CardContainer } from '@/components/ui/CardContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { getAllPlans } from '@/config/PricingConfig'
import { 
  CurrencyDollarIcon, 
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Plan {
  id: string
  code: string
  displayName: string
  version: string
  effectiveAt: string
  currency: string
  priceMonthly: number | null
  priceAnnual: number | null
  billingCycles: string[]
  features: {
    maxEvents: number
    maxAttendees: number
    maxUsers: number
    maxStaff: number
    features: string[]
    addOns: string[]
  }
  metadata: {
    description?: string
    popular?: boolean
  }
  isActive: boolean
  deprecated: boolean
}

export default function PricingPlansManager() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Plan>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/pricing', {
        credentials: 'include', // Ensure cookies are sent
      })
      
      if (!res.ok) {
        // If API fails, fall back to config-based plans
        const errorData = await res.json().catch(() => ({}))
        console.warn('API failed, using config-based plans:', errorData.error || res.statusText)
        
        // Fallback to config plans
        const configPlans = getAllPlans()
        const fallbackPlans = configPlans.map(plan => ({
          id: plan.code,
          code: plan.code,
          displayName: plan.displayName,
          version: plan.metadata.version,
          effectiveAt: plan.metadata.effectiveAt,
          currency: plan.pricing.currency,
          priceMonthly: typeof plan.pricing.monthly === 'number' ? plan.pricing.monthly : null,
          priceAnnual: typeof plan.pricing.annual === 'number' ? plan.pricing.annual : null,
          billingCycles: plan.pricing.billingCycles,
          features: plan.features,
          metadata: plan.metadata,
          isActive: true,
          deprecated: false,
        }))
        
        setPlans(fallbackPlans)
        setError('Using default plans from configuration. Database plans unavailable.')
        return
      }
      
      const data = await res.json()
      setPlans(data.plans || [])
      setError(null)
    } catch (err: any) {
      console.error('Error loading plans:', err)
      
      // Fallback to config plans on any error
      const configPlans = getAllPlans()
      const fallbackPlans = configPlans.map(plan => ({
        id: plan.code,
        code: plan.code,
        displayName: plan.displayName,
        version: plan.metadata.version,
        effectiveAt: plan.metadata.effectiveAt,
        currency: plan.pricing.currency,
        priceMonthly: typeof plan.pricing.monthly === 'number' ? plan.pricing.monthly : null,
        priceAnnual: typeof plan.pricing.annual === 'number' ? plan.pricing.annual : null,
        billingCycles: plan.pricing.billingCycles,
        features: plan.features,
        metadata: plan.metadata,
        isActive: true,
        deprecated: false,
      }))
      
      setPlans(fallbackPlans)
      setError('Using default plans from configuration. ' + (err.message || 'Unable to load plans from database.'))
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan.code)
    setEditForm({
      priceMonthly: plan.priceMonthly,
      priceAnnual: plan.priceAnnual,
      currency: plan.currency,
      billingCycles: plan.billingCycles,
      isActive: plan.isActive,
      deprecated: plan.deprecated,
    })
  }

  const cancelEdit = () => {
    setEditingPlan(null)
    setEditForm({})
  }

  const savePlan = async (code: string) => {
    try {
      setSaving(true)
      setError(null)

      const res = await fetch('/api/admin/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          ...editForm,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update plan')
      }

      await loadPlans()
      setEditingPlan(null)
      setEditForm({})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number | null | 'custom') => {
    if (price === null || price === 'custom') return 'Custom pricing'
    return `£${price.toFixed(2)}`
  }

  if (loading) {
    return <div className="text-center py-12">Loading plans...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {error}
            {error.includes('default plans') && (
              <span className="block mt-1 text-xs">
                Plans are loaded from configuration. Run the database migration to enable database-backed pricing management.
              </span>
            )}
          </p>
        </div>
      )}

      {plans.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">No plans available</p>
        </div>
      )}

      {plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => {
          const isEditing = editingPlan === plan.code
          const isCustom = plan.priceMonthly === null

          return (
            <CardContainer key={plan.code} className="relative">
              {/* Popular Badge */}
              {plan.metadata.popular && (
                <Badge className="absolute top-4 right-4 bg-blue-600 text-white">
                  Popular
                </Badge>
              )}

              <div className="space-y-4">
                {/* Header */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {plan.displayName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {plan.metadata.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {plan.deprecated && (
                      <Badge variant="destructive">Deprecated</Badge>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label>Monthly Price (£)</Label>
                      <Input
                        type="number"
                        value={editForm.priceMonthly ?? ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            priceMonthly: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder="Enter monthly price"
                      />
                    </div>
                    <div>
                      <Label>Annual Price (£)</Label>
                      <Input
                        type="number"
                        value={editForm.priceAnnual ?? ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            priceAnnual: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder="Enter annual price"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editForm.isActive ?? true}
                        onCheckedChange={(checked) =>
                          setEditForm({ ...editForm, isActive: checked })
                        }
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(plan.priceMonthly)}
                      </span>
                      {!isCustom && (
                        <span className="text-sm text-gray-600 dark:text-gray-300">/month</span>
                      )}
                    </div>
                    {plan.priceAnnual && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {formatPrice(plan.priceAnnual)}/year
                      </p>
                    )}
                  </div>
                )}

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Limits:</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Events:</span>
                      <span className="font-medium">
                        {plan.features.maxEvents === -1 ? 'Unlimited' : plan.features.maxEvents}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Attendees:</span>
                      <span className="font-medium">
                        {plan.features.maxAttendees === -1 ? 'Unlimited' : plan.features.maxAttendees.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Users:</span>
                      <span className="font-medium">
                        {plan.features.maxUsers === -1 ? 'Unlimited' : plan.features.maxUsers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Staff:</span>
                      <span className="font-medium">
                        {plan.features.maxStaff === -1 ? 'Unlimited' : plan.features.maxStaff}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Key Features:</h4>
                  <ul className="space-y-1">
                    {plan.features.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.features.features.length > 5 && (
                      <li className="text-xs text-gray-500 dark:text-gray-400">
                        +{plan.features.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Version Info */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Version {plan.version} • Effective {new Date(plan.effectiveAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => savePlan(plan.code)}
                        disabled={saving}
                        className="flex-1"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(plan)}
                      className="w-full"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit Pricing
                    </Button>
                  )}
                </div>
              </div>
            </CardContainer>
          )
        })}
        </div>
      )}
    </div>
  )
}

