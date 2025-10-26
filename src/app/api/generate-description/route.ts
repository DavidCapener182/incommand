import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logAIUsage } from '@/lib/supabaseServer';

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
    const { 
      eventType, 
      venueName, 
      artistName, 
      homeTeam, 
      awayTeam, 
      competition,
      paradeRoute, 
      festivalTheme 
    } = await request.json();

    if (!venueName) {
      return NextResponse.json(
        { error: 'Venue name is required' },
        { status: 400 }
      );
    }

    // Check for required fields based on event type
    let hasRequiredFields = false;
    switch (eventType) {
      case 'Concert':
        hasRequiredFields = !!artistName;
        break;
      case 'Football':
        hasRequiredFields = !!homeTeam && !!awayTeam;
        break;
      case 'Parade':
        hasRequiredFields = !!paradeRoute;
        break;
      case 'Festival':
        hasRequiredFields = !!festivalTheme;
        break;
      default:
        hasRequiredFields = true;
    }

    if (!hasRequiredFields) {
      return NextResponse.json(
        { error: 'Required fields for this event type are missing' },
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

    // Generate event-specific prompt
    let eventDescription = '';
    let prompt = '';
    
    switch (eventType) {
      case 'Concert':
        eventDescription = `concert featuring ${artistName}`;
        prompt = `Provide a concise security brief for an upcoming ${eventDescription} at ${venueName}. The brief should:
\t•\tSummarise any previous incidents or issues related to the artist or venue, based on credible online sources or news reports.
\t•\tHighlight crowd dynamics typically associated with this artist or venue (e.g., audience demographics, expected behaviour, potential flashpoints).
\t•\tInclude an estimated demographic breakdown (e.g., expected male/female split, typical age range of attendees).
\t•\tProvide a very brief overview of the type of event and what security should expect (e.g., "high-energy rock concert with mosh pits likely", "family-friendly daytime festival", etc).
\t•\tMention any special considerations for security planning based on past events.`;
        break;
      case 'Football':
        eventDescription = `${competition || 'football'} match between ${homeTeam} and ${awayTeam}`;
        prompt = `Provide a concise security brief for an upcoming ${eventDescription} at ${venueName}. The brief should:
\t•\tSummarise any previous incidents or issues related to these teams, the competition (${competition || 'football'}), or the venue, based on credible online sources or news reports.
\t•\tHighlight crowd dynamics typically associated with this fixture and competition level (e.g., fan demographics, expected behaviour, potential flashpoints, rivalry factors, competition intensity).
\t•\tInclude an estimated demographic breakdown (e.g., expected male/female split, typical age range of attendees, fan base characteristics).
\t•\tProvide a very brief overview of the type of event and what security should expect (e.g., "high-intensity ${competition || 'football'} derby match with passionate fan bases", "family-friendly match", etc).
\t•\tMention any special considerations for security planning based on past events, including any known trouble spots or fan behavior patterns specific to this competition level.`;
        break;
      case 'Parade':
        eventDescription = `parade along ${paradeRoute}`;
        prompt = `Provide a concise security brief for an upcoming ${eventDescription} at ${venueName}. The brief should:
\t•\tSummarise any previous incidents or issues related to this parade route or venue, based on credible online sources or news reports.
\t•\tHighlight crowd dynamics typically associated with this type of parade (e.g., audience demographics, expected behaviour, potential flashpoints).
\t•\tInclude an estimated demographic breakdown (e.g., expected male/female split, typical age range of attendees).
\t•\tProvide a very brief overview of the type of event and what security should expect (e.g., "large-scale street parade with multiple viewing points", "family-friendly community event", etc).
\t•\tMention any special considerations for security planning based on past events, including crowd control and traffic management.`;
        break;
      case 'Festival':
        eventDescription = `${festivalTheme} festival`;
        prompt = `Provide a concise security brief for an upcoming ${eventDescription} at ${venueName}. The brief should:
\t•\tSummarise any previous incidents or issues related to this type of festival or venue, based on credible online sources or news reports.
\t•\tHighlight crowd dynamics typically associated with this festival type (e.g., audience demographics, expected behaviour, potential flashpoints).
\t•\tInclude an estimated demographic breakdown (e.g., expected male/female split, typical age range of attendees).
\t•\tProvide a very brief overview of the type of event and what security should expect (e.g., "multi-day music festival with camping", "family-friendly cultural festival", etc).
\t•\tMention any special considerations for security planning based on past events, including crowd management and safety protocols.`;
        break;
      default:
        eventDescription = `event`;
        prompt = `Provide a concise security brief for an upcoming ${eventDescription} at ${venueName}. The brief should:
\t•\tSummarise any previous incidents or issues related to this venue, based on credible online sources or news reports.
\t•\tHighlight crowd dynamics typically associated with this type of event (e.g., audience demographics, expected behaviour, potential flashpoints).
\t•\tInclude an estimated demographic breakdown (e.g., expected male/female split, typical age range of attendees).
\t•\tProvide a very brief overview of the type of event and what security should expect.
\t•\tMention any special considerations for security planning based on past events.`;
    }

    const fullPrompt = `${prompt}

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
          content: fullPrompt
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
