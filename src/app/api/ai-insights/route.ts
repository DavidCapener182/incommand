import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit } from '@/lib/rateLimit';
import { validateRequest, schemas } from '@/lib/validation';
import { sanitize } from '@/lib/sanitize';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Input validation schema for AI insights
const aiInsightsInputSchema = schemas.ai.aiInsights.extend({
  incidents: schemas.common.nonNegativeInt.array().optional(),
  attendance: schemas.common.nonNegativeInt.array().optional(),
});

function getHourKey(date: Date): string {
  // Returns a string like '2024-07-25T14:00:00Z' for the hour
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

async function getEventTimings(eventId: string) {
  // Create server-side supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Fetch security_call_time and curfew_time for the event
  const { data, error } = await supabase
    .from('events')
    .select('security_call_time, curfew_time, event_date')
    .eq('id', eventId)
    .single();
  if (error || !data) return null;
  return data;
}

function isWithinWindow(
  now: Date,
  eventDate: string,
  securityCall: string,
  curfew: string
): boolean {
  // eventDate: 'YYYY-MM-DD', securityCall/curfew: 'HH:mm'
  if (!eventDate || !securityCall || !curfew) return false;
  const eventDay = eventDate.split('T')[0];
  const secCall = new Date(`${eventDay}T${securityCall}:00Z`);
  const curfewTime = new Date(`${eventDay}T${curfew}:00Z`);
  const start = new Date(secCall.getTime() - 60 * 60 * 1000); // 1 hour before
  const end = new Date(curfewTime.getTime() + 60 * 60 * 1000); // 1 hour after
  return now >= start && now <= end;
}

async function handleAIInsights(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = validateRequest(aiInsightsInputSchema, body, 'ai-insights');
    
    if (!validation.success) {
      logger.warn('AI insights validation failed', {
        component: 'AIInsightsAPI',
        action: 'POST',
        errors: validation.errors
      });
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validation.errors 
      }, { status: 400 });
    }

    const { eventId, incidents = [], attendance = [] } = validation.data;

    // Create server-side supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get event timings
    const timings = await getEventTimings(eventId);
    if (!timings) {
      logger.warn('Event timings not found', {
        component: 'AIInsightsAPI',
        action: 'POST',
        eventId
      });
      return NextResponse.json({ error: 'Event timings not found' }, { status: 400 });
    }

    const now = new Date();
    const hourKey = getHourKey(now);

    // Check if within allowed window
    if (!isWithinWindow(now, timings.event_date, timings.security_call_time, timings.curfew_time)) {
      logger.warn('AI insights requested outside event window', {
        component: 'AIInsightsAPI',
        action: 'POST',
        eventId,
        currentTime: now.toISOString(),
        eventDate: timings.event_date,
        securityCall: timings.security_call_time,
        curfew: timings.curfew_time
      });
      return NextResponse.json({ error: 'AI Insights only available during event window.' }, { status: 403 });
    }

    // Check cache
    const { data: cached, error: cacheError } = await supabase
      .from('ai_insights_cache')
      .select('insights, updated_at')
      .eq('event_id', eventId)
      .eq('hour', hourKey)
      .single();
    
    if (cached && cached.insights) {
      logger.debug('Returning cached AI insights', {
        component: 'AIInsightsAPI',
        action: 'POST',
        eventId,
        hourKey
      });
      return NextResponse.json({ insights: cached.insights, cached: true });
    }

    // Sanitize input data before sending to AI
    const sanitizedIncidents = incidents.map((incident: any) => 
      typeof incident === 'string' ? sanitize(incident) : incident
    );
    const sanitizedAttendance = attendance.map((record: any) => 
      typeof record === 'string' ? sanitize(record) : record
    );

    // Prepare prompts for multiple insights
    const prompts = [
      `Summarize the most important incidents for this event: ${JSON.stringify(sanitizedIncidents)}`,
      `What trends or patterns can you identify from these incidents: ${JSON.stringify(sanitizedIncidents)}`,
      `Based on the attendance data, what can you infer about crowd flow and surges? ${JSON.stringify(sanitizedAttendance)}`,
      `Are there any recommendations for the event team based on these incidents and attendance? ${JSON.stringify(sanitizedIncidents)} ${JSON.stringify(sanitizedAttendance)}`
    ];

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    let totalTokens = 0;
    let totalCost = 0;
    
    const completions = await Promise.all(prompts.map(async (prompt) => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      });
      // Estimate tokens and cost (gpt-3.5-turbo: $0.50/1M input, $1.50/1M output)
      const usage = completion.usage || { total_tokens: 150 };
      totalTokens += usage.total_tokens;
      totalCost += (usage.total_tokens / 1000000) * 1.5; // rough output cost only
      return completion.choices[0]?.message?.content || 'No insight generated.';
    }));

    // Cache the result
    await supabase.from('ai_insights_cache').upsert({
      event_id: eventId,
      hour: hourKey,
      insights: completions,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'event_id, hour' });

    // Log usage
    try {
      await supabase.from('ai_usage').insert({
        event_id: eventId,
        endpoint: '/api/ai-insights',
        model: 'gpt-3.5-turbo',
        tokens_used: totalTokens,
        cost_usd: totalCost,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      logger.error('Failed to log AI usage', logError, {
        component: 'AIInsightsAPI',
        action: 'POST',
        eventId
      });
    }

    logger.info('AI insights generated successfully', {
      component: 'AIInsightsAPI',
      action: 'POST',
      eventId,
      totalTokens,
      totalCost
    });

    return NextResponse.json({ insights: completions, cached: false });
  } catch (error) {
    logger.error('AI Insights error', error, {
      component: 'AIInsightsAPI',
      action: 'POST'
    });
    return NextResponse.json({ error: 'Failed to generate AI insight.' }, { status: 500 });
  }
}

// Export rate-limited handler
export const POST = withRateLimit(handleAIInsights, 'ai'); 