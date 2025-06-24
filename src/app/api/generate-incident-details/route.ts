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

    const prompt = `Correct only grammar and spelling in the following incident report. Do not add, remove, or change any information. Return the corrected text as 'occurrence'.\n\nInput: ${input}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a grammar and spelling corrector. Only correct grammar and spelling. Do not add, remove, or change any information."
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