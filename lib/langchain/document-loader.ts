import type { DocumentChunk } from "@/lib/types"
import * as pdfjs from 'pdfjs-dist'

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

async function extractPdfText(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    pages.push(text)
  }

  return pages
}

async function extractDocxText(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer()
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer })
  return [result.value]
}

export async function loadAndChunkDocument(file: File): Promise<DocumentChunk[]> {
  try {
    let textContent: string[] = []

    if (file.type.includes('pdf')) {
      textContent = await extractPdfText(file)
    } else if (file.type.includes('document')) {
      textContent = await extractDocxText(file)
    } else if (file.type.includes('text')) {
      const text = await file.text()
      textContent = [text]
    }

    // Split into chunks of roughly 1000 characters
    const chunks: DocumentChunk[] = []
    const chunkSize = 1000
    
    textContent.forEach((text, pageIndex) => {
      let start = 0
      while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length)
        // Try to end at a sentence or paragraph break
        const breakPoint = text.substring(start, end).lastIndexOf('.')
        const actualEnd = breakPoint > 0 ? start + breakPoint + 1 : end

        chunks.push({
          text: text.substring(start, actualEnd).trim(),
          metadata: {
            pageNumber: pageIndex + 1,
            source: file.name
          }
        })

        start = actualEnd
      }
    })

    return chunks
  } catch (error) {
    console.error('Error loading document:', error)
    throw new Error('Failed to load document')
  }
}
