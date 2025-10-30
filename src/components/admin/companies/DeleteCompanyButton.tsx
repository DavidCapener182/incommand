'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteCompanyButton({ id, className = '' }: { id: string; className?: string }) {
	const [deleting, setDeleting] = React.useState(false)
	const router = useRouter()

	const onDelete = async () => {
		if (!confirm('Delete this company? This cannot be undone.')) return
		setDeleting(true)
		try {
			const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' })
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.error || 'Failed to delete')
			router.refresh()
		} finally {
			setDeleting(false)
		}
	}

	return (
		<button type="button" onClick={onDelete} disabled={deleting} className={className}>
			{deleting ? 'Deleting…' : 'Delete'}
		</button>
	)
}


