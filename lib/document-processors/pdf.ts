import { ProcessedDocument } from '../types';

export async function processPdf(file: File): Promise<ProcessedDocument> {
  const pdfjs = await import('pdfjs-dist');
  
  // Set worker source using the correct version
  const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${process.env.NEXT_PUBLIC_PDFJS_VERSION}/pdf.worker.min.js`;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `Page ${i}\n${pageText}\n\n`;
    }
    
    return {
      content: fullText.trim(),
      pageCount: pdf.numPages,
      type: 'pdf'
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('Failed to process PDF file');
  }
}