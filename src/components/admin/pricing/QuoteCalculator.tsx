'use client'

import React, { useState, useMemo } from 'react'
import { CardContainer } from '@/components/ui/CardContainer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  calculateQuote,
  formatCurrency,
  getAllAddOns,
  getAddOnPrice,
  getPlanIncludedFeatures,
  type QuoteInput,
  type QuoteResult,
} from '@/lib/pricing/QuoteCalculator'
import { PRICING_PLANS, PlanCode, getDisplayPrice } from '@/config/PricingConfig'
import {
  CalculatorIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'

const AVAILABLE_ADD_ONS = getAllAddOns()

export default function QuoteCalculator() {
  const [inputs, setInputs] = useState<QuoteInput>({
    basePlan: 'operational',
    eventsPerMonth: 2,
    avgAttendeesPerEvent: 1000,
    staffUsers: 5,
    adminUsers: 2,
    featureAddOns: [],
  })

  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanCode | null>(null)

  // Calculate quote automatically when inputs change
  const calculatedQuote = useMemo(() => {
    return calculateQuote(inputs)
  }, [inputs])

  const basePlanCode = (inputs.basePlan || 'operational') as PlanCode
  const includedFeatures = useMemo(
    () => new Set(getPlanIncludedFeatures(basePlanCode)),
    [basePlanCode],
  )

  const handleCalculate = () => {
    // Recalculate quote from current inputs
    const newQuote = calculateQuote(inputs)
    setQuote(newQuote)
    setShowBreakdown(true)
  }

  const handleInputChange = (field: keyof QuoteInput, value: number | string[]) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddOnToggle = (addOn: string) => {
    setInputs((prev) => {
      const currentAddOns = prev.featureAddOns || []
      const newAddOns = currentAddOns.includes(addOn)
        ? currentAddOns.filter((a) => a !== addOn)
        : [...currentAddOns, addOn]
      return {
        ...prev,
        featureAddOns: newAddOns,
      }
    })
  }

  const handlePlanSelect = (planCode: PlanCode) => {
    const plan = PRICING_PLANS[planCode]
    setSelectedPlan(planCode)
    
    // Auto-populate inputs based on plan limits and set base plan
    setInputs((prev) => {
      const newInputs: QuoteInput = {
        ...prev,
        basePlan: planCode,
        eventsPerMonth: plan.features.maxEvents === -1 
          ? prev.eventsPerMonth 
          : Math.min(prev.eventsPerMonth, plan.features.maxEvents),
        avgAttendeesPerEvent: plan.features.maxAttendees === -1 
          ? prev.avgAttendeesPerEvent 
          : Math.min(prev.avgAttendeesPerEvent, plan.features.maxAttendees),
        staffUsers: plan.features.maxStaff === -1 
          ? prev.staffUsers 
          : Math.min(prev.staffUsers, plan.features.maxStaff),
        adminUsers: plan.features.maxUsers === -1 
          ? prev.adminUsers 
          : Math.min(prev.adminUsers, Math.max(0, plan.features.maxUsers - prev.staffUsers)),
      }
      
      // Get all features including inherited ones from lower-tier plans
      // Inheritance: Operational includes Starter, Command includes Operational+Starter, Enterprise includes all
      const allPlanFeatures = getPlanIncludedFeatures(planCode)
      
      // Match plan features with available add-ons (case-insensitive)
      // This ensures all key features from the plan are highlighted/selected
      const matchingFeatures = allPlanFeatures
        .map(featureName => {
          // Find matching add-on by name (case-insensitive, partial match)
          const matchedAddOn = AVAILABLE_ADD_ONS.find(addOn => {
            const addOnLower = addOn.name.toLowerCase()
            const featureLower = featureName.toLowerCase()
            return addOnLower === featureLower ||
                   addOnLower.includes(featureLower) ||
                   featureLower.includes(addOnLower)
          })
          return matchedAddOn?.name
        })
        .filter((name): name is string => Boolean(name))
      
      // Replace all previous selections with plan features (all matching features are highlighted)
      newInputs.featureAddOns = [...new Set(matchingFeatures)]
      
      return newInputs
    })
  }

  const handleSaveQuote = async () => {
    try {
      const quoteToSave = displayQuote
      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: 'New Prospect', // Can be updated later in CRM
          base_plan: quoteToSave.basePlan,
          recommended_plan: quoteToSave.recommendedPlan,
          events_per_month: inputs.eventsPerMonth,
          avg_attendees_per_event: inputs.avgAttendeesPerEvent,
          staff_users: inputs.staffUsers,
          admin_users: inputs.adminUsers,
          feature_add_ons: inputs.featureAddOns || [],
          monthly_estimate: quoteToSave.monthlyEstimate,
          annual_estimate: quoteToSave.annualEstimate,
          breakdown: quoteToSave.breakdown,
          status: 'draft',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save quote')
      }

      alert('Quote saved successfully! You can view it in the CRM page.')
    } catch (error) {
      console.error('Error saving quote:', error)
      alert('Failed to save quote. Please try again.')
    }
  }

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export functionality coming soon!')
  }

  const handleEmailQuote = () => {
    // TODO: Implement email functionality
    alert('Email quote functionality coming soon!')
  }

  // Always use the latest calculated quote for display (updates automatically when inputs change)
  const displayQuote = calculatedQuote
  const recommendedPlan = PRICING_PLANS[displayQuote.recommendedPlan]

  // Update quote state when Calculate button is clicked (to show breakdown)
  React.useEffect(() => {
    if (quote) {
      // Keep quote state in sync with calculated quote when inputs change
      setQuote(calculatedQuote)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs])

  return (
    <div className="space-y-6">
      <CardContainer>
        <div className="flex items-center gap-3 mb-6">
          <CalculatorIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Quote Calculator
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Generate custom pricing estimates for prospective clients
            </p>
          </div>
        </div>

        {/* Quick Plan Selection */}
        <div className="mb-6">
          <Label className="mb-3 block">Quick Plan Selection</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(PRICING_PLANS).map((plan) => {
              const isSelected = inputs.basePlan === plan.code || selectedPlan === plan.code
              const price = typeof plan.pricing.monthly === 'number' 
                ? getDisplayPrice(plan.code, 'monthly')
                : 'Custom pricing'
              
              return (
                <button
                  key={plan.code}
                  onClick={() => handlePlanSelect(plan.code)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {plan.displayName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {price}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="eventsPerMonth">Events per Month</Label>
                <Input
                  id="eventsPerMonth"
                  type="number"
                  min="1"
                  value={inputs.eventsPerMonth}
                  onChange={(e) =>
                    handleInputChange('eventsPerMonth', parseInt(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="avgAttendeesPerEvent">
                  Average Attendees per Event
                </Label>
                <Input
                  id="avgAttendeesPerEvent"
                  type="number"
                  min="1"
                  value={inputs.avgAttendeesPerEvent}
                  onChange={(e) =>
                    handleInputChange(
                      'avgAttendeesPerEvent',
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="staffUsers">Staff Users</Label>
                <Input
                  id="staffUsers"
                  type="number"
                  min="0"
                  value={inputs.staffUsers}
                  onChange={(e) =>
                    handleInputChange('staffUsers', parseInt(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="adminUsers">Admin Users</Label>
                <Input
                  id="adminUsers"
                  type="number"
                  min="0"
                  value={inputs.adminUsers}
                  onChange={(e) =>
                    handleInputChange('adminUsers', parseInt(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Feature Add-ons */}
            <div className="space-y-3">
              <Label>Feature Add-ons</Label>
              <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2">
                {AVAILABLE_ADD_ONS.map((addOn) => {
                  const isChecked = inputs.featureAddOns?.includes(addOn.name) || false
                  const price = getAddOnPrice(addOn.name)
                  const isIncluded = includedFeatures.has(addOn.name)
                  
                  return (
                    <div
                      key={addOn.name}
                      className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start space-x-3 flex-1">
                        <Checkbox
                          id={`addon-${addOn.name.replace(/\s+/g, '-').toLowerCase()}`}
                          checked={isChecked}
                          onCheckedChange={() => handleAddOnToggle(addOn.name)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`addon-${addOn.name.replace(/\s+/g, '-').toLowerCase()}`}
                            className="text-sm font-medium cursor-pointer block"
                          >
                            {addOn.name}
                          </Label>
                          {addOn.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {addOn.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-3 whitespace-nowrap">
                        {isIncluded ? 'Included' : `${formatCurrency(price)}/mo`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <Button onClick={handleCalculate} className="w-full" size="lg">
              <CalculatorIcon className="h-5 w-5 mr-2" />
              Calculate Quote
            </Button>
          </div>

          {/* Quote Results */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estimated Pricing</CardTitle>
                <CardDescription>
                  Based on your input metrics and scaling multipliers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Base Plan & Recommended Plan */}
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Base Plan:
                      </span>
                      <Badge variant="outline">
                        {PRICING_PLANS[displayQuote.basePlan].displayName}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {getDisplayPrice(displayQuote.basePlan, 'monthly')}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recommended Plan:
                      </span>
                      <Badge variant="default" className="bg-blue-600">
                        {recommendedPlan.displayName}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {recommendedPlan.metadata.description}
                    </p>
                  </div>
                </div>

                {/* Pricing Estimates */}
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      Monthly Estimate:
                    </span>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(displayQuote.monthlyEstimate)}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      Annual Estimate:
                    </span>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(displayQuote.annualEstimate)}
                      </span>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Save {formatCurrency(displayQuote.breakdown.annualDiscount)} with
                        annual billing
                      </p>
                    </div>
                  </div>

                  {/* Price per Event */}
                  {inputs.eventsPerMonth > 0 && (
                    <div className="flex items-baseline justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        Estimated Price per Event:
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(displayQuote.monthlyEstimate / inputs.eventsPerMonth)}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Based on {inputs.eventsPerMonth} event{inputs.eventsPerMonth !== 1 ? 's' : ''} per month
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Breakdown Toggle */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showBreakdown ? 'Hide' : 'Show'} Breakdown
                  </button>

                  {showBreakdown && (
                    <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Base Price ({PRICING_PLANS[displayQuote.basePlan].displayName}):
                          </span>
                          <span className="font-medium">
                            {getDisplayPrice(displayQuote.basePlan, 'monthly')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Events Multiplier ({inputs.eventsPerMonth}/month):
                          </span>
                          <span className="font-medium">
                            ×{displayQuote.breakdown.eventsMultiplier.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Attendees Multiplier ({inputs.avgAttendeesPerEvent.toLocaleString()}):
                          </span>
                          <span className="font-medium">
                            ×{displayQuote.breakdown.attendeesMultiplier.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Staff Multiplier ({inputs.staffUsers + inputs.adminUsers} users):
                          </span>
                          <span className="font-medium">
                            ×{displayQuote.breakdown.staffMultiplier.toFixed(2)}
                          </span>
                        </div>
                        {displayQuote.breakdown.discountFactor < 1.0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Volume Discount ({inputs.eventsPerMonth} events/month):
                            </span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              ×{displayQuote.breakdown.discountFactor.toFixed(2)} ({((1 - displayQuote.breakdown.discountFactor) * 100).toFixed(0)}% off)
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">
                            Composite Multiplier:
                          </span>
                          <span className="font-medium">
                            ×{displayQuote.breakdown.compositeMultiplier.toFixed(2)}
                          </span>
                        </div>
                        {(displayQuote.breakdown.addOnsCost > 0 || (inputs.featureAddOns && inputs.featureAddOns.length > 0)) && (
                          <>
                            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-gray-600 dark:text-gray-400">
                                Add-ons ({inputs.featureAddOns?.length || 0}):
                              </span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                +{formatCurrency(displayQuote.breakdown.addOnsCost)}/mo
                              </span>
                            </div>
                            {inputs.featureAddOns && inputs.featureAddOns.length > 0 && (
                              <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                {inputs.featureAddOns.map((addOn) => {
                                  const addOnPrice = getAddOnPrice(addOn)
                                  return (
                                    <div key={addOn} className="flex justify-between">
                                      <span>• {addOn}</span>
                                      <span>{addOnPrice === 0 ? 'Included' : `${formatCurrency(addOnPrice)}/mo`}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </>
                        )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleSaveQuote}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save to CRM
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportPDF}
                    className="flex items-center gap-2"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleEmailQuote}
                    className="flex items-center gap-2"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    Email Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContainer>
    </div>
  )
}

