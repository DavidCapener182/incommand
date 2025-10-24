'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const interestSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().email('Please enter a valid email address.'),
  organisation: z.string().trim().optional(),
  role: z.string().trim().optional(),
})

const roles = [
  'Security',
  'Safety',
  'Medical',
  'Event Operations',
  'Facilities',
  'Command & Control',
  'Compliance',
  'Other',
]

interface RegisterInterestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

interface FormState {
  name: string
  email: string
  organisation: string
  role: string
}

const initialFormState: FormState = {
  name: '',
  email: '',
  organisation: '',
  role: '',
}

export const RegisterInterestModal = ({ open, onOpenChange, className }: RegisterInterestModalProps) => {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!open) {
      setFormState(initialFormState)
      setError(null)
      setIsSubmitting(false)
      setIsComplete(false)
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const parsed = interestSchema.safeParse(formState)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please double check your details and try again.')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = parsed.data
      const { error: insertError } = await supabase.from('interested_users').insert([
        {
          name: payload.name || null,
          email: payload.email,
          organisation: payload.organisation || null,
          role: payload.role || null,
        },
      ])

      if (insertError) {
        throw insertError
      }

      setIsComplete(true)
    } catch (insertErr) {
      console.error('Failed to register interest', insertErr)
      setError('We could not save your interest right now. Please try again shortly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-lg border border-white/20 bg-blue-900/70 text-white backdrop-blur-lg shadow-2xl',
          className,
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Register Your Interest</DialogTitle>
        </DialogHeader>
        {isComplete ? (
          <div className="space-y-4 text-blue-100">
            <p className="text-lg font-semibold text-white">
              Thank you for registering your interest.
            </p>
            <p>
              We&apos;ll notify you as soon as InCommand launches. Keep an eye on your inbox for updates and early access details.
            </p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interest-name" className="text-blue-100">
                  Full name
                </Label>
                <Input
                  id="interest-name"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Alex Smith"
                  className="border-white/20 bg-white/10 text-white placeholder:text-blue-200/70 focus:border-white focus:ring-white/80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest-organisation" className="text-blue-100">
                  Organisation
                </Label>
                <Input
                  id="interest-organisation"
                  value={formState.organisation}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, organisation: event.target.value }))
                  }
                  placeholder="InCommand Events"
                  className="border-white/20 bg-white/10 text-white placeholder:text-blue-200/70 focus:border-white focus:ring-white/80"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest-email" className="text-blue-100">
                Email address<span className="text-red-200">*</span>
              </Label>
              <Input
                id="interest-email"
                type="email"
                required
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="you@company.com"
                className="border-white/20 bg-white/10 text-white placeholder:text-blue-200/70 focus:border-white focus:ring-white/80"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-blue-100">Role or area of interest</Label>
              <Select
                value={formState.role}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="border-white/20 bg-white/10 text-white placeholder:text-blue-200/70 focus:border-white focus:ring-white/80">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="bg-blue-900 text-white">
                  {roles.map((role) => (
                    <SelectItem key={role} value={role} className="focus:bg-blue-700 focus:text-white">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-red-200">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting…' : 'Register interest'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
