import { ProcessedDocument } from '../types';

export async function processDocx(file: File): Promise<ProcessedDocument> {
  const { extractRawText } = await import('mammoth/mammoth.browser');
  const arrayBuffer = await file.arrayBuffer();
  const result = await extractRawText({ arrayBuffer });
  return {
    content: result.value,
    type: 'docx'
  };
}