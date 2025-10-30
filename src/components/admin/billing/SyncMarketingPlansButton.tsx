'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { defaultMarketingPlans } from '@/data/marketingPlans'
import { useRouter } from 'next/navigation'

export default function SyncMarketingPlansButton() {
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const router = useRouter()

	const onSync = async () => {
		setLoading(true)
		setError(null)
		try {
			for (const p of defaultMarketingPlans) {
				await fetch('/api/billing/plans', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: p.name,
						code: p.code,
						priceMonthly: p.priceMonthly,
						currency: p.currency,
						metadata: { features: p.features },
					})
				})
			}
			router.refresh()
		} catch (e: any) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex items-center gap-3">
			<Button onClick={onSync} disabled={loading}>
				{loading ? 'Syncing…' : 'Save defaults as plans'}
			</Button>
			{error && <span className="text-sm text-red-600">{error}</span>}
		</div>
	)
}


