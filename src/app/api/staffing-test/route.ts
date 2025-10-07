import { NextResponse } from 'next/server'

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Staffing Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0;">
        <h1 style="color: #333;">STAFFING CENTRE API TEST</h1>
        <p>This is a direct HTML response from the API route.</p>
        <div style="background: red; color: white; padding: 20px; margin: 20px;">
          RED BOX TEST - This should be visible
        </div>
        <p>If you can see this, the routing is working but there's a React hydration issue.</p>
      </body>
    </html>
  `
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
