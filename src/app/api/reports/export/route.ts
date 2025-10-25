import { NextRequest } from 'next/server'

// Choose one PDF library; pdf-lib is lightweight and tree-shakeable
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const runtime = 'nodejs' // ensure Node runtime for binary ops
export const dynamic = 'force-dynamic' // this is user-triggered, not cachable HTML

export async function POST(req: NextRequest) {
  try {
    const { report } = await req.json() as {
      report: {
        title?: string
        subtitle?: string
        generatedAt?: string
        sections?: Array<{ heading: string; body?: string }>
        metadata?: Record<string, string | number | boolean>
      }
    }

    // Safety guard
    if (!report) {
      return new Response(JSON.stringify({ error: 'Missing report payload' }), { status: 400 })
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Header
    const title = report.title ?? 'InCommand Report'
    page.drawText(title, {
      x: 48,
      y: height - 72,
      size: 20,
      font: fontBold,
      color: rgb(0.14, 0.25, 0.56), // brand-ish blue
    })

    if (report.subtitle) {
      page.drawText(report.subtitle, {
        x: 48,
        y: height - 96,
        size: 12,
        font,
        color: rgb(0.2, 0.2, 0.2),
      })
    }

    // Metadata line
    const when = report.generatedAt ?? new Date().toISOString()
    page.drawText(`Generated: ${when}`, {
      x: 48,
      y: height - 120,
      size: 10,
      font,
      color: rgb(0.35, 0.35, 0.35),
    })

    // Sections
    let cursorY = height - 150
    const lineGap = 14
    const paraGap = 20

    const writeWrapped = (text: string, maxWidth = width - 96, size = 11) => {
      // Handle newlines properly and wrap text
      const paragraphs = text.split('\n')
      const lines: string[] = []
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') {
          lines.push('') // Empty line for paragraph breaks
          continue
        }
        
        const words = paragraph.split(' ')
        let line = ''
        
        for (const w of words) {
          const test = line ? line + ' ' + w : w
          const testWidth = font.widthOfTextAtSize(test, size)
          if (testWidth > maxWidth && line) {
            lines.push(line)
            line = w
          } else {
            line = test
          }
        }
        if (line) lines.push(line)
      }
      
      return lines
    }

    if (report.sections?.length) {
      for (const section of report.sections) {
        // Heading
        page.drawText(section.heading, {
          x: 48,
          y: cursorY,
          size: 12.5,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        })
        cursorY -= paraGap

        // Body
        if (section.body) {
          const lines = writeWrapped(section.body, width - 96, 11)
          for (const l of lines) {
            if (cursorY < 72) {
              // new page
              const p = pdfDoc.addPage()
              cursorY = p.getSize().height - 72
            }
            page.drawText(l, {
              x: 48,
              y: cursorY,
              size: 11,
              font,
              color: rgb(0.12, 0.12, 0.12),
            })
            cursorY -= lineGap
          }
          cursorY -= paraGap / 2
        }
      }
    }

    // Finalise PDF
    const bytes = await pdfDoc.save()

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // Inline preview in browser tab; switch to attachment to force download
        'Content-Disposition': `inline; filename="incommand-report.pdf"`,
        // Prevent caching of sensitive reports
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'Failed to generate report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
