'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function NewContentDialog() {
	const [open, setOpen] = React.useState(false)
	const [type, setType] = React.useState<'blog' | 'documentation' | 'announcement'>('blog')
	const [title, setTitle] = React.useState('')
	const [slug, setSlug] = React.useState('')
	const [content, setContent] = React.useState('')
	const [saving, setSaving] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const router = useRouter()

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSaving(true)
		setError(null)
		try {
			const res = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type, title, slug, content, status: 'draft' })
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.error || 'Failed to create content')
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
				<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Create Content</button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New Content</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-4">
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Type</label>
						<Select value={type} onValueChange={(v) => setType(v as any)}>
							<SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
							<SelectContent>
								<SelectItem value="blog">Blog</SelectItem>
								<SelectItem value="documentation">Documentation</SelectItem>
								<SelectItem value="announcement">Announcement</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Title</label>
						<Input value={title} onChange={(e) => setTitle(e.target.value)} required />
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Slug</label>
						<Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-article" />
					</div>
					<div>
						<label className="text-sm text-gray-600 dark:text-gray-300">Content</label>
						<Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
					</div>
					{error && <div className="text-sm text-red-600">{error}</div>}
					<div className="flex justify-end gap-2">
						<button type="button" className="px-3 py-2 rounded-md border border-gray-300 dark:border-[#2d437a]" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
						<Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}


