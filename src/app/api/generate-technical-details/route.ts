import { NextResponse } from 'next/server';
import { openaiClient } from '@/lib/openaiClient';

export async function POST(request: Request) {
  try {
    const { input, location, callsign, isResolved, needsTechTeam, hasWorkaround, isSiteWide, isScanner, isUrgent } = await request.json();

    if (!openaiClient) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a professional event control incident report writer specializing in technical issues and equipment failures. 
Write clear, concise, and factual reports using appropriate technical terminology.
Focus on describing the current issue and any actions being taken to resolve it.
Format responses as JSON with 'occurrence' and 'actionTaken' fields.
Keep responses brief and focused on the technical issue and its current status.
For scanner/ticket issues, emphasize the impact on entry flow and any backup procedures.`;

    const userPrompt = `Generate a professional technical issue report based on this exact input: "${input}"

Additional context:
Location: ${location || 'Not specified'}
Callsign: ${callsign || 'Not specified'}
Issue Resolved: ${isResolved ? 'Yes' : 'No'}
Needs Tech Team: ${needsTechTeam ? 'Yes' : 'No'}
Has Workaround: ${hasWorkaround ? 'Yes' : 'No'}
Site-Wide Issue: ${isSiteWide ? 'Yes' : 'No'}
Scanner Issue: ${isScanner ? 'Yes' : 'No'}
Urgent: ${isUrgent ? 'Yes' : 'No'}

Format your response as a JSON object with:
1. 'occurrence': A clear description of the technical issue that includes:
   - Specific equipment affected
   - Location and scope of the issue
   - Impact on operations
   ${isScanner ? '- Current status of ticket scanning process' : ''}
   
2. 'actionTaken': The current response and status based on:
   - If resolved → "Issue resolved on site"
   - If scanner issue → "Technical team notified and en route. Security team monitoring situation."
   - If temporary fix → "Temporary workaround in place – awaiting technical support"
   ${isScanner ? '- Include any manual check procedures being implemented' : ''}

Keep the language professional and focused on technical details.
Include impact and scope if site-wide issue.
${isUrgent ? 'Emphasize the urgency of the situation.' : ''}`;

    const completion = await openaiClient.chat.completions.create({
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
      defaultActionTaken = 'Issue resolved on site';
    } else if (needsTechTeam || isScanner) {
      defaultActionTaken = 'Technical team notified and en route. Security team monitoring situation.';
      if (isScanner) {
        defaultActionTaken += ' Staff advised to implement manual checks if needed.';
      }
    } else if (hasWorkaround) {
      defaultActionTaken = 'Temporary workaround in place – awaiting technical support';
    } else {
      defaultActionTaken = 'Issue logged and being investigated. Technical team notified.';
    }

    if (isUrgent && !isResolved) {
      defaultActionTaken = 'URGENT: ' + defaultActionTaken;
    }

    let defaultOccurrence = isScanner 
      ? `Technical issue: Ticket scanning system malfunction reported at ${location}. Entry process affected.`
      : `Technical issue: Equipment malfunction reported at ${location}`;

    if (isSiteWide) {
      defaultOccurrence = defaultOccurrence.replace('reported at', 'affecting multiple areas including');
    }

    return NextResponse.json({
      occurrence: parsedResponse.occurrence || defaultOccurrence,
      actionTaken: parsedResponse.actionTaken || defaultActionTaken
    });
  } catch (error: any) {
    console.error('Error generating technical issue details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate technical issue details' },
      { status: 500 }
    );
  }
} 
