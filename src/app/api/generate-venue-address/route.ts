import { NextResponse } from 'next/server';
import { openaiClient } from '@/lib/openaiClient';

// Debug logging for environment variables
console.log('API Route (Venue) - Environment variables check:', {
  OPENAI_API_KEY_EXISTS: typeof process.env.OPENAI_API_KEY !== 'undefined',
  OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length
});

export async function POST(request: Request) {
  try {
    const { venueName } = await request.json();

    if (!venueName) {
      return NextResponse.json(
        { error: 'Venue name is required' },
        { status: 400 }
      );
    }

    if (!openaiClient) {
      console.error('OpenAI API key is missing');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Please provide the full address for the venue "${venueName}". If this is a well-known venue, provide its actual address. If not certain about the exact address, provide a plausible address format that would be typical for this type of venue. Return ONLY the address with no additional context or explanation.`;

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides venue addresses. For well-known venues, provide actual addresses. For unknown venues, provide plausible addresses in the correct format for that region."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const address = completion.choices[0].message.content;
    return NextResponse.json({ address });
  } catch (error: any) {
    console.error('Error generating address:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate address' },
      { status: 500 }
    );
  }
} 
