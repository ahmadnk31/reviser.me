import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { openai } from '@/lib/openai';
import { searchSimilarDocuments} from '@/lib/embeddings';

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { documentId,topic } = await req.json();
    console.log(documentId, topic);
    // Get document content using vector similarity search
    const sections = await searchSimilarDocuments('main points and key ideas', documentId);
    const content = sections
      .map((section: { content: any; }) => section.content)
      .join('\n\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate a concise summary of the provided content, highlighting the main points and key ideas."
        },
        {
          role: "user",
          content
        }
      ],
    });

    const summary = completion.choices[0].message.content;
    if (!summary) {
      throw new Error('No summary generated');
    }

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}