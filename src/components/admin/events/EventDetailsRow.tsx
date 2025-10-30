'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface Props {
	event: any
}

export default function EventDetailsRow({ event }: Props) {
	const [open, setOpen] = React.useState(false)
	const [details, setDetails] = React.useState<any>(null)
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	const load = async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await fetch(`/api/admin/events/${event.id}`)
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.error || 'Failed to load event')
			setDetails(json.event)
		} catch (e: any) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v && !details) void load() }}>
			<SheetTrigger asChild>
				<div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg cursor-pointer">
					<div>
						<h3 className="text-sm font-medium text-gray-900 dark:text-white">{event.event_name}</h3>
						<p className="text-sm text-gray-500 dark:text-gray-300">{event.companies?.name} • {event.event_type}</p>
					</div>
					<div className="text-sm text-gray-500 dark:text-gray-300">{event.created_at ? new Date(event.created_at).toLocaleDateString() : 'N/A'}</div>
				</div>
			</SheetTrigger>
			<SheetContent side="right" className="w-[min(92vw,480px)]">
				<SheetHeader>
					<SheetTitle>Event Details</SheetTitle>
				</SheetHeader>
				{loading ? (
					<div className="py-8 text-center text-gray-600 dark:text-gray-300">Loading…</div>
				) : error ? (
					<div className="py-4 text-red-600">{error}</div>
				) : details ? (
					<div className="space-y-2 mt-4 text-sm">
						<div className="flex justify-between"><span className="text-gray-500">Name</span><span>{details.event_name}</span></div>
						<div className="flex justify-between"><span className="text-gray-500">Type</span><span>{details.event_type}</span></div>
						<div className="flex justify-between"><span className="text-gray-500">Company</span><span>{details.companies?.name || '—'}</span></div>
						<div className="flex justify-between"><span className="text-gray-500">Created</span><span>{details.created_at ? new Date(details.created_at).toLocaleString() : 'N/A'}</span></div>
					</div>
				) : null}
			</SheetContent>
		</Sheet>
	)
}


