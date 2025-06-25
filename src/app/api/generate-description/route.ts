import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logAIUsage } from '@/lib/supabase';

// Debug logging for environment variables
console.log('API Route - Environment variables check:', {
  OPENAI_API_KEY_EXISTS: typeof process.env.OPENAI_API_KEY !== 'undefined',
  OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { venueName, artistName } = await request.json();

    if (!venueName || !artistName) {
      return NextResponse.json(
        { error: 'Venue name and artist name are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Provide a concise security brief for an upcoming event featuring ${artistName} at ${venueName}. The brief should:
\t•\tSummarise any previous incidents or issues related to the artist or venue, based on credible online sources or news reports.
\t•\tHighlight crowd dynamics typically associated with this artist or venue (e.g., audience demographics, expected behaviour, potential flashpoints).
\t•\tInclude an estimated demographic breakdown (e.g., expected male/female split, typical age range of attendees).
\t•\tProvide a very brief overview of the type of event and what security should expect (e.g., "high-energy rock concert with mosh pits likely", "family-friendly daytime festival", etc).
\t•\tMention any special considerations for security planning based on past events.

Keep the brief to two paragraphs, suitable for use in an operational security handover or briefing document.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an experienced security operations manager who creates detailed, factual security briefs based on historical data and risk assessment."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 120
    });

    // Log usage after completion
    await logAIUsage({
      event_id: undefined,
      user_id: undefined,
      endpoint: '/api/generate-description',
      model: 'gpt-3.5-turbo',
      tokens_used: completion.usage?.total_tokens || null,
      cost_usd: null // Optionally calculate if you want
    });

    const description = completion.choices[0].message.content;
    return NextResponse.json({ description });
  } catch (error: any) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate description' },
      { status: 500 }
    );
  }
} 