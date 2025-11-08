import { getAllPlans, type Plan } from '@/config/PricingConfig'

export type MarketingPlan = {
	name: string
	priceMonthly: number
	currency: 'GBP'
	features: string[]
	code: string
}

/**
 * Convert Plan to MarketingPlan format for backward compatibility
 */
function planToMarketingPlan(plan: Plan): MarketingPlan {
	const price = typeof plan.pricing.monthly === 'number' ? plan.pricing.monthly : 0
	return {
		name: plan.displayName,
		priceMonthly: price,
		currency: plan.pricing.currency,
		code: plan.code,
		features: plan.features.features,
	}
}

/**
 * Default marketing plans derived from PricingConfig
 * Maintains backward compatibility while using centralized config
 */
export const defaultMarketingPlans: MarketingPlan[] = getAllPlans()
	.filter(plan => plan.code !== 'enterprise' || plan.pricing.monthly !== 'custom')
	.map(planToMarketingPlan)


