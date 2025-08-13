import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { detectPriority } from '@/utils/priorityDetection';

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

function fallbackExtractLocation(input: string): string | undefined {
  const match = input.match(/(?:at|in|near|by|from|to)\s+(the\s+)?([^,.]+)(?:,|\.|$)/i);
  return match ? match[2].trim() : undefined;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { input, incidentTypes, extractCallsign = false, extractLocation = false, extractPriority = false } = await request.json();

    if (!input || !incidentTypes || !Array.isArray(incidentTypes)) {
      return NextResponse.json(
        { error: 'Input and incidentTypes array are required' },
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

    // Prompt for incident type selection
    const typePrompt = `Given the following incident types: ${incidentTypes.join(", ")}
Classify this incident into the single best matching type from the list. Only return the type, nothing else.
Incident: "${input}"`;

    const typeCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at classifying security incidents. Only return a single type from the provided list."
        },
        {
          role: "user",
          content: typePrompt
        }
      ],
      temperature: 0,
      max_tokens: 20
    });
    const incidentType = typeCompletion.choices[0].message.content?.trim() || '';

    // Prompt for grammar/spelling correction
    const grammarPrompt = `Correct the spelling and grammar of the following incident description, but do not add or remove any information. Only return the corrected text.\n\n${input}`;

    const grammarCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that only corrects spelling and grammar. Do not add or remove any information."
        },
        {
          role: "user",
          content: grammarPrompt
        }
      ],
      temperature: 0,
      max_tokens: 200
    });
    const description = grammarCompletion.choices[0].message.content?.trim() || input;

    // Optional enhanced extraction flags
    let callsign: string | undefined;
    let location: string | undefined;
    let priority: string | undefined;

    if (extractCallsign || extractLocation || extractPriority) {
      try {
        const fieldsPrompt = `Extract fields from the following incident description. Respond ONLY as JSON with keys present only when requested. Allowed keys: callsign, location, priority.
Description: "${description}"
Rules:
- callsign: Extract short unit like A1/R2/S1 or phrasing like "Security 1".
- location: Succinct location phrase.
- priority: One of urgent|high|medium|low. If unclear, omit.
Requested keys: ${[
          extractCallsign ? 'callsign' : null,
          extractLocation ? 'location' : null,
          extractPriority ? 'priority' : null
        ].filter(Boolean).join(', ')}`;

        const fieldsCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You extract concise fields and respond in strict JSON.' },
            { role: 'user', content: fieldsPrompt }
          ],
          temperature: 0,
          max_tokens: 150
        });
        const raw = fieldsCompletion.choices[0].message.content || '{}';
        const parsed = JSON.parse(raw);
        callsign = parsed.callsign;
        location = parsed.location;
        priority = parsed.priority;
      } catch (e) {
        // Graceful degradation
      }
      // Apply fallbacks if missing
      if (extractPriority && !priority) {
        priority = detectPriority(description);
      }
      if (extractCallsign && !callsign) {
        callsign = fallbackDetectCallsign(description);
      }
      if (extractLocation && !location) {
        location = fallbackExtractLocation(description);
      }
    }

    // If Ejection, extract additional fields
    let ejectionInfo = null;
    let ejectionRaw = null;
    if (incidentType === 'Ejection') {
      const extractPrompt = `Extract the following information from the incident description below. If a field is not present, return an empty string for it. Respond ONLY in strict JSON format with keys: location, description, reason.\n\nIncident: "${description}"\n\nFields to extract:\n- location: Location of ejection (e.g. Pit Area, Main Entrance)\n- description: Description of person(s) (e.g. Male wearing a red t-shirt)\n- reason: Reason for ejection (e.g. Fighting, Intoxication)\n\nExample output:\n{\n  \"location\": \"Pit Area\",\n  \"description\": \"Male wearing a red t-shirt\",\n  \"reason\": \"Fighting\"\n}`;
      const extractCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You extract structured data from incident reports and always respond in strict JSON."
          },
          {
            role: "user",
            content: extractPrompt
          }
        ],
        temperature: 0,
        max_tokens: 200
      });
      ejectionRaw = extractCompletion.choices[0].message.content;
      try {
        ejectionInfo = JSON.parse(ejectionRaw || '{}');
      } catch (err) {
        ejectionInfo = { location: '', description: '', reason: '' };
      }
    }

    return NextResponse.json({ incidentType, description, ejectionInfo, ejectionRaw, callsign, location, priority });
  } catch (error: any) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate description' },
      { status: 500 }
    );
  }
} 