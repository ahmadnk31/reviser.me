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

    // Initialize streaming-enabled LLM
    const llm = new ChatOpenAI({
      model: "gpt-4",
      temperature: 0.3,
      streaming: true
    });

    const summaryPrompt = ChatPromptTemplate.fromTemplate(`
      Generate a summary of the following content and generate the summary based on the language of the document using proper Markdown formatting.
      ${topic ? `Focus specifically on aspects related to: ${topic}` : ''}

      # Content to Summarize
      {content}

      # Output Requirements

      1. Use proper Markdown formatting for all sections
      2. Format all headings as follows:
         - Main sections: # SECTION NAME (all caps)
         - Subsections: ## Subsection Name (Title Case)
         - Sub-subsections: ### Sub-subsection Name (Title Case)
      3. Use proper Markdown formatting for:
         - Bullet points with '-' or '*'
         - Code blocks with triple backticks
         - Emphasis with *italic* or **bold** where appropriate
         - Block quotes with > where relevant
      
      # Required Structure
      Please structure the summary exactly as follows:

      # EXECUTIVE SUMMARY
      (2-3 sentences overview)

      # KEY FINDINGS
      (Main points in bullet form)

      # DETAILED ANALYSIS
      (Break down by topics with ## subheadings)

      # CONCLUSIONS
      (Final thoughts and recommendations)

      Each section must maintain proper Markdown formatting and hierarchical structure.
      Use bold for important terms and concepts.
      Maintain a professional tone throughout the summary.
      Make sure to include all key points and findings.
      Respond in the language of the document.
      Add horizontal rules (---) between major sections.
      Ensure consistent formatting throughout the document.

      Begin summary:`);

    // Create transform stream for SSE
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the streaming response
    const response = new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    // Process the streaming response
    const summaryChain = summaryPrompt.pipe(llm).pipe(new StringOutputParser());
    let fullSummary = '';

    // Start processing in the background
    (async () => {
      try {
        const iterator = await summaryChain.stream({
          content: documentContent
        });

        for await (const chunk of iterator) {
          // Accumulate the full summary
          fullSummary += chunk;

          // Send chunk as SSE
          const event = {
            data: chunk,
            timestamp: Date.now()
          };
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }

        // Store the complete summary in Supabase
        const { error: insertError } = await supabase.from('document_summaries').insert({
          document_id: documentId,
          summary: fullSummary,
          metadata: { topic }
        });

        if (insertError) {
          console.error('Failed to store summary:', insertError);
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ error: 'Failed to store summary' })}\n\n`)
          );
        }

        // Send completion event
        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      } catch (error) {
        console.error('Streaming error:', error);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`)
        );
        await writer.close();
      }
    })();

    return response;

  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}