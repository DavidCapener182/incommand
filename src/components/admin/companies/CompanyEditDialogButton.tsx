'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { getAllPlans } from '@/config/PricingConfig'

interface Props {
	id: string
	name: string
	plan?: string | null
	status?: string | null
	className?: string
}

export default function CompanyEditDialogButton({ id, name, plan, status, className = '' }: Props) {
	const [open, setOpen] = React.useState(false)
	// Map legacy plans to new ones
	const mapLegacyPlan = (p: string | null | undefined): string => {
		if (!p) return 'starter'
		if (p === 'trial' || p === 'basic') return 'starter'
		if (p === 'premium' || p === 'professional') return 'operational'
		return p
	}
	const [form, setForm] = React.useState({ 
		name: name || '', 
		subscription_plan: mapLegacyPlan(plan), 
		account_status: status || 'active' 
	})
	const [saving, setSaving] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const router = useRouter()
	const plans = getAllPlans()

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSaving(true)
		setError(null)
		try {
			const res = await fetch(`/api/admin/companies/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: form.name, subscription_plan: form.subscription_plan, account_status: form.account_status })
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.error || 'Failed to update company')
			router.refresh()
			setOpen(false)
		} catch (e: any) {
			setError(e.message || 'Unexpected error')
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button type="button" className={className}>Edit</button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Company</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-4">
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Name</label>
						<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Plan</label>
						<Select value={String(form.subscription_plan)} onValueChange={(v) => setForm({ ...form, subscription_plan: v })}>
							<SelectTrigger><SelectValue placeholder="Plan" /></SelectTrigger>
							<SelectContent>
								<SelectItem value="trial">Trial (Legacy)</SelectItem>
								{plans.map((plan) => (
									<SelectItem key={plan.code} value={plan.code}>
										{plan.displayName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Status</label>
						<Select value={String(form.account_status)} onValueChange={(v) => setForm({ ...form, account_status: v })}>
							<SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
							<SelectContent>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="inactive">Inactive</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{error && <div className="text-sm text-red-600">{error}</div>}
					<div className="flex justify-end gap-2">
						<Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
						<Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
