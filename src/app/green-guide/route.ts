import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'docs', 'green-guide.pdf')
    const data = await fs.readFile(filePath)
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
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

