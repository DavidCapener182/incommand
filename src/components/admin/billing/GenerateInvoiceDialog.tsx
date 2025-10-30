'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

type Company = { id: string; name: string }

export default function GenerateInvoiceDialog({ companies }: { companies: Company[] }) {
	const [open, setOpen] = React.useState(false)
	const [form, setForm] = React.useState({ company_id: '', amount: '', description: '', date: '' })
	const [saving, setSaving] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const router = useRouter()

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSaving(true)
		setError(null)
		try {
			const res = await fetch('/api/billing/invoices', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					company_id: form.company_id,
					amount: Number(form.amount),
					description: form.description,
					date: form.date || undefined,
				})
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.error || 'Failed to create invoice')
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
				<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Generate Invoice</button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Generate Invoice</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-4">
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Company</label>
						<Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
							<SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
							<SelectContent>
								{companies.map(c => (
									<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Amount (£)</label>
						<Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Description</label>
						<Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Date</label>
						<Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
					</div>
					{error && <div className="text-sm text-red-600">{error}</div>}
					<div className="flex justify-end gap-2">
						<Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
						<Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Invoice'}</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}


