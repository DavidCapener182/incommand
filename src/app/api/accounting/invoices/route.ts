import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { adminApiHandler } from '@/lib/apiSecurity'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { logger } from '@/lib/logger'
import {
  AdminContextUser,
  assertSuperAdmin,
  canManageOrganization,
  isSuperAdmin,
  logAdminAction,
  logAdminAuditEntry,
} from '@/lib/security'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  search: z.string().optional(),
})

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().nonnegative(),
  lineTotal: z.coerce.number().nonnegative().optional(),
})

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  organizationId: z.string().uuid(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.string().optional(),
  subtotal: z.coerce.number().nonnegative().optional(),
  vatRate: z.coerce.number().nonnegative().optional(),
  vatAmount: z.coerce.number().nonnegative().optional(),
  totalAmount: z.coerce.number().nonnegative(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).default([]),
})

const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  id: z.string().uuid(),
  items: z.array(invoiceItemSchema.extend({ id: z.string().uuid().optional() })).optional(),
})

function parseQuery(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  return paginationSchema.parse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    organizationId: searchParams.get('organizationId') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  })
}

function buildSearchFilter(search?: string) {
  if (!search) {
    return undefined
  }

  const sanitized = search.trim().replace(/%/g, '')
  if (!sanitized) {
    return undefined
  }

  return `invoice_number.ilike.%${sanitized}%`
}

function normalizeItemTotals(item: z.infer<typeof invoiceItemSchema>) {
  const quantity = item.quantity ?? 1
  const lineTotal = item.lineTotal ?? item.unitPrice * quantity
  return { ...item, quantity, lineTotal }
}

function deriveTotals(
  invoice: z.infer<typeof createInvoiceSchema>
): { subtotal: number; vatAmount: number | null; total: number } {
  const items = invoice.items?.map(normalizeItemTotals) ?? []
  const subtotal = invoice.subtotal ?? items.reduce((sum, item) => sum + item.lineTotal, 0)
  const vatAmount = invoice.vatAmount ?? (invoice.vatRate ? (subtotal * invoice.vatRate) / 100 : null)
  const total = invoice.totalAmount ?? subtotal + (vatAmount ?? 0)
  return { subtotal, vatAmount, total }
}

export async function GET(request: NextRequest) {
  return adminApiHandler(request, async (supabase, user, req) => {
    const adminUser = user as AdminContextUser
    const { page, pageSize, status, organizationId, search } = parseQuery(req)

    let query = supabase
      .from('inquest_invoices')
      .select(
        `
        id,
        invoice_number,
        status,
        organization_id,
        issue_date,
        due_date,
        subtotal,
        vat_rate,
        vat_amount,
        total_amount,
        payment_terms,
        notes,
        created_at,
        updated_at,
        inquest_invoice_items ( id, description, quantity, unit_price, line_total )
      `,
        { count: 'exact' }
      )

    if (status) {
      query = query.eq('status', status)
    }

    const orgFilter = organizationId ?? adminUser.profile?.company_id ?? null
    if (orgFilter && !isSuperAdmin(adminUser)) {
      query = query.eq('organization_id', orgFilter)
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const searchFilter = buildSearchFilter(search)
    if (searchFilter) {
      query = query.or(searchFilter)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query.order('issue_date', { ascending: false }).range(from, to)

    if (error) {
      logger.error('Failed to fetch invoices', { error })
      return NextResponse.json({ error: 'Unable to fetch invoices' }, { status: 500 })
    }

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? data?.length ?? 0,
      },
    })
  })
}

export async function POST(request: NextRequest) {
  return adminApiHandler(request, async (_supabase, user, req) => {
    const adminUser = user as AdminContextUser
    const body = await req.json().catch(() => null)
    const parsed = createInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    if (!canManageOrganization(adminUser, parsed.data.organizationId)) {
      return NextResponse.json({ error: 'You do not have access to this organization' }, { status: 403 })
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when creating invoice', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    const totals = deriveTotals(parsed.data)
    const payload = {
      invoice_number: parsed.data.invoiceNumber,
      organization_id: parsed.data.organizationId,
      issue_date: parsed.data.issueDate ?? null,
      due_date: parsed.data.dueDate ?? null,
      status: parsed.data.status ?? 'draft',
      subtotal: totals.subtotal,
      vat_rate: parsed.data.vatRate ?? null,
      vat_amount: totals.vatAmount,
      total_amount: totals.total,
      payment_terms: parsed.data.paymentTerms ?? null,
      notes: parsed.data.notes ?? null,
    }

    const { data: invoice, error } = await serviceClient
      .from('inquest_invoices')
      .insert(payload)
      .select()
      .single()

    if (error || !invoice) {
      logger.error('Failed to create invoice', { error })
      return NextResponse.json({ error: 'Unable to create invoice' }, { status: 500 })
    }

    const items = parsed.data.items.map(normalizeItemTotals)
    if (items.length > 0) {
      const itemPayload = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
      }))

      const { error: itemError } = await serviceClient.from('inquest_invoice_items').insert(itemPayload)
      if (itemError) {
        logger.error('Failed to create invoice items, rolling back invoice', { error: itemError })
        await serviceClient.from('inquest_invoices').delete().eq('id', invoice.id)
        return NextResponse.json({ error: 'Unable to create invoice items' }, { status: 500 })
      }
    }

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'accounting.invoices.create',
      details: { invoiceId: invoice.id, itemCount: parsed.data.items.length },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'inquest_invoices',
      recordId: invoice.id,
      actionType: 'create',
      changes: { ...payload, items },
      client: serviceClient,
    })

    return NextResponse.json({ data: { ...invoice, items } })
  })
}

export async function PATCH(request: NextRequest) {
  return adminApiHandler(request, async (_supabase, user, req) => {
    const adminUser = user as AdminContextUser
    const body = await req.json().catch(() => null)
    const parsed = updateInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when updating invoice', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    const { data: existing, error: fetchError } = await serviceClient
      .from('inquest_invoices')
      .select('organization_id')
      .eq('id', parsed.data.id)
      .maybeSingle()

    if (fetchError) {
      logger.error('Failed to load invoice for update', { error: fetchError })
      return NextResponse.json({ error: 'Unable to load invoice' }, { status: 500 })
    }

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!canManageOrganization(adminUser, existing.organization_id)) {
      return NextResponse.json({ error: 'You do not have access to this organization' }, { status: 403 })
    }

    const payload: Record<string, unknown> = {}
    if (parsed.data.invoiceNumber !== undefined) payload.invoice_number = parsed.data.invoiceNumber
    if (parsed.data.status !== undefined) payload.status = parsed.data.status
    if (parsed.data.issueDate !== undefined) payload.issue_date = parsed.data.issueDate ?? null
    if (parsed.data.dueDate !== undefined) payload.due_date = parsed.data.dueDate ?? null
    if (parsed.data.paymentTerms !== undefined) payload.payment_terms = parsed.data.paymentTerms ?? null
    if (parsed.data.notes !== undefined) payload.notes = parsed.data.notes ?? null

    let items: ReturnType<typeof normalizeItemTotals>[] | undefined
    if (parsed.data.items) {
      items = parsed.data.items.map(normalizeItemTotals)
      const subtotal = parsed.data.subtotal ?? items.reduce((sum, item) => sum + item.lineTotal, 0)
      payload.subtotal = subtotal
      if (parsed.data.vatRate !== undefined) {
        payload.vat_rate = parsed.data.vatRate ?? null
      }
      if (parsed.data.vatAmount !== undefined) {
        payload.vat_amount = parsed.data.vatAmount ?? null
      } else if (payload.vat_rate && typeof payload.vat_rate === 'number') {
        payload.vat_amount = (subtotal * payload.vat_rate) / 100
      }
      if (parsed.data.totalAmount !== undefined) {
        payload.total_amount = parsed.data.totalAmount
      } else {
        const vatAmount = (payload.vat_amount as number | null) ?? 0
        payload.total_amount = subtotal + vatAmount
      }
    } else {
      if (parsed.data.subtotal !== undefined) payload.subtotal = parsed.data.subtotal
      if (parsed.data.vatRate !== undefined) payload.vat_rate = parsed.data.vatRate ?? null
      if (parsed.data.vatAmount !== undefined) payload.vat_amount = parsed.data.vatAmount ?? null
      if (parsed.data.totalAmount !== undefined) payload.total_amount = parsed.data.totalAmount
    }

    if (Object.keys(payload).length === 0 && !items) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { error: updateError } = await serviceClient
      .from('inquest_invoices')
      .update(payload)
      .eq('id', parsed.data.id)

    if (updateError) {
      logger.error('Failed to update invoice', { error: updateError })
      return NextResponse.json({ error: 'Unable to update invoice' }, { status: 500 })
    }

    if (items) {
      await serviceClient.from('inquest_invoice_items').delete().eq('invoice_id', parsed.data.id)
      if (items.length > 0) {
        const itemPayload = items.map(item => ({
          invoice_id: parsed.data.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.lineTotal,
        }))
        const { error: insertError } = await serviceClient.from('inquest_invoice_items').insert(itemPayload)
        if (insertError) {
          logger.error('Failed to update invoice items', { error: insertError })
          return NextResponse.json({ error: 'Unable to update invoice items' }, { status: 500 })
        }
      }
    }

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'accounting.invoices.update',
      details: { invoiceId: parsed.data.id, changes: payload },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'inquest_invoices',
      recordId: parsed.data.id,
      actionType: 'update',
      changes: { ...payload, items },
      client: serviceClient,
    })

    return NextResponse.json({ data: { id: parsed.data.id, ...payload, items } })
  })
}

export async function DELETE(request: NextRequest) {
  return adminApiHandler(request, async (_supabase, user, req) => {
    const adminUser = user as AdminContextUser
    try {
      assertSuperAdmin(adminUser)
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 })
    }

    const id = req.nextUrl.searchParams.get('id') || (await req.json().catch(() => ({} as any))).id
    if (!id) {
      return NextResponse.json({ error: 'Invoice id is required' }, { status: 400 })
    }

    let serviceClient
    try {
      serviceClient = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Service client configuration error when deleting invoice', error)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    await serviceClient.from('inquest_invoice_items').delete().eq('invoice_id', id)

    const { error } = await serviceClient.from('inquest_invoices').delete().eq('id', id)

    if (error) {
      logger.error('Failed to delete invoice', { error, id })
      return NextResponse.json({ error: 'Unable to delete invoice' }, { status: 500 })
    }

    await logAdminAction({
      adminId: adminUser.id,
      actionType: 'accounting.invoices.delete',
      details: { invoiceId: id },
      client: serviceClient,
    })

    await logAdminAuditEntry({
      adminId: adminUser.id,
      tableName: 'inquest_invoices',
      recordId: id,
      actionType: 'delete',
      client: serviceClient,
    })

    return NextResponse.json({ success: true })
  })
}
