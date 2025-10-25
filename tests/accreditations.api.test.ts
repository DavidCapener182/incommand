import type { POST as CreateAccreditationHandler } from '@/app/api/accreditations/route'
import type { PATCH as CompleteInductionHandler } from '@/app/api/accreditations/[token]/route'

require('cross-fetch/polyfill')

const OriginalResponse = globalThis.Response
class PatchedResponse extends OriginalResponse {
  static json(body: unknown, init?: ResponseInit) {
    return new OriginalResponse(JSON.stringify(body), {
      status: init?.status ?? 200,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers || {})
      }
    })
  }
}

globalThis.Response = PatchedResponse as typeof Response

jest.mock('@/lib/supabaseServer', () => ({
  getServiceSupabaseClient: jest.fn()
}))

jest.mock('@/lib/notifications/emailService', () => ({
  emailService: {
    send: jest.fn()
  }
}))

jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: unknown, init?: ResponseInit) =>
        new Response(JSON.stringify(body), {
          status: init?.status ?? 200,
          headers: { 'content-type': 'application/json' }
        })
    }
  }
})

const { getServiceSupabaseClient } = require('@/lib/supabaseServer') as { getServiceSupabaseClient: jest.Mock }
const { emailService } = require('@/lib/notifications/emailService') as { emailService: { send: jest.Mock } }
const { POST: createAccreditation } = require('@/app/api/accreditations/route') as { POST: typeof CreateAccreditationHandler }
const { PATCH: completeInduction } = require('@/app/api/accreditations/[token]/route') as { PATCH: typeof CompleteInductionHandler }

const BASE_URL = 'https://example.com'

const buildRequest = (url: string, init: RequestInit) => new Request(url, init)

describe('Accreditation API routes', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, NEXT_PUBLIC_APP_URL: BASE_URL }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns validation error for incomplete payload', async () => {
    const response = await createAccreditation(
      buildRequest(`${BASE_URL}/api/accreditations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  it('creates accreditation, sends induction email, and logs event', async () => {
    const vendorRecord = { id: 'vendor-1', business_name: 'Vendor Inc.' }
    const accreditationRecord = { id: 'accreditation-1', vendor_id: 'vendor-1', induction_token: 'token-123' }

    const vendorInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: vendorRecord, error: null })
      })
    })

    const accreditationInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: accreditationRecord, error: null })
      })
    })

    const accessJoinInsert = jest.fn().mockResolvedValue({ error: null })
    const inductionEventInsert = jest.fn().mockResolvedValue({ error: null })

    const supabase = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'vendors':
            return { insert: vendorInsert }
          case 'vendor_accreditations':
            return { insert: accreditationInsert }
          case 'vendor_accreditation_access_levels':
            return { insert: accessJoinInsert }
          case 'vendor_induction_events':
            return { insert: inductionEventInsert }
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      })
    }

    getServiceSupabaseClient.mockReturnValue(supabase)
    emailService.send.mockResolvedValue(true)

    const now = new Date().toISOString()
    const response = await createAccreditation(
      buildRequest(`${BASE_URL}/api/accreditations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: 'Vendor Inc.',
          contact_email: 'vendor@example.com',
          access_level_ids: ['00000000-0000-0000-0000-000000000001'],
          reportData: {
            event: { name: 'Test Event', event_date: now, venue_name: 'Main Arena' },
            incidents: { total: 1, resolved: 1, open: 0, avgResponseTime: 6 },
            staff: { assignedPositions: 5, radioSignouts: 2, efficiencyScore: 95 },
            lessonsLearned: { strengths: [], improvements: [], recommendations: [] },
            aiInsights: 'Summary'
          }
        })
      })
    )

    expect(response.status).toBe(201)
    expect(vendorInsert).toHaveBeenCalled()
    expect(accreditationInsert).toHaveBeenCalled()
    expect(accessJoinInsert).toHaveBeenCalledWith([{ accreditation_id: 'accreditation-1', access_level_id: '00000000-0000-0000-0000-000000000001' }])
    expect(inductionEventInsert).toHaveBeenCalledWith({ accreditation_id: 'accreditation-1', event_type: 'email_sent' })
    expect(emailService.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'vendor@example.com' }))
  })

  it('blocks induction completion when status is already processed', async () => {
    const selectSingle = jest.fn().mockResolvedValue({ data: { id: 'accreditation-1', status: 'approved' }, error: null })
    const selectEq = jest.fn().mockReturnValue({ single: selectSingle })

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'vendor_accreditations') {
          return { select: jest.fn().mockReturnValue({ eq: selectEq }) }
        }
        if (table === 'vendor_induction_events') {
          return { insert: jest.fn() }
        }
        throw new Error(`Unexpected table ${table}`)
      })
    }

    getServiceSupabaseClient.mockReturnValue(supabase)

    const response = await completeInduction(
      buildRequest(`${BASE_URL}/api/accreditations/token-123`, { method: 'PATCH' }),
      { params: { token: 'token-123' } }
    )

    expect(response.status).toBe(409)
    expect(selectEq).toHaveBeenCalledWith('induction_token', 'token-123')
  })

  it('marks induction complete and logs event', async () => {
    const selectSingle = jest.fn().mockResolvedValue({ data: { id: 'accreditation-1', status: 'new' }, error: null })
    const selectEq = jest.fn().mockReturnValue({ single: selectSingle })

    const updateEq = jest.fn().mockResolvedValue({ error: null })
    const accreditationUpdate = jest.fn().mockReturnValue({ eq: updateEq })
    const inductionEventInsert = jest.fn().mockResolvedValue({ error: null })

    const supabase = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'vendor_accreditations':
            return {
              select: jest.fn().mockReturnValue({ eq: selectEq }),
              update: accreditationUpdate
            }
          case 'vendor_induction_events':
            return { insert: inductionEventInsert }
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      })
    }

    getServiceSupabaseClient.mockReturnValue(supabase)

    const response = await completeInduction(
      buildRequest(`${BASE_URL}/api/accreditations/token-123`, { method: 'PATCH' }),
      { params: { token: 'token-123' } }
    )

    expect(response.status).toBe(200)
    expect(selectEq).toHaveBeenCalledWith('induction_token', 'token-123')
    expect(accreditationUpdate).toHaveBeenCalledWith({
      status: 'pending_review',
      induction_completed: true,
      induction_completed_at: expect.any(String)
    })
    expect(updateEq).toHaveBeenCalledWith('id', 'accreditation-1')
    expect(inductionEventInsert).toHaveBeenCalledWith({
      accreditation_id: 'accreditation-1',
      event_type: 'completed',
      ip_address: null,
      user_agent: null
    })
  })
})
