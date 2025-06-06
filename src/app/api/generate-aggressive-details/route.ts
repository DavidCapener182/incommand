import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { input, location, callsign, policeRequired, physicalViolence, verbalAbuse, securityIntervention } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a professional security incident report writer specializing in aggressive behavior incidents. 
Write clear, concise, and factual reports using appropriate security terminology. 
Focus on describing the situation objectively and the actions being taken to maintain safety.
Format responses as JSON with 'occurrence' and 'actionTaken' fields.`;

    const userPrompt = `Generate a professional aggressive behavior incident report based on this exact input: "${input}"

Additional context:
Location: ${location || 'Not specified'}
Callsign: ${callsign || 'Not specified'}
Police Required: ${policeRequired ? 'Yes' : 'No'}
Physical Violence: ${physicalViolence ? 'Yes' : 'No'}
Verbal Abuse: ${verbalAbuse ? 'Yes' : 'No'}
Security Intervention: ${securityIntervention ? 'Yes' : 'No'}

Format your response as a JSON object with:
1. 'occurrence': A clear description of the incident (2-3 sentences)
2. 'actionTaken': The security response and current status (1-2 sentences)

Keep the language professional and security-focused.`;

    const completion = await openai.chat.completions.create({
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

    // Default action taken based on severity
    let defaultActionTaken = 'Security monitoring situation. ';
    if (physicalViolence) {
      defaultActionTaken += 'Individuals separated and situation contained. ';
    }
    if (policeRequired) {
      defaultActionTaken += 'Police notified and en route. ';
    }
    if (securityIntervention) {
      defaultActionTaken += 'Security team has intervened. ';
    }
    defaultActionTaken = defaultActionTaken.trim();

    return NextResponse.json({
      occurrence: parsedResponse.occurrence || input,
      actionTaken: parsedResponse.actionTaken || defaultActionTaken
    });
  } catch (error: any) {
    console.error('Error generating aggressive behaviour details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate aggressive behaviour details' },
      { status: 500 }
    );
  }
} 