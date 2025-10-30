export type MarketingPlan = {
	name: string
	priceMonthly: number
	currency: 'GBP'
	features: string[]
	code: string
}

export const defaultMarketingPlans: MarketingPlan[] = [
	{
		name: 'Starter',
		priceMonthly: 25,
		currency: 'GBP',
		code: 'starter',
		features: [
			'Up to 50 incidents per month',
			'5 staff members',
			'Basic analytics',
			'Email support',
			'Mobile app access',
			'Event dashboard',
		],
	},
	{
		name: 'Professional',
		priceMonthly: 75,
		currency: 'GBP',
		code: 'professional',
		features: [
			'Unlimited incidents',
			'20 staff members',
			'AI-powered insights',
			'Advanced analytics',
			'Priority support',
			'Custom branding',
			'API access',
		],
	},
	{
		name: 'Enterprise',
		priceMonthly: 200,
		currency: 'GBP',
		code: 'enterprise',
		features: [
			'Everything in Professional',
			'Unlimited staff members',
			'Dedicated account manager',
			'Custom integrations',
			'SLA guarantee (99.9%)',
			'Advanced security suite',
			'White-label options',
		],
	},
]


