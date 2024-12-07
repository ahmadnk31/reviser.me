import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { openai } from '@/lib/openai';
import { searchSimilarDocuments } from '@/lib/embeddings';
import type { QuestionGenRequest } from '@/lib/types';

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: QuestionGenRequest = await req.json();
    const { documentId, pageNumber, topic, count = 5 } = body;

    // Get relevant content using vector similarity search
    const similarSections = await searchSimilarDocuments(
      topic || 'general content',
      parseInt(documentId, 10)
    );

    if (!similarSections.length) {
      return NextResponse.json(
        { error: 'No relevant content found' },
        { status: 404 }
      );
    }

    // Combine relevant sections
    const relevantContent = similarSections
      .map((section: { content: any; }) => section.content)
      .join('\n\n');

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Generate educational questions and answers based on the provided content. Format as JSON with 'questions' array containing objects with 'front' (question) and 'back' (answer) properties."
        },
        {
          role: "user",
          content: `Generate ${count} questions and answers about ${topic || 'the following content'}:\n\n${relevantContent}`
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

    const data = JSON.parse(content);
    return NextResponse.json({ questions: data.questions });
  } catch (error: any) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate questions' },
      { status: 500 }
    );
  }
}