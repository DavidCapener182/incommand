import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { location, description, reason, aggressive } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Generate a professional security incident report for a venue entry refusal with the following details:
Location: ${location}
Description: ${description}
Reason: ${reason}
Aggressive behavior: ${aggressive ? 'Yes' : 'No'}

Please provide:
1. A clear, concise occurrence description (2-3 sentences)
2. A professional action taken statement (1-2 sentences)

Format the response as JSON with 'occurrence' and 'actionTaken' fields. Keep the language professional and security-focused.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional security incident report writer. Write clear, concise, and factual reports using appropriate security terminology. Format responses as JSON with 'occurrence' and 'actionTaken' fields."
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