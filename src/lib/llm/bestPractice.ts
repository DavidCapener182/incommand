import { BestPracticePayload } from '@/types/bestPractice'

const SYSTEM_PROMPT = `You are an Event Safety advisor. Use ONLY the provided Green Guide passages and common operational principles.
Output concise, actionable best-practice guidance for control-room operators.
Do not invent procedures. If unclear, say no guidance.
Return strict JSON with keys: summary, checklist, citations, risk_level, confidence.
Keep the summary ≤ 280 characters. Bullets must be imperative verbs.`

export async function generateBestPractice(input: {
  incidentType: string
  occurrence: string
  passages: string
  timeoutMs?: number
}): Promise<BestPracticePayload | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const userPrompt = `INCIDENT:\n- Type: ${input.incidentType}\n- Occurrence: ${input.occurrence}\n\nCONTEXT PASSAGES (ranked):\n${input.passages}\n\nProduce guidance relevant to the incident. If no relevant passage, respond with: {"summary":"","checklist":[],"citations":[],"risk_level":"low","confidence":0}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 7000)
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_BEST_PRACTICE_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        top_p: 1,
        max_tokens: 350,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      }),
      signal: controller.signal
    })
    if (!res.ok) return null
    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content || '{}'
    const parsed = safeParse(content)
    if (!parsed) return null
    // Clamp
    parsed.summary = String(parsed.summary || '').slice(0, 280)
    parsed.checklist = Array.isArray(parsed.checklist) ? parsed.checklist.slice(0, 6).map((s: any) => String(s).slice(0, 160)) : []
    parsed.citations = Array.isArray(parsed.citations) ? parsed.citations.slice(0, 4).map((s: any) => String(s).slice(0, 40)) : []
    if (!['low','medium','high'].includes(parsed.risk_level)) parsed.risk_level = 'low'
    parsed.confidence = Math.min(1, Math.max(0, Number(parsed.confidence || 0)))
    return parsed
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function safeParse(text: string): BestPracticePayload | null {
  try {
    const obj = JSON.parse(text)
    if (!obj || typeof obj !== 'object') return null
    return {
      summary: String(obj.summary || ''),
      checklist: Array.isArray(obj.checklist) ? obj.checklist.map((s: any) => String(s)) : [],
      citations: Array.isArray(obj.citations) ? obj.citations.map((s: any) => String(s)) : [],
      risk_level: ['low','medium','high'].includes(obj.risk_level) ? obj.risk_level : 'low',
      confidence: Number(obj.confidence || 0)
    }
  } catch {
    return null
  }
}


