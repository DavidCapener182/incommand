import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logAIUsage } from '@/lib/supabaseServer';
import { chatCompletion, isOllamaAvailable } from '@/services/ollamaService';
import { safeParseJson } from '@/lib/ai/json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { input, location, callsign } = await request.json();

    let aiSource: 'openai' | 'ollama' | 'none' = 'none';
    let occurrenceText = '';
    let actionTakenText = '';

    const prompt = `Generate a professional welfare incident report based on this exact input: "${input}"

Additional context:
Location: ${location || 'Not specified'}
Callsign: ${callsign || 'Not specified'}

Please provide:
1. An occurrence description that:
   - Uses the EXACT information from the input
   - Maintains all key details about the person's condition
   - Formats it professionally but does not add or remove information
   - Do NOT prefix with "Welfare:" - just describe the situation directly
2. A professional action taken statement that reflects:
   - Initial welfare response
   - Any referrals made (medical, safeguarding, etc.)
   - Support provided or refused
   - Follow-up actions

Format the response as JSON with 'occurrence' and 'actionTaken' fields. The occurrence MUST contain the actual situation described in the input.

Example format:
Input: "Response 5 – intoxicated female, confused and sitting alone, safeguarding concern"
{
  "occurrence": "Intoxicated female identified at Response 5 location, confused and sitting alone. Safeguarding concern raised.",
  "actionTaken": "Welfare team attending. Individual assessed and safeguarding team notified. Ongoing monitoring in place."
}`;
    const DEFAULT_ACTION = 'Welfare team dispatched to assess and support.';

    // Try OpenAI primary
    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                "You are a professional welfare incident report writer. Your primary task is to format welfare incidents into clear, professional reports while maintaining all key details about the person's condition and the support provided or needed. Focus on factual, respectful descriptions that prioritize the individual's dignity. Do not prefix occurrences with 'Welfare:' - just describe the situation directly."
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 120
        });
        const response = completion.choices[0].message.content;
        const parsedResponse = safeParseJson(response);
        occurrenceText = parsedResponse.occurrence || input;
        actionTakenText = parsedResponse.actionTaken || DEFAULT_ACTION;
        aiSource = 'openai';
        // Note: AI usage logging requires event_id and user_id from request
        // await logAIUsage({
        //   event_id,
        //   user_id,
        //   endpoint: '/api/generate-welfare-details',
        //   model: 'gpt-3.5-turbo',
        //   tokens_used: completion.usage?.total_tokens || null,
        //   cost_usd: null
        // });
      } catch (err) {
        aiSource = 'none';
      }
    }

    // Fallback to Ollama if OpenAI failed
    if (aiSource !== 'openai') {
      try {
        const model = process.env.OLLAMA_MODEL_WELFARE || process.env.OLLAMA_MODEL_DEFAULT;
        const available = await isOllamaAvailable(model);
        if (available) {
          const ollamaPrompt = [
            {
              role: 'system' as const,
              content:
                "You are a professional welfare incident report writer. Your primary task is to format welfare incidents into clear, professional reports while maintaining all key details about the person's condition and the support provided or needed. Focus on factual, respectful descriptions that prioritize the individual's dignity. Do not prefix occurrences with 'Welfare:' - just describe the situation directly. Output strictly a JSON object with keys 'occurrence' and 'actionTaken'."
            },
            { role: 'user' as const, content: prompt }
          ];
          const content = await chatCompletion(ollamaPrompt, {
            model,
            temperature: 0.3,
            maxTokens: 120,
            timeoutMs: 20000,
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

    console.log('generate-welfare-details source=', aiSource);

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
    console.error('Error generating welfare details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate welfare details' },
      { status: 500 }
    );
  }
} 
