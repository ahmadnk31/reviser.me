import { ProcessedDocument } from './types';
import { openai } from './openai';

export async function processDocument(file: File): Promise<ProcessedDocument> {
  try {
    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Use GPT-4 Vision to analyze the document
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Extract and format all the text content from this document. Preserve the structure and formatting as much as possible." 
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 4096
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content extracted from document');
    }

    return {
      content,
      type: file.type.includes('pdf') ? 'pdf' : 
            file.type.includes('text') ? 'txt' :
            file.type.includes('document') ? 'docx' : 'image'
    };
  } catch (error) {
    console.error('Document processing error:', error);
    throw new Error('Failed to process document');
  }
}