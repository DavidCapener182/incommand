'use client'

import React from 'react'
import { supabase } from '@/lib/supabase'

interface Ticket { id: string; subject: string; status: string; priority: string; company_id?: string | null; created_at?: string }
interface Message { id: string; ticket_id: string; sender_id: string; sender_type: 'user' | 'admin'; message: string; created_at: string; sender?: { full_name?: string; email?: string } }

export default function AdminSupportChat() {
	const [tickets, setTickets] = React.useState<Ticket[]>([])
	const [activeId, setActiveId] = React.useState<string | null>(null)
	const [messages, setMessages] = React.useState<Message[]>([])
	const [input, setInput] = React.useState('')
	const [loading, setLoading] = React.useState(false)

	const loadTickets = React.useCallback(async () => {
		const { data } = await supabase.from('support_tickets').select('id, subject, status, priority, company_id, created_at').order('created_at', { ascending: false })
		setTickets((data as any) || [])
	}, [])

	const loadMessages = React.useCallback(async (ticketId: string) => {
		const { data } = await supabase
			.from('support_messages')
			.select('*, sender:profiles!support_messages_sender_id_fkey(id, full_name, email)')
			.eq('ticket_id', ticketId)
			.order('created_at', { ascending: true })
		setMessages((data as any) || [])
	}, [])

	React.useEffect(() => { loadTickets() }, [loadTickets])
	React.useEffect(() => { if (activeId) loadMessages(activeId) }, [activeId, loadMessages])

	const send = async () => {
		if (!activeId || !input.trim()) return
		setLoading(true)
		try {
			const { data: { user } } = await supabase.auth.getUser()
			await (supabase as any).from('support_messages').insert({ ticket_id: activeId, sender_id: user?.id, sender_type: 'admin', message: input.trim(), is_internal: false })
			setInput('')
			await loadMessages(activeId)
		} finally { setLoading(false) }
	}

	return (
		<div className="flex h-full">
			<aside className="w-64 border-r border-gray-200 dark:border-[#2d437a] overflow-y-auto">
				<div className="p-3 font-semibold text-gray-800 dark:text-white">Support Tickets</div>
				<ul className="space-y-1 p-2">
					{tickets.map(t => (
						<li key={t.id}>
							<button onClick={() => setActiveId(t.id)} className={`w-full text-left px-3 py-2 rounded-lg ${activeId===t.id?'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200':'hover:bg-gray-100 dark:hover:bg-[#1a2a57] text-gray-800 dark:text-gray-200'}`}>
								<div className="text-sm font-medium">{t.subject}</div>
								<div className="text-xs opacity-70 capitalize">{t.status.replace('_',' ')}</div>
							</button>
						</li>
					))}
					{tickets.length===0 && <li className="text-sm text-gray-500 p-3">No tickets</li>}
				</ul>
			</aside>
			<section className="flex-1 flex flex-col min-h-0">
				<div className="flex-1 overflow-y-auto p-4 space-y-3">
					{!activeId ? (
						<div className="h-full flex items-center justify-center text-sm text-gray-500">Select a ticket</div>
					) : (
						messages.map(m => (
							<div key={m.id} className={`flex ${m.sender_type==='admin'?'justify-end':'justify-start'}`}>
								<div className={`max-w-xl px-3 py-2 rounded-lg ${m.sender_type==='admin'?'bg-blue-600 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
									<div className="text-xs opacity-80 mb-1">{m.sender?.full_name || m.sender?.email || (m.sender_type==='admin'?'Admin':'User')}</div>
									<div className="text-sm">{m.message}</div>
									<div className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleString()}</div>
								</div>
							</div>
						))
					)}
				</div>
				<div className="border-t border-gray-200 dark:border-[#2d437a] p-3 flex gap-2">
					<input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') send() }} placeholder={activeId? 'Type a reply…':'Select a ticket to reply'} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white" />
					<button onClick={send} disabled={!activeId || !input.trim() || loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">Send</button>
				</div>
			</section>
		</div>
	)
}


