import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { input, location, requiresAmbulance, refusedTreatment, transportedOffSite, callsign } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Generate a professional medical incident report for a venue with the following details:
Input: ${input}
Location: ${location}
Requires Ambulance: ${requiresAmbulance ? 'Yes' : 'No'}
Refused Treatment: ${refusedTreatment ? 'Yes' : 'No'}
Transported Off Site: ${transportedOffSite ? 'Yes' : 'No'}
Callsign: ${callsign || 'Not specified'}

Please provide:
1. A clear, concise occurrence description that includes:
   - Location (if provided)
   - Nature of the medical issue
   - Patient description (maintaining privacy)
2. A professional action taken statement that reflects:
   - Medical response dispatched
   - Additional services if required (ambulance)
   - Treatment status (refused/transported)

Format the response as JSON with 'occurrence' and 'actionTaken' fields. Use professional medical terminology while keeping it clear and concise.

Example format:
{
  "occurrence": "Stage Left: Male patron requiring medical attention for foot injury",
  "actionTaken": "Medics dispatched to location. Patient assessed and treated on site."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional medical incident report writer for a venue security team. Write clear, concise, and factual reports using appropriate medical and security terminology. Format responses as JSON with 'occurrence' and 'actionTaken' fields."
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
      action_taken: parsedResponse.actionTaken || 'Medics dispatched to location.'
    });
  } catch (error: any) {
    console.error('Error generating medical details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate medical details' },
      { status: 500 }
    );
  }
} 