import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logAIUsage } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { input, location, callsign, interventionNeeded, redirectionMentioned, stableFlow, severeCrowding, monitoringSituation } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a professional event control incident report writer specializing in queue and crowd management. 
Write clear, concise, and factual reports using appropriate crowd management terminology. 
Focus on describing the current situation and any actions being taken to manage crowd flow.
Format responses as JSON with 'occurrence' and 'actionTaken' fields.
Keep responses brief and focused on immediate actions and current status.`;

    const userPrompt = `Generate a professional queue build-up/overcrowding incident report based on this exact input: "${input}"

Additional context:
Location: ${location || 'Not specified'}
Callsign: ${callsign || 'Not specified'}
Intervention Needed: ${interventionNeeded ? 'Yes' : 'No'}
Redirection Mentioned: ${redirectionMentioned ? 'Yes' : 'No'}
Stable Flow: ${stableFlow ? 'Yes' : 'No'}
Severe Crowding: ${severeCrowding ? 'Yes' : 'No'}
Monitoring Situation: ${monitoringSituation ? 'Yes' : 'No'}

Format your response as a JSON object with:
1. 'occurrence': A clear description of the queue/crowd situation (1-2 sentences)
2. 'actionTaken': The current response and status (1-2 sentences)

Keep the language professional and focused on crowd management.
If monitoring is mentioned, emphasize the proactive nature of the monitoring.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 120
    });

    // Log usage after completion
    await logAIUsage({
      event_id: null,
      user_id: null,
      endpoint: '/api/generate-queue-details',
      model: 'gpt-3.5-turbo',
      tokens_used: completion.usage?.total_tokens || null,
      cost_usd: null
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response || '{}');

    // Default action taken based on conditions
    let defaultActionTaken = 'Monitoring ongoing, awaiting update from staff on ground. ';
    if (interventionNeeded) {
      defaultActionTaken = 'Response team dispatched to assist. Additional lanes to be opened based on monitoring results. ';
    }
    if (redirectionMentioned) {
      defaultActionTaken += 'Crowd redirected to alternate entry point. ';
    }
    if (stableFlow) {
      defaultActionTaken = 'Crowd monitored – flow maintained. ';
    }
    if (severeCrowding) {
      defaultActionTaken += 'Immediate crowd control measures implemented. ';
    }
    if (monitoringSituation) {
      defaultActionTaken = 'Security team monitoring situation and will implement additional measures if needed. ';
    }
    defaultActionTaken = defaultActionTaken.trim();

    return NextResponse.json({
      occurrence: parsedResponse.occurrence || `Queue build-up reported at ${location}`,
      actionTaken: parsedResponse.actionTaken || defaultActionTaken
    });
  } catch (error: any) {
    console.error('Error generating queue build-up details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate queue build-up details' },
      { status: 500 }
    );
  }
} 