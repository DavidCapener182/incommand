import { NextResponse } from 'next/server';
import { openaiClient } from '@/lib/openaiClient';

export async function POST(request: Request) {
  try {
    const { location, description, reason, aggressive } = await request.json();

    if (!openaiClient) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Correct only grammar and spelling in the following incident report. Do not add, remove, or change any information. Return the corrected text as 'occurrence'.\n\nInput: ${description}`;

    const completion = await openaiClient.chat.completions.create({
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
      occurrence: parsedResponse.occurrence || 'Refusal incident recorded.',
      actionTaken: parsedResponse.actionTaken || 'Refusal logged and communicated to security team.'
    });
  } catch (error: any) {
    console.error('Error generating refusal details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate refusal details' },
      { status: 500 }
    );
  }
} 
