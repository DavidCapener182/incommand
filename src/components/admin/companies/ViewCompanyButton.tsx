'use client'

import React from 'react'

interface ViewCompanyButtonProps {
	companyId: string
	className?: string
}

export default function ViewCompanyButton({ companyId, className = '' }: ViewCompanyButtonProps) {
	const [open, setOpen] = React.useState(false)
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const [company, setCompany] = React.useState<any>(null)

	const onOpen = async () => {
		setOpen(true)
		setLoading(true)
		setError(null)
		try {
			const res = await fetch(`/api/admin/companies/${companyId}`)
			const json = await res.json()
			if (!res.ok) throw new Error(json.error || 'Failed to load company')
			setCompany(json.company)
		} catch (e: any) {
			setError(e.message || 'Unexpected error')
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<button type="button" onClick={onOpen} className={className}>
				View
			</button>
			{open && (
				<div className="fixed inset-0 z-[10000] flex items-center justify-center">
					<div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
					<div className="relative bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] shadow-lg w-[min(90vw,600px)] p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white">Company</h2>
							<button type="button" className="text-gray-500 hover:text-gray-700 dark:text-gray-300" onClick={() => setOpen(false)}>✕</button>
						</div>
						{loading ? (
							<div className="py-8 text-center text-gray-600 dark:text-gray-300">Loading…</div>
						) : error ? (
							<div className="py-4 text-red-600">{error}</div>
						) : company ? (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-500 dark:text-gray-300">Name</span>
									<span className="text-gray-900 dark:text-white">{company.name}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-500 dark:text-gray-300">Plan</span>
									<span className="capitalize">{company.subscription_plan || 'trial'}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-500 dark:text-gray-300">Status</span>
									<span className="capitalize">{company.account_status || 'active'}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-500 dark:text-gray-300">Created</span>
									<span>{company.created_at ? new Date(company.created_at).toLocaleString() : 'N/A'}</span>
								</div>
							</div>
						) : null}
					</div>
				</div>
			)}
		</>
	)
}


