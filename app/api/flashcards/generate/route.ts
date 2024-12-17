import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateFlashcardsPrompt } from '@/lib/openai';
import type { FlashcardResponse, APIError } from '@/lib/types';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(req: Request) {
  const cookieStore=cookies()
  const supabase = await createClient(cookieStore);
  try {
    // Validate request body
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json<APIError>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<APIError>(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const topic = body?.topic?.trim();
    const count = Math.min(Math.max(Number(body?.count) || 5, 1), 10);

    if (!topic) {
      return NextResponse.json<APIError>(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Generate flashcards
    const data = await generateFlashcardsPrompt(topic, count);
    const {data:free_credits}=await supabase.from('users').select('free_credits').eq('id',user.id).single()
    if(free_credits?.free_credits>0&&data.flashcards.length>0){
      await supabase.from('users').update({free_credits:free_credits?.free_credits-1}).eq('id',user.id)
    }
    return NextResponse.json<FlashcardResponse>(data);
  } catch (error: any) {
    console.error('Flashcard generation error:', error);
    
    return NextResponse.json<APIError>(
      { error: error.message || 'Failed to generate flashcards' },
      { status: error.status || 500 }
    );
  }
}