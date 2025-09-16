import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logAIUsage } from '@/lib/supabaseServer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { input, location, callsign } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Generate a professional lost property incident report based on this exact input: "${input}"

Additional context:
Location: ${location || 'Not specified'}
Callsign: ${callsign || 'Not specified'}

Please provide:
1. An occurrence description that:
   - Uses the EXACT information from the input
   - Maintains all key details about the lost item
   - Formats it professionally but does not add or remove information
   - Prefix with "Lost Property: " followed by the item description
2. A professional action taken statement that reflects:
   - If item found/collected: "Item collected and logged"
   - If referred to Lost Property Office: "Directed to Lost Property Desk"
   - If item not found: "Details taken – item not yet recovered"
   - Default: "Lost property report created, awaiting update"

Format the response as JSON with 'occurrence' and 'actionTaken' fields. The occurrence MUST contain the actual situation described in the input.

Example format:
Input: "Response 1 – guest lost phone near toilets by Main Bar"
{
  "occurrence": "Lost Property: Mobile phone reported missing near toilets by Main Bar",
  "actionTaken": "Details taken – item not yet recovered. Area being checked by security team."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional lost property incident report writer. Your primary task is to format lost property incidents into clear, professional reports while maintaining all key details about the lost items and the circumstances. Focus on factual descriptions that help identify and locate the items."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 120
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response || '{}');

    // Log usage after completion
    await logAIUsage({
      event_id: undefined,
      user_id: undefined,
      endpoint: '/api/generate-lost-property-details',
      model: 'gpt-3.5-turbo',
      tokens_used: completion.usage?.total_tokens || null,
      cost_usd: null // Optionally calculate if you want
    });

    return NextResponse.json({
      occurrence: parsedResponse.occurrence || `Lost Property: ${input}`,
      action_taken: parsedResponse.actionTaken || 'Lost property report created, awaiting update'
    });
  } catch (error: any) {
    console.error('Error generating lost property details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate lost property details' },
      { status: 500 }
    );
  }
} 
