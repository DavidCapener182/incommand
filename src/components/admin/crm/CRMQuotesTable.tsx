'use client'

import React, { useState, useEffect } from 'react'
import { CardContainer } from '@/components/ui/CardContainer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/pricing/QuoteCalculator'
import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import QuoteEditDialog from './QuoteEditDialog'

interface Quote {
  id: string
  company_id?: string
  company_name: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  base_plan: string
  recommended_plan: string
  events_per_month: number
  avg_attendees_per_event: number
  staff_users: number
  admin_users: number
  feature_add_ons: string[]
  monthly_estimate: number
  annual_estimate: number
  breakdown: any
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  notes?: string
  follow_up_date?: string
  assigned_to?: string
  created_at: string
  updated_at: string
  expires_at?: string
  companies?: {
    id: string
    name: string
    subscription_plan?: string
  }
}

interface CRMQuotesTableProps {
  initialQuotes: Quote[]
  companies: any[]
}

export default function CRMQuotesTable({ initialQuotes, companies }: CRMQuotesTableProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    // Refresh quotes periodically
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/quotes')
        if (response.ok) {
          const data = await response.json()
          setQuotes(data.quotes || [])
        }
      } catch (error) {
        console.error('Error refreshing quotes:', error)
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return

    try {
      const response = await fetch(`/api/admin/quotes?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setQuotes(quotes.filter((q) => q.id !== id))
      } else {
        alert('Failed to delete quote')
      }
    } catch (error) {
      console.error('Error deleting quote:', error)
      alert('Failed to delete quote')
    }
  }

  const handleStatusChange = async (id: string, newStatus: Quote['status']) => {
    try {
      const response = await fetch('/api/admin/quotes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status: newStatus,
        }),
      })

      if (response.ok) {
        const { quote } = await response.json()
        setQuotes(quotes.map((q) => (q.id === id ? quote : q)))
      } else {
        alert('Failed to update quote status')
      }
    } catch (error) {
      console.error('Error updating quote status:', error)
      alert('Failed to update quote status')
    }
  }

  const filteredQuotes = filterStatus === 'all' 
    ? quotes 
    : quotes.filter((q) => q.status === filterStatus)

  const getStatusBadge = (status: Quote['status']) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Sent' },
      accepted: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rejected' },
      expired: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Expired' },
    }
    const config = statusConfig[status]
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const planColors: Record<string, string> = {
      starter: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      operational: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      command: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      enterprise: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    }
    return (
      <Badge className={planColors[plan] || 'bg-gray-100 text-gray-800'}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    )
  }

  return (
    <>
      <CardContainer>
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</div>
          <div className="flex gap-2">
            {['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#1a2a57]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Monthly Estimate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-gray-700">
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2a57]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {quote.company_name}
                      </div>
                      {quote.companies && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Current Plan: {quote.companies.subscription_plan || 'N/A'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {quote.contact_name || 'N/A'}
                      </div>
                      {quote.contact_email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {quote.contact_email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {getPlanBadge(quote.base_plan)}
                        {quote.recommended_plan !== quote.base_plan && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Recommended: {quote.recommended_plan}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(quote.monthly_estimate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(quote.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(quote.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(quote)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {quote.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(quote.id, 'sent')}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Mark as Sent"
                          >
                            <EnvelopeIcon className="h-4 w-4" />
                          </button>
                        )}
                        {quote.status === 'sent' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(quote.id, 'accepted')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Mark as Accepted"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(quote.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Mark as Rejected"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(quote.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No quotes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContainer>

      {/* Edit Dialog */}
      {selectedQuote && (
        <QuoteEditDialog
          quote={selectedQuote}
          companies={companies}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false)
            setSelectedQuote(null)
          }}
          onSave={(updatedQuote) => {
            setQuotes(quotes.map((q) => (q.id === updatedQuote.id ? updatedQuote : q)))
            setIsEditDialogOpen(false)
            setSelectedQuote(null)
          }}
        />
      )}
    </>
  )
}

