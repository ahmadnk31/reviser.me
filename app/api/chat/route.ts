import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { openai } from '@/lib/openai';
import { searchSimilarDocuments } from '@/lib/embeddings';

export const runtime = 'edge';

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { documentId, message, sessionId } = await req.json();

    // Get relevant content using vector similarity search
    const similarSections = await searchSimilarDocuments(message, documentId);
    const relevantContent = similarSections
      .map((section: { content: any; }) => section.content)
      .join('\n\n');

    // Get recent chat history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions about documents. Use the following content to inform your responses:\n\n${relevantContent}`
        },
        ...(history?.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })) || []),
        { role: "user", content: message }
      ],
      stream: true,
    });

    // Create a stream
    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        // Save the message to the database
        await supabase.from('chat_messages').insert([
          {
            session_id: sessionId,
            role: 'user',
            content: message,
          },
          {
            session_id: sessionId,
            role: 'assistant',
            content: completion,
          }
        ]);
      },
    });

    // Return the stream
    return new StreamingTextResponse(stream);
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: 500 }
    );
  }
}