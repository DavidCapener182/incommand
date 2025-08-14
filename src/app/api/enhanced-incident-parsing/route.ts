import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { detectPriority } from '@/utils/priorityDetection';
import { extractIncidentJson } from '@/utils/incidentJson';
import { INCIDENT_EXTRACTION_SYSTEM, buildIncidentExtractionUser } from '@/prompts/incidentExtraction';
import type { EnhancedIncidentParsingResponse } from '@/types/ai';

// Local lightweight fallbacks to mirror existing modal helpers without importing the big component
function fallbackDetectCallsign(input: string): string {
  const text = input.toLowerCase();
  const patterns = [
    /\b([rsa][0-9]+[a-z]*)\b/i,
    /\b(response\s*[0-9]+)\b/i,
    /\b(security\s*[0-9]+)\b/i,
    /\b(admin\s*[0-9]+)\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]
        .replace(/^(response|security|admin)\s*/i, (letter) => letter[0].toUpperCase())
        .replace(/^[rsa]/i, (l) => l.toUpperCase())
        .toUpperCase();
    }
  }
  return '';
}

function fallbackExtractLocation(input: string): string | null {
  // Extract location after at/in/near/by and strip trailing callsign like "by R1"
  const match = input.match(/(?:at|in|near|by|from|to)\s+(the\s+)?([^,.]+)(?:,|\.|$)/i);
  let loc = match ? match[2].trim() : '';
  if (!loc) return null;
  loc = loc.replace(/\bby\s+[A-Za-z]*\d+[A-Za-z]*\b/gi, '').trim();
  loc = loc.replace(/\s+/g, ' ').replace(/[.,\s]+$/g, '').trim();
  return loc || null;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { input, incidentTypes } = await request.json();

    if (!input || !incidentTypes || !Array.isArray(incidentTypes)) {
      return NextResponse.json({ error: 'Input and incidentTypes array are required' }, { status: 400 });
    }

    let aiResult: any = null;
    let aiSource: 'openai' | 'browser' | 'none' = 'none';

    if (process.env.OPENAI_API_KEY) {
      const INCIDENT_MODEL = process.env.OPENAI_INCIDENT_MODEL || 'gpt-4o-mini';
      const system = INCIDENT_EXTRACTION_SYSTEM;
      const user = buildIncidentExtractionUser(incidentTypes, input);

      try {
        const completion = await openai.chat.completions.create({
          model: INCIDENT_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0,
          max_tokens: 250
        });
        const content = completion.choices[0].message.content || '';
        const extracted = extractIncidentJson(content, input);
        if (extracted) {
          aiResult = extracted;
          aiSource = 'openai';
        }
      } catch (err) {
        aiResult = null;
      }
    }

    // WebLLM is browser-only. Do NOT attempt to initialize it on the server.
    // The client handles fallback when OpenAI is unavailable by checking `fallback: 'browser-recommended'`.

    // Normalize incident type to match allowed list and internal taxonomy
    const normalizeIncidentType = (candidate: string | undefined | null, allowed: string[]): string => {
      const c = (candidate || '').trim();
      if (!c) return '';
      const allowedSet = new Set(allowed.map(a => a.toLowerCase()));
      // Basic synonym mapping
      const lower = c.toLowerCase();
      const synonymMap: Record<string, string> = {
        'fight': 'Aggressive Behaviour',
        'fighting': 'Aggressive Behaviour',
        'assault': 'Aggressive Behaviour',
        'violent incident': 'Aggressive Behaviour',
        'suspicious behavior': 'Suspicious Behaviour',
        'suspicious behaviour': 'Suspicious Behaviour',
        'queue buildup': 'Queue Build-Up',
        'queue build up': 'Queue Build-Up',
        'lost property': 'Lost Property',
        'tech issue': 'Technical Issue',
        'weather': 'Weather Disruption',
      };
      let mapped = c;
      if (synonymMap[lower]) mapped = synonymMap[lower];
      // If mapped (or original) is in allowed, use it; else try case-insensitive match
      if (allowed.includes(mapped)) return mapped;
      const ci = allowed.find(a => a.toLowerCase() === mapped.toLowerCase());
      return ci || '';
    };

    const incidentTypeRaw = aiResult?.incidentType || '';
    const incidentType = normalizeIncidentType(incidentTypeRaw, incidentTypes) || '';
    const description = aiResult?.description || input;
    const callsign = aiResult?.callsign || fallbackDetectCallsign(input);
    const location = (aiResult?.location || fallbackExtractLocation(input) || '').toString();
    const priority = (aiResult?.priority as string)?.toLowerCase?.() || detectPriority(input);
    const confidence = typeof aiResult?.confidence === 'number' ? aiResult.confidence : 0;
    const actionTaken = (aiResult?.actionTaken && aiResult.actionTaken.length > 10)
      ? aiResult.actionTaken
      : (() => {
          const type = (incidentType || '').toLowerCase();
          if (type === 'sexual misconduct' || type.includes('sexual')) {
            return '1. Secure the area and preserve evidence. 2. Contact police immediately. 3. Provide support to the victim and ensure a safe space. 4. Identify and separate any witnesses; document statements. 5. Coordinate medical support as needed. Other:';
          }
          return '1. Assess scene safety. 2. Dispatch appropriate resources. 3. Document key details and witnesses. 4. Communicate updates to control. 5. Review need for escalation. Other:';
        })();

    // Clean location of any lingering callsign text
    const cleanedLocation = location.replace(/\bby\s+[A-Za-z]*\d+[A-Za-z]*\b/gi, '').replace(/\s+/g, ' ').replace(/[.,\s]+$/g, '').trim();

    // Special handling for ejection to maintain compatibility with existing extraction in other flows
    let ejectionInfo = null as null | { location: string; description: string; reason: string };
    if (incidentType === 'Ejection') {
      ejectionInfo = { location: cleanedLocation || '', description: '', reason: '' };
    }

    console.log('enhanced-incident-parsing source=', aiSource, { incidentType, cleanedLocation });

    const successResponse: EnhancedIncidentParsingResponse = { incidentType, description, callsign, location: cleanedLocation, priority, confidence, actionTaken, ejectionInfo, aiSource };
    // Server-side fallback signal: recommend client to use WebLLM in the browser when cloud AI is unavailable
    if (aiSource === 'none') {
      (successResponse as any).fallback = 'browser-recommended';
    }
    return NextResponse.json(successResponse);
  } catch (error: any) {
    // Absolute fallback: never fail completely
    const body = await request.text().catch(() => '');
    const parsed = (() => { try { return JSON.parse(body || '{}'); } catch { return {}; } })();
    const input = parsed.input || '';
    const loc = (fallbackExtractLocation(input) || '').toString().replace(/\bby\s+[A-Za-z]*\d+[A-Za-z]*\b/gi, '').trim();
    const errorResponse: EnhancedIncidentParsingResponse = {
      incidentType: '',
      description: input,
      callsign: fallbackDetectCallsign(input),
      location: loc,
      priority: detectPriority(input),
      confidence: 0,
      actionTaken: '',
      ejectionInfo: null,
      aiSource: 'none'
    };
    (errorResponse as any).fallback = 'browser-recommended';
    return NextResponse.json(errorResponse);
  }
}


