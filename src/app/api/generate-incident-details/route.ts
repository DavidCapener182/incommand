import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { input, incident_type, location, description, callsign } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Generate a professional security incident report for a ${incident_type} incident at a venue with the following details:
Input: ${input}
Location: ${location || 'Not specified'}
Description: ${description || 'Not specified'}
Callsign: ${callsign || 'Not specified'}

Please provide:
1. A clear, concise occurrence description that includes:
   - Location (if provided)
   - Nature of the incident
   - Key details from the input
   - Any relevant context
2. A professional action taken statement that reflects:
   - Initial response
   - Follow-up actions
   - Any additional measures taken

Format the response as JSON with 'occurrence' and 'actionTaken' fields. Use professional security terminology while keeping it clear and concise.

Example format:
{
  "occurrence": "Main Stage: Suspicious package identified near sound desk",
  "actionTaken": "Area cordoned off. Security team investigating. Event control notified."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional security incident report writer for a venue. Write clear, concise, and factual reports using appropriate security terminology. Format responses as JSON with 'occurrence' and 'actionTaken' fields."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 250
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response || '{}');

    return NextResponse.json({
      occurrence: parsedResponse.occurrence || input,
      action_taken: parsedResponse.actionTaken || 'Incident logged and being monitored.'
    });
  } catch (error: any) {
    console.error('Error generating incident details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate incident details' },
      { status: 500 }
    );
  }
} 