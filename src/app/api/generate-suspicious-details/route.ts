import { NextResponse } from 'next/server';
import { openaiClient } from '@/lib/openaiClient';

export async function POST(request: Request) {
  try {
    const { input, location, callsign, isUnattendedBag } = await request.json();

    if (!openaiClient) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a professional security incident report writer for events.
Your task is to format suspicious behaviour reports in a clear, factual manner.
Focus on objective observations and avoid speculation.
Maintain all key details from the input.
Use respectful, professional language.
Do not add or remove information.

For unattended bags/packages, you MUST follow this EXACT format:

1. Occurrence format:
   "Unattended [item type] reported at [exact location] by [callsign]. [Any distinguishing features if provided]."

2. Action Taken format:
   "HOT protocol initiated:
   - Hidden: [Yes/No/Assessing] - [brief detail]
   - Obviously suspicious: [Yes/No/Checking] - [brief detail]
   - Typical: [Yes/No/Evaluating] - [brief detail]
   [Current status] - [Next steps]"

Example:
{
  "occurrence": "Unattended backpack reported at main stage right barrier by S2. Black backpack with red stripes.",
  "actionTaken": "HOT protocol initiated:
   - Hidden: No - Item in plain view
   - Obviously suspicious: Checking - No wires visible
   - Typical: Yes - Appears to be standard festival backpack
   Area cordoned 5m radius, security team conducting assessment."
}`;

    const userPrompt = `Generate a professional suspicious behaviour incident report based on this exact input: "${input}"

Additional context:
Location: ${location || 'Not specified'}
Callsign: ${callsign || 'Not specified'}
Incident Type: ${isUnattendedBag ? 'Unattended Bag' : 'Suspicious Behaviour'}

Format your response as a JSON object with 'occurrence' and 'actionTaken' fields.
For unattended bags, you MUST follow the HOT protocol format exactly as specified.`;

    const completion = await openaiClient.chat.completions.create({
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
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response || '{}');

    return NextResponse.json({
      occurrence: parsedResponse.occurrence || input,
      actionTaken: parsedResponse.actionTaken || (isUnattendedBag 
        ? 'HOT protocol initiated - Hidden: Assessing, Obviously suspicious: Checking, Typical: Evaluating. Area cordoned, awaiting assessment.'
        : 'Behaviour under observation')
    });
  } catch (error: any) {
    console.error('Error generating suspicious details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate suspicious details' },
      { status: 500 }
    );
  }
} 
