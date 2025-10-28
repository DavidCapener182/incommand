import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.2"
import { PDFDocument, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1"

type InvoicePayload = {
  invoiceId: string
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables for invoice PDF function')
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const payload = (await req.json()) as InvoicePayload
    if (!payload?.invoiceId) {
      return new Response(JSON.stringify({ error: 'invoiceId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', payload.invoiceId)
      .single()

    if (error || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const drawText = (text: string, x: number, y: number, size = 12) => {
      page.drawText(text, { x, y, size, font })
    }

    drawText('Invoice', 50, 800, 20)
    drawText(`Invoice ID: ${invoice.id}`, 50, 770)
    drawText(`Organization: ${invoice.organization_id}`, 50, 750)
    drawText(`Issued: ${invoice.issued_date}`, 50, 730)
    drawText(`Due: ${invoice.due_date ?? 'N/A'}`, 50, 710)
    drawText(`Status: ${invoice.status}`, 50, 690)

    drawText('Line Items:', 50, 660, 14)
    let offset = 640
    for (const item of invoice.line_items ?? []) {
      const description = item.description ?? 'Item'
      const quantity = item.quantity ?? 1
      const price = item.unitPrice ?? item.amount ?? 0
      drawText(`- ${description} (x${quantity}) - £${price}`, 60, offset)
      offset -= 20
      if (offset < 100) {
        offset = 640
      }
    }

    drawText(`Total: £${invoice.total_amount}`, 50, offset - 20, 14)

    const pdfBytes = await pdfDoc.save()

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Invoice PDF error', error)
    return new Response(JSON.stringify({ error: 'Failed to generate invoice PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
