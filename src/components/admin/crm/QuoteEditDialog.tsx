'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
}

interface QuoteEditDialogProps {
  quote: Quote
  companies: any[]
  isOpen: boolean
  onClose: () => void
  onSave: (quote: Quote) => void
}

export default function QuoteEditDialog({
  quote,
  companies,
  isOpen,
  onClose,
  onSave,
}: QuoteEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Quote>>(quote)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/quotes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: quote.id,
          ...formData,
        }),
      })

      if (response.ok) {
        const { quote: updatedQuote } = await response.json()
        onSave(updatedQuote)
      } else {
        alert('Failed to update quote')
      }
    } catch (error) {
      console.error('Error updating quote:', error)
      alert('Failed to update quote')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Company Selection */}
          <div>
            <Label htmlFor="company_id">Company</Label>
            <Select
              value={formData.company_id || ''}
              onValueChange={(value) =>
                setFormData({ ...formData, company_id: value || undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company or leave blank for new prospect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">New Prospect</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Name */}
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.company_name || ''}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, contact_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone || ''}
              onChange={(e) =>
                setFormData({ ...formData, contact_phone: e.target.value })
              }
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || 'draft'}
              onValueChange={(value: Quote['status']) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Follow-up Date */}
          <div>
            <Label htmlFor="follow_up_date">Follow-up Date</Label>
            <Input
              id="follow_up_date"
              type="datetime-local"
              value={
                formData.follow_up_date
                  ? new Date(formData.follow_up_date).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  follow_up_date: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
            />
          </div>

          {/* Pricing Summary */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Pricing Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Monthly Estimate:</span>
                <span className="ml-2 font-semibold">£{quote.monthly_estimate.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Annual Estimate:</span>
                <span className="ml-2 font-semibold">£{quote.annual_estimate.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Base Plan:</span>
                <span className="ml-2 font-semibold capitalize">{quote.base_plan}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Recommended Plan:</span>
                <span className="ml-2 font-semibold capitalize">{quote.recommended_plan}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

