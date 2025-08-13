import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { detectPriority } from '@/utils/priorityDetection';

// Local lightweight fallbacks to mirror existing modal helpers without importing the big component
function fallbackDetectCallsign(input: string): string {
  const text = input.toLowerCase();
  const patterns = [
    /\b([rsa][0-9]+)\b/i,
    /\b(response\s*[0-9]+)\b/i,
    /\b(security\s*[0-9]+)\b/i,
    /\b(admin\s*[0-9]+)\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].replace(/^(response|security|admin)\s*/i, (letter) => letter[0].toUpperCase()).replace(/^[rsa]/i, (l) => l.toUpperCase()).toUpperCase();
    }
  }
  return '';
}

function fallbackExtractLocation(input: string): string | null {
  const match = input.match(/(?:at|in|near|by|from|to)\s+(the\s+)?([^,.]+)(?:,|\.|$)/i);
  return match ? match[2].trim() : null;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { input, incidentTypes } = await request.json();

    if (!input || !incidentTypes || !Array.isArray(incidentTypes)) {
      return NextResponse.json({ error: 'Input and incidentTypes array are required' }, { status: 400 });
    }

    let aiResult: any = null;

    if (process.env.OPENAI_API_KEY) {
      const system = 'You extract structured security incident data and ALWAYS return strict JSON. If something is missing, use empty string.';
      const user = `Given these allowed incident types: ${incidentTypes.join(', ')}
Extract the following as strict JSON with keys: incidentType, description, callsign, location, priority, confidence.
- incidentType: One of the allowed incident types only
- description: Correct spelling/grammar but do not add facts
- callsign: Extract if present (e.g., A1, R2, Security 1). Else empty
- location: Extract succinct location (e.g., main stage, north gate). Else empty
- priority: One of urgent|high|medium|low based on severity
- confidence: 0-1 indicating certainty

Incident: "${input}"`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0,
          max_tokens: 250
        });
        const content = completion.choices[0].message.content || '';
        try {
          aiResult = JSON.parse(content);
        } catch (e) {
          // Some models may wrap JSON in text; try to extract JSON block
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) aiResult = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        aiResult = null;
      }
    }

    const incidentType = aiResult?.incidentType || '';
    const description = aiResult?.description || input;
    const callsign = aiResult?.callsign || fallbackDetectCallsign(input);
    const location = aiResult?.location || fallbackExtractLocation(input) || '';
    const priority = (aiResult?.priority as string)?.toLowerCase?.() || detectPriority(input);
    const confidence = typeof aiResult?.confidence === 'number' ? aiResult.confidence : 0;

    // Special handling for ejection to maintain compatibility with existing extraction in other flows
    let ejectionInfo = null as null | { location: string; description: string; reason: string };
    if (incidentType === 'Ejection') {
      ejectionInfo = { location: location || '', description: '', reason: '' };
    }

    return NextResponse.json({ incidentType, description, callsign, location, priority, confidence, ejectionInfo });
  } catch (error: any) {
    // Absolute fallback: never fail completely
    const body = await request.text().catch(() => '');
    const parsed = (() => { try { return JSON.parse(body || '{}'); } catch { return {}; } })();
    const input = parsed.input || '';
    return NextResponse.json({
      incidentType: '',
      description: input,
      callsign: fallbackDetectCallsign(input),
      location: fallbackExtractLocation(input) || '',
      priority: detectPriority(input),
      confidence: 0,
    });
  }
}


