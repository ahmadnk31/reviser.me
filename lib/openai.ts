import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateFlashcardsPrompt(topic: string, count: number = 5) {
  try {
    const prompt = `Create ${count} educational flashcards about "${topic}". 
    Each flashcard should have a clear question on the front and a concise answer on the back.
    Format the response as a JSON object with this exact structure: 
    {
      "flashcards": [
        {
          "front": "question",
          "back": "answer"
        }
      ]
    }`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful AI that creates educational flashcards. Always respond with properly formatted JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(error.message || 'Failed to generate flashcards');
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Educational illustration for: ${prompt}. Style: Clear, professional, suitable for learning.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL received from OpenAI');
    }

    return imageUrl;
  } catch (error: any) {
    console.error('OpenAI Image Generation error:', error);
    throw new Error(error.message || 'Failed to generate image');
  }
}