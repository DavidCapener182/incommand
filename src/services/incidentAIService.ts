/**
 * Service for OpenAI-powered incident AI features
 * Replaces Gemini API calls with OpenAI
 */

export async function callOpenAI(
  prompt: string,
  systemPrompt?: string,
  jsonMode: boolean = false
): Promise<string> {
  try {
    const response = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: jsonMode ? 500 : 1000,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Clean up JSON if wrapped in markdown code blocks
    if (jsonMode && content.includes('```')) {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      return jsonMatch ? jsonMatch[1] : content;
    }
    
    return content;
  } catch (error) {
    console.error('OpenAI call error:', error);
    return jsonMode ? '{}' : 'Error generating response';
  }
}

