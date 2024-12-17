import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage } from '@/lib/openai'
import { cookies } from 'next/headers'

// Simple in-memory rate limiter


export async function POST(req: Request) {
  const cookieStore = cookies()
  try {
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting based on subscription tier
    

    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const imageUrl = await generateImage(prompt)

    // Update AI credits used
    const { data:  free_credits  } = await supabase.from('users').select('free_credits').eq('id', user.id).single()
    if (free_credits?.free_credits > 0&&imageUrl) {
      await supabase.from('users').update({ free_credits: free_credits?.free_credits - 2 }).eq('id', user.id)
    }

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error('Image generation error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: error.status || 500 }
    )
  }
}