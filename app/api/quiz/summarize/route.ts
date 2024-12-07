import { createClient } from '@/lib/supabase/server'; 
import { ChatOpenAI } from "@langchain/openai"; 
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers"; 
import { cookies } from 'next/headers'; 
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { documentId, topic } = await req.json();
    if (!documentId) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
    }
    console.log(documentId, topic);
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Fetch document with error handling
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('content, title')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Normalize document content 
    const documentContent = Array.isArray(document.content) 
      ? document.content.join('\n')
      : typeof document.content === 'string' 
        ? document.content
        : JSON.stringify(document.content);

    // Validate document content
    if (!documentContent.trim()) {
      return NextResponse.json({ error: "Empty document content" }, { status: 400 });
    }

    const llm = new ChatOpenAI({ 
      model: "gpt-4o", 
      temperature: 0.3 
    });

    // Dynamic prompt based on topic
    const summaryPrompt = ChatPromptTemplate.fromTemplate(`
      ${topic 
        ? `Provide a focused summary of the following content specifically addressing ${topic}:`
        : 'Provide a comprehensive summary of the following content:'}

      Content: {content}
      Summary Guidelines:
      - Use the document's original language
      - Capture key points and main ideas
      - Be concise but informative
      Summary:`);

    const summaryChain = summaryPrompt
      .pipe(llm)
      .pipe(new StringOutputParser());

    const summary = await summaryChain.invoke({
      content: documentContent
    });

    // Store summary in Supabase with error handling
    const { error: insertError } = await supabase.from('document_summaries').insert({
      document_id: documentId,
      summary,
      metadata: { topic }
    });

    if (insertError) {
      console.error('Failed to store summary:', insertError);
      // Optional: Decide whether to fail the request or continue
    }

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}