import { ProcessedDocument } from '../types';

export async function processImage(file: File): Promise<ProcessedDocument> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();
  
  return {
    content: text,
    type: 'image'
  };
}