'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function CreatePlanDialog() {
	const [open, setOpen] = React.useState(false)
	const [form, setForm] = React.useState({ name: '', code: '', priceMonthly: '', currency: 'GBP' })
	const [saving, setSaving] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const router = useRouter()

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSaving(true)
		setError(null)
		try {
			const res = await fetch('/api/billing/plans', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: form.name,
					code: form.code,
					priceMonthly: Number(form.priceMonthly),
					currency: form.currency,
				})
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.error || 'Failed to create plan')
			setOpen(false)
			router.refresh()
		} catch (e: any) {
			setError(e.message)
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Create Plan</button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Plan</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-4">
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Name</label>
						<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Code</label>
						<Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Price / month (£)</label>
						<Input type="number" min="0" step="0.01" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} required />
					</div>
					{error && <div className="text-sm text-red-600">{error}</div>}
					<div className="flex justify-end gap-2">
						<Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
						<Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create'}</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}


