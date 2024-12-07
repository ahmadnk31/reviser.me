import { ProcessedDocument } from '../types';

export async function processText(file: File): Promise<ProcessedDocument> {
  const text = await file.text();
  return {
    content: text,
    type: 'txt'
  };
}