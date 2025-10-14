import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { substituteTemplate, processUserAnswers } from '@/utils/templateSubstitution';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GuidedActionsRequest {
  incidentType: string;
  template: {
    actions: string;
    outcome: string;
  };
  incidentData: {
    occurrence?: string;
    callsign?: string;
    location?: string;
    priority?: string;
    time?: string;
    persons?: string;
    reason?: string;
    symptoms?: string;
    [key: string]: any;
  };
  userAnswers?: Record<string, any>;
}

interface GuidedActionsResponse {
  actions: string;
  outcome: string;
  confidence: number;
  source: 'ai' | 'template';
}

export async function POST(request: Request) {
  try {
    const body: GuidedActionsRequest = await request.json();
    const { incidentType, template, incidentData, userAnswers = {} } = body;

    if (!incidentType || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: incidentType and template' },
        { status: 400 }
      );
    }

    // Process user answers into context-friendly format
    const processedAnswers = processUserAnswers(userAnswers, incidentType);

    // Build substitution context by merging incident data and processed answers
    const context = {
      ...incidentData,
      ...processedAnswers,
      // Set default values for common placeholders
      responders: incidentData.callsign || 'Security team',
      time: incidentData.time || new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };

    // Perform template substitution
    const templateActions = substituteTemplate(template.actions, context);
    const templateOutcome = substituteTemplate(template.outcome, context);

    // If OpenAI is not available, return template-only result
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, using template-only fallback');
      return NextResponse.json<GuidedActionsResponse>({
        actions: templateActions,
        outcome: templateOutcome,
        confidence: 0.6,
        source: 'template'
      });
    }

    // Use OpenAI to refine the template-substituted text
    try {
      const SYSTEM_PROMPT = `You refine incident actions and outcomes to be factual, professional, and Green Guide-compliant.
- Use objective, factual language
- Maintain professional security/event management tone
- Follow Green Guide best practices
- Be concise and clear
- Avoid speculation or emotive language
- Return ONLY valid JSON with "actions" and "outcome" fields`;

      const USER_PROMPT = `Incident Type: ${incidentType}
Incident Context: ${JSON.stringify(incidentData, null, 2)}
User Inputs: ${JSON.stringify(userAnswers, null, 2)}

Template Actions: "${templateActions}"
Template Outcome: "${templateOutcome}"

Refine these into professional, factual incident log entries. Ensure they are Green Guide-compliant.
Return ONLY valid JSON:
{
  "actions": "<refined actions taken>",
  "outcome": "<refined outcome>"
}`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_INCIDENT_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = completion.choices[0].message.content || '';
      
      // Extract JSON from response
      let aiResult: { actions: string; outcome: string } | null = null;
      try {
        // Try to parse as JSON directly
        aiResult = JSON.parse(content);
      } catch {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          aiResult = JSON.parse(jsonMatch[1]);
        } else {
          // Try to find JSON object in the text
          const objMatch = content.match(/\{[\s\S]*\}/);
          if (objMatch) {
            aiResult = JSON.parse(objMatch[0]);
          }
        }
      }

      if (aiResult && aiResult.actions && aiResult.outcome) {
        return NextResponse.json<GuidedActionsResponse>({
          actions: aiResult.actions,
          outcome: aiResult.outcome,
          confidence: 0.9,
          source: 'ai'
        });
      }

      // AI parsing failed, fall back to template
      console.warn('AI result parsing failed, using template fallback');
      return NextResponse.json<GuidedActionsResponse>({
        actions: templateActions,
        outcome: templateOutcome,
        confidence: 0.6,
        source: 'template'
      });

    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      // Fall back to template substitution
      return NextResponse.json<GuidedActionsResponse>({
        actions: templateActions,
        outcome: templateOutcome,
        confidence: 0.6,
        source: 'template'
      });
    }

  } catch (error: any) {
    console.error('Guided actions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}

