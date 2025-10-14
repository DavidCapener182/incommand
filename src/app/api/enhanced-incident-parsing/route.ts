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
          console.log('enhanced-incident-parsing AI result:', extracted);
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
        // Fight incidents
        'fight': 'Fight',
        'fighting': 'Fight',
        'assault': 'Fight',
        'violent incident': 'Fight',
        'brawl': 'Fight',
        'altercation': 'Fight',
        
        // Medical incidents
        'medical': 'Medical',
        'medical emergency': 'Medical',
        'first aid': 'Medical',
        'injury': 'Medical',
        'ambulance': 'Medical',
        'illness': 'Medical',
        'sick': 'Medical',
        'unwell': 'Medical',
        
        // Security incidents
        'security': 'Security',
        'security breach': 'Security',
        'unauthorized access': 'Security',
        
        // Theft incidents
        'theft': 'Theft',
        'steal': 'Theft',
        'stolen': 'Theft',
        'robbery': 'Theft',
        'theft reported': 'Theft',
        
        // Entry Breach incidents
        'entry breach': 'Entry Breach',
        'gate breach': 'Entry Breach',
        'perimeter breach': 'Entry Breach',
        'unauthorized entry': 'Entry Breach',
        
        // Weapon Related incidents
        'weapon': 'Weapon Related',
        'knife': 'Weapon Related',
        'gun': 'Weapon Related',
        'blade': 'Weapon Related',
        'weapon found': 'Weapon Related',
        'weapon discovered': 'Weapon Related',
        
        // Crowd Control incidents
        'crowd control': 'Crowd Control',
        'crowd surge': 'Crowd Control',
        'crowd crush': 'Crowd Control',
        'crowd management': 'Crowd Control',
        
        // Fire Safety incidents
        'fire safety': 'Fire Safety',
        'fire hazard': 'Fire Safety',
        
        // Technical incidents
        'technical': 'Technical',
        'tech issue': 'Technical',
        'equipment failure': 'Technical',
        'sound issue': 'Technical',
        'lighting issue': 'Technical',
        
        // Artist incidents
        'main act on stage': 'Artist On Stage',
        'artist on stage': 'Artist On Stage',
        'headliner on stage': 'Artist On Stage',
        'band performing': 'Artist On Stage',
        'performing': 'Artist On Stage',
        'main act finished': 'Artist Off Stage',
        'artist off stage': 'Artist Off Stage',
        'set finished': 'Artist Off Stage',
        'performance ended': 'Artist Off Stage',
        'artist movement': 'Artist Movement',
        'artist transit': 'Artist Movement',
        
        // Attendance incidents
        'attendance': 'Attendance',
        'headcount': 'Attendance',
        'crowd numbers': 'Attendance',
        
        // Ejection incidents
        'ejection': 'Ejection',
        'eject': 'Ejection',
        'remove': 'Ejection',
        'escort out': 'Ejection',
        'thrown out': 'Ejection',
        'kicked out': 'Ejection',
        
        // Refusal incidents
        'refusal': 'Refusal',
        'refuse': 'Refusal',
        'deny': 'Refusal',
        'denied': 'Refusal',
        'entry refused': 'Refusal',
        
        // Welfare incidents
        'welfare': 'Welfare',
        'welfare check': 'Welfare',
        'welfare concern': 'Welfare',
        
        // Suspicious Behaviour incidents
        'suspicious behavior': 'Suspicious Behaviour',
        'suspicious behaviour': 'Suspicious Behaviour',
        'suspicious': 'Suspicious Behaviour',
        'suspicious activity': 'Suspicious Behaviour',
        'concern': 'Suspicious Behaviour',
        'worried': 'Suspicious Behaviour',
        
        // Lost Property incidents
        'lost property': 'Lost Property',
        'lost item': 'Lost Property',
        'found property': 'Lost Property',
        
        // Missing Child/Person incidents
        'missing child': 'Missing Child/Person',
        'missing person': 'Missing Child/Person',
        'lost child': 'Missing Child/Person',
        'lost person': 'Missing Child/Person',
        'child missing': 'Missing Child/Person',
        'person missing': 'Missing Child/Person',
        'missing': 'Missing Child/Person',
        
        // Site Issue incidents
        'site issue': 'Site Issue',
        'venue issue': 'Site Issue',
        'facility issue': 'Site Issue',
        
        // Environmental incidents
        'environmental': 'Environmental',
        'weather': 'Environmental',
        'weather disruption': 'Environmental',
        
        // Crowd Management incidents
        'queue management': 'Crowd Management',
        'queue buildup': 'Crowd Management',
        'queue build up': 'Crowd Management',
        
        // Evacuation incidents
        'evacuation': 'Evacuation',
        'evacuate': 'Evacuation',
        'emergency evacuation': 'Evacuation',
        
        // Fire Alarm incidents
        'fire alarm': 'Fire Alarm',
        'fire alarm activated': 'Fire Alarm',
        'alarm': 'Fire Alarm',
        
        // Fire incidents
        'fire': 'Fire',
        'smoke': 'Fire',
        'flame': 'Fire',
        'burning': 'Fire',
        'suspected fire': 'Suspected Fire',
        
        // Noise Complaint incidents
        'noise complaint': 'Noise Complaint',
        'noise issue': 'Noise Complaint',
        'complaint': 'Noise Complaint',
        
        // Animal Incident incidents
        'animal incident': 'Animal Incident',
        'animal': 'Animal Incident',
        'dog': 'Animal Incident',
        'cat': 'Animal Incident',
        
        // Alcohol/Drug incidents
        'alcohol': 'Alcohol / Drug Related',
        'drug': 'Alcohol / Drug Related',
        'drugs': 'Alcohol / Drug Related',
        'drunk': 'Alcohol / Drug Related',
        'intoxicated': 'Alcohol / Drug Related',
        
        // Hostile Act incidents
        'hostile act': 'Hostile Act',
        'terrorism': 'Hostile Act',
        'terrorist': 'Hostile Act',
        'threat': 'Hostile Act',
        
        // Counter-Terror Alert incidents
        'counter-terror alert': 'Counter-Terror Alert',
        'terror alert': 'Counter-Terror Alert',
        'security alert': 'Counter-Terror Alert',
        
        // Sexual Misconduct incidents
        'sexual misconduct': 'Sexual Misconduct',
        'sexual assault': 'Sexual Misconduct',
        'rape': 'Sexual Misconduct',
        'harassment': 'Sexual Misconduct',
        
        // Emergency Show Stop incidents
        'emergency show stop': 'Emergency Show Stop',
        'show stop': 'Emergency Show Stop',
        'stop show': 'Emergency Show Stop',
        
        // Event Timing incidents
        'event timing': 'Event Timing',
        'timing': 'Event Timing',
        'schedule': 'Event Timing',
        'delay': 'Event Timing',
        
        // Timings incidents
        'timings': 'Timings',
        'time check': 'Timings',
        'time update': 'Timings',
        
        // Sit Rep incidents
        'sit rep': 'Sit Rep',
        'situation report': 'Sit Rep',
        'status report': 'Sit Rep',
        
        // Showdown incidents
        'showdown': 'Showdown',
        'show down': 'Showdown',
        
        // Accreditation incidents
        'accreditation': 'Accreditation',
        'accred': 'Accreditation',
        'badge': 'Accreditation',
        
        // Staffing incidents
        'staffing': 'Staffing',
        'staff': 'Staffing',
        'personnel': 'Staffing',
      };
      let mapped = c;
      if (synonymMap[lower]) {
        mapped = synonymMap[lower];
      }
      // If mapped (or original) is in allowed, use it; else try case-insensitive match
      if (allowed.includes(mapped)) {
        return mapped;
      }
      const ci = allowed.find(a => a.toLowerCase() === mapped.toLowerCase());
      return ci || '';
    };

    const incidentTypeRaw = aiResult?.incidentType || '';
    const incidentType = normalizeIncidentType(incidentTypeRaw, incidentTypes) || '';
    const description = aiResult?.description || input;
    const callsign = aiResult?.callsign || fallbackDetectCallsign(input);
    let location = (aiResult?.location || fallbackExtractLocation(input) || '').toString();
    // Capitalize first letter of each word in location
    if (location) {
      location = location.replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    let priority = (aiResult?.priority as string)?.toLowerCase?.() || detectPriority(input);
    // Override priority for artist events - they should always be low priority
    if (incidentType === 'Artist On Stage' || incidentType === 'Artist Off Stage') {
      priority = 'low';
    }
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

    console.log('enhanced-incident-parsing source=', aiSource, { incidentType, cleanedLocation, priority, confidence });

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


