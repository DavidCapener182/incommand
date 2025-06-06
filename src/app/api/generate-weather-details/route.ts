import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { 
      input, 
      location, 
      callsign, 
      isResolved, 
      needsSafetyTeam, 
      requiresRouteChange,
      isUrgent,
      isLightning,
      isFlooding,
      isWindRelated,
      isSlipperyConditions
    } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a professional event control incident report writer specializing in weather-related disruptions and safety measures. 
Write clear, concise, and factual reports using appropriate terminology for weather conditions and safety protocols.
Focus on describing the current weather impact and any actions being taken to ensure safety.
Format responses as JSON with 'occurrence' and 'actionTaken' fields.
Keep responses brief and focused on immediate safety concerns and operational impacts.
For lightning conditions, emphasize safety protocols and evacuation procedures if needed.`;

    const userPrompt = `Generate a professional weather disruption report based on this exact input: "${input}"

Additional context:
Location: ${location || 'Not specified'}
Callsign: ${callsign || 'Not specified'}
Issue Resolved: ${isResolved ? 'Yes' : 'No'}
Needs Safety Team: ${needsSafetyTeam ? 'Yes' : 'No'}
Route Change Required: ${requiresRouteChange ? 'Yes' : 'No'}
Urgent: ${isUrgent ? 'Yes' : 'No'}
Lightning Present: ${isLightning ? 'Yes' : 'No'}
Flooding Issue: ${isFlooding ? 'Yes' : 'No'}
Wind-Related: ${isWindRelated ? 'Yes' : 'No'}
Slippery Conditions: ${isSlipperyConditions ? 'Yes' : 'No'}

Format your response as a JSON object with:
1. 'occurrence': A clear description of the weather disruption that includes:
   - Specific weather condition affecting the area
   - Location and scope of impact
   - Current safety concerns
   - Impact on event operations
   
2. 'actionTaken': The current response and status based on:
   - If resolved → "Hazard contained – area made safe"
   - If safety team needed → "Safety team notified – risk assessment ongoing"
   - If route changed → "Route or operation amended due to conditions"
   Include specific safety measures being implemented.

Keep the language professional and focused on safety and operational impacts.
${isUrgent ? 'Emphasize the urgency of the situation.' : ''}
${isLightning ? 'Include lightning safety protocols being implemented.' : ''}`;

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

    // Default action taken based on conditions
    let defaultActionTaken = '';
    if (isResolved) {
      defaultActionTaken = 'Hazard contained – area made safe';
    } else if (needsSafetyTeam || isLightning) {
      defaultActionTaken = 'Safety team notified – risk assessment ongoing';
      if (isLightning) {
        defaultActionTaken += '. Lightning procedure initiated.';
      }
    } else if (requiresRouteChange) {
      defaultActionTaken = 'Route or operation amended due to conditions';
    } else {
      defaultActionTaken = 'Weather impact being monitored. Safety measures in place.';
    }

    // Add specific safety measures based on conditions
    if (isFlooding && !isResolved) {
      defaultActionTaken += ' Drainage team deployed. Area cordoned off.';
    }
    if (isWindRelated && !isResolved) {
      defaultActionTaken += ' Structures being secured. Wind speeds monitored.';
    }
    if (isSlipperyConditions && !isResolved) {
      defaultActionTaken += ' Additional matting/grip measures implemented.';
    }

    // Add urgency prefix if needed
    if (isUrgent && !isResolved) {
      defaultActionTaken = 'URGENT: ' + defaultActionTaken;
    }

    let defaultOccurrence = `Weather disruption: ${location} affected by`;
    if (isLightning) {
      defaultOccurrence += ' lightning activity';
    } else if (isFlooding) {
      defaultOccurrence += ' flooding';
    } else if (isWindRelated) {
      defaultOccurrence += ' high winds';
    } else if (isSlipperyConditions) {
      defaultOccurrence += ' hazardous ground conditions';
    } else {
      defaultOccurrence += ' adverse weather conditions';
    }

    return NextResponse.json({
      occurrence: parsedResponse.occurrence || defaultOccurrence,
      actionTaken: parsedResponse.actionTaken || defaultActionTaken
    });
  } catch (error: any) {
    console.error('Error generating weather disruption details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate weather disruption details' },
      { status: 500 }
    );
  }
} 