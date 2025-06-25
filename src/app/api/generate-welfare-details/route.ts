import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logAIUsage } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { input, location, callsign, event_id, user_id } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Generate a professional welfare incident report based on this exact input: "${input}"

Additional context:
Location: ${location || 'Not specified'}
Callsign: ${callsign || 'Not specified'}

Please provide:
1. An occurrence description that:
   - Uses the EXACT information from the input
   - Maintains all key details about the person's condition
   - Formats it professionally but does not add or remove information
   - Do NOT prefix with "Welfare:" - just describe the situation directly
2. A professional action taken statement that reflects:
   - Initial welfare response
   - Any referrals made (medical, safeguarding, etc.)
   - Support provided or refused
   - Follow-up actions

Format the response as JSON with 'occurrence' and 'actionTaken' fields. The occurrence MUST contain the actual situation described in the input.

Example format:
Input: "Response 5 – intoxicated female, confused and sitting alone, safeguarding concern"
{
  "occurrence": "Intoxicated female identified at Response 5 location, confused and sitting alone. Safeguarding concern raised.",
  "actionTaken": "Welfare team attending. Individual assessed and safeguarding team notified. Ongoing monitoring in place."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional welfare incident report writer. Your primary task is to format welfare incidents into clear, professional reports while maintaining all key details about the person's condition and the support provided or needed. Focus on factual, respectful descriptions that prioritize the individual's dignity. Do not prefix occurrences with 'Welfare:' - just describe the situation directly."
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

    await logAIUsage({
      event_id,
      user_id,
      endpoint: '/api/generate-welfare-details',
      model: 'gpt-3.5-turbo',
      tokens_used: completion.usage?.total_tokens || null,
      cost_usd: null
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response || '{}');

    return NextResponse.json({
      occurrence: parsedResponse.occurrence || input,
      action_taken: parsedResponse.actionTaken || 'Welfare team dispatched to assess and support.'
    });
  } catch (error: any) {
    console.error('Error generating welfare details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate welfare details' },
      { status: 500 }
    );
  }
} 