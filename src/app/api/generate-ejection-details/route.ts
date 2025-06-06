import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { input, location, description, reason, policeInformed, refusedReentry, additionalSecurity, callsign } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Generate a professional security ejection report based on this exact input: "${input}"

Additional context:
Location: ${location}
Description: ${description}
Reason: ${reason}
Police Informed: ${policeInformed ? 'Yes' : 'No'}
Refused Re-entry: ${refusedReentry ? 'Yes' : 'No'}
Additional Security: ${additionalSecurity ? 'Yes' : 'No'}
Callsign: ${callsign || 'Not specified'}

Please provide:
1. An occurrence description that:
   - Uses the EXACT information from the input
   - Maintains all key details mentioned
   - Formats it professionally but does not add or remove information
2. A professional action taken statement that reflects:
   - Ejection status
   - Police involvement (if any)
   - Re-entry status
   - Additional security measures

Format the response as JSON with 'occurrence' and 'actionTaken' fields. The occurrence MUST contain the actual situation described in the input.

Example format:
Input: "ejection from the venue, males fighting"
{
  "occurrence": "Multiple males ejected from venue following physical altercation",
  "actionTaken": "Individuals removed from venue. Re-entry refused. Area monitored for further incidents."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional security incident report writer. Your primary task is to format the EXACT incident details provided in the input into professional security terminology. Do not invent or remove details - use only what is explicitly stated in the input."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 250
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response || '{}');

    return NextResponse.json({
      occurrence: parsedResponse.occurrence || input,
      action_taken: parsedResponse.actionTaken || 'Individual ejected from venue.'
    });
  } catch (error: any) {
    console.error('Error generating ejection details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate ejection details' },
      { status: 500 }
    );
  }
} 