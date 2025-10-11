import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { chatCompletion, isOllamaAvailable } from '@/services/ollamaService';
import { safeParseJson } from '@/lib/ai/json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { input, location, requiresAmbulance, refusedTreatment, transportedOffSite, callsign } = await request.json();

    let aiSource: 'openai' | 'ollama' | 'none' = 'none';
    let occurrenceText = '';
    let actionTakenText = '';

    const prompt = `Correct only grammar and spelling in the following incident report. Do not add, remove, or change any information. Return the corrected text as 'occurrence' in a JSON object with key 'occurrence'.\n\nInput: ${input}`;
    const DEFAULT_ACTION = 'Medics dispatched to location.';

    // Try OpenAI primary
    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a grammar and spelling corrector. Only correct grammar and spelling. Do not add, remove, or change any information. Output must be a JSON object.'
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 250
        });
        const response = completion.choices[0].message.content;
        const parsedResponse = safeParseJson(response);
        occurrenceText = parsedResponse.occurrence || input;
        actionTakenText = parsedResponse.actionTaken || DEFAULT_ACTION;
        aiSource = 'openai';
      } catch (err) {
        aiSource = 'none';
      }
    }

    // Fallback to Ollama if OpenAI failed
    if (aiSource !== 'openai') {
      try {
        const model = process.env.OLLAMA_MODEL_MEDICAL || process.env.OLLAMA_MODEL_DEFAULT;
        const available = await isOllamaAvailable(model);
        if (available) {
          const ollamaPrompt = [
            {
              role: 'system' as const,
              content:
                'You are a grammar and spelling corrector. Only correct grammar and spelling. Do not add, remove, or change any information. Output strictly a JSON object with key "occurrence".'
            },
            { role: 'user' as const, content: prompt }
          ];
          const content = await chatCompletion(ollamaPrompt, {
            model,
            temperature: 0.7,
            maxTokens: 250,
            timeoutMs: 15000,
            precheckAvailability: false
          });
          const parsedResponse = safeParseJson(content);
          occurrenceText = parsedResponse.occurrence || input;
          actionTakenText = parsedResponse.actionTaken || DEFAULT_ACTION;
          aiSource = 'ollama';
        }
      } catch (err) {
        aiSource = 'none';
      }
    }

    console.log('generate-medical-details source=', aiSource);

    if (aiSource === 'none') {
      return NextResponse.json({
        occurrence: input,
        action_taken: DEFAULT_ACTION
      });
    }

    return NextResponse.json({
      occurrence: occurrenceText || input,
      action_taken: actionTakenText || DEFAULT_ACTION
    });
  } catch (error: any) {
    console.error('Error generating medical details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate medical details' },
      { status: 500 }
    );
  }
} 
