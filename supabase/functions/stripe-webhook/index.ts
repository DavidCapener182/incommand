import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.2"
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno"

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' })

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  const rawBody = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? '', stripeWebhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const organizationId = invoice.metadata?.organization_id
        if (!organizationId) break

        await supabase
          .from('invoices')
          .update({ status: 'paid', payment_reference: invoice.payment_intent ?? invoice.id })
          .eq('id', invoice.metadata?.invoice_id ?? invoice.id)

        await supabase.from('billing_transactions').insert({
          organization_id: organizationId,
          invoice_id: invoice.metadata?.invoice_id ?? null,
          amount: (invoice.amount_paid ?? 0) / 100,
          currency: invoice.currency?.toUpperCase() ?? 'GBP',
          status: 'paid',
          gateway: 'stripe',
          metadata: invoice as unknown as Record<string, unknown>,
        })
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const organizationId = invoice.metadata?.organization_id
        if (!organizationId) break

        await supabase
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('id', invoice.metadata?.invoice_id ?? invoice.id)

        await supabase.from('billing_transactions').insert({
          organization_id: organizationId,
          invoice_id: invoice.metadata?.invoice_id ?? null,
          amount: (invoice.amount_due ?? 0) / 100,
          currency: invoice.currency?.toUpperCase() ?? 'GBP',
          status: 'failed',
          gateway: 'stripe',
          metadata: invoice as unknown as Record<string, unknown>,
        })
        break
      }
      default:
        break
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Stripe webhook processing failed', error)
    return new Response(JSON.stringify({ error: 'Processing error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
