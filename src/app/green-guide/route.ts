import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'docs', 'green-guide.pdf')
    const data = await fs.readFile(filePath)
    // Convert Buffer to ArrayBuffer explicitly
    const arrayBuffer = new ArrayBuffer(data.length)
    const uint8Array = new Uint8Array(arrayBuffer)
    uint8Array.set(data)
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="green-guide.pdf"'
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Green Guide not found', details: e?.message }, { status: 404 })
  }
}

