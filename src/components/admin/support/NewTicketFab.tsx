'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Props {
	companies: { id: string; name: string }[]
}

export default function NewTicketFab({ companies }: Props) {
	const [open, setOpen] = React.useState(false)
	const [saving, setSaving] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const [form, setForm] = React.useState({ company_id: '', priority: 'normal', title: '', description: '' })
	const router = useRouter()

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSaving(true)
		setError(null)
		try {
			const res = await fetch('/api/support/tickets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.error || 'Failed to create ticket')
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
				<button type="button" className="fixed right-6 z-40 bg-blue-600 text-white rounded-full w-12 h-12 shadow-lg hover:bg-blue-700"
					style={{ bottom: 'max(env(safe-area-inset-bottom), 6rem)' }}
				>
					+
				</button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New Support Ticket</DialogTitle>
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
						<label className="text-sm text-gray-600 dark:text-gray-300">Priority</label>
						<Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
							<SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
							<SelectContent>
								<SelectItem value="low">Low</SelectItem>
								<SelectItem value="normal">Normal</SelectItem>
								<SelectItem value="high">High</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Subject</label>
						<Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Description</label>
						<Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required />
					</div>
					{error && <div className="text-sm text-red-600">{error}</div>}
					<div className="flex justify-end gap-2">
						<Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
						<Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Ticket'}</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}


