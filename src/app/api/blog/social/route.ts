import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { articleText } = await request.json()

    if (!articleText) {
      return NextResponse.json(
        { error: 'Article text is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Based on this article, draft a professional LinkedIn post (with emojis) and a concise Twitter/X thread (3 tweets). Separate them clearly.\n\nArticle: ${articleText}`
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate social draft' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const draft = data.choices?.[0]?.message?.content || "Unable to generate draft."

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Error generating social draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

