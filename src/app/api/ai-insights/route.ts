import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { incidents, attendance, event } = await req.json();
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Prepare prompts for multiple insights
    const prompts = [
      `Summarize the most important incidents for this event: ${JSON.stringify(incidents)}`,
      `What trends or patterns can you identify from these incidents: ${JSON.stringify(incidents)}`,
      `Based on the attendance data, what can you infer about crowd flow and surges? ${JSON.stringify(attendance)}`,
      `Are there any recommendations for the event team based on these incidents and attendance? ${JSON.stringify(incidents)} ${JSON.stringify(attendance)}`
    ];

    // Run all prompts in parallel
    const completions = await Promise.all(prompts.map(prompt =>
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      })
    ));

    const insights = completions.map(c => c.choices[0]?.message?.content || 'No insight generated.');
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('AI Insights error:', error);
    return NextResponse.json({ error: 'Failed to generate AI insight.' }, { status: 500 });
  }
} 