import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage } from '@/lib/openai'
import { cookies } from 'next/headers'

// Simple in-memory rate limiter
class RateLimiter {
  private static requestCounts: Map<string, { count: number, resetTime: number }> = new Map()

  static checkLimit(userId: string, maxRequests: number = 10, windowMs: number = 3600000) {
    const now = Date.now()
    
    const userLimit = this.requestCounts.get(userId)

    // Reset if past the reset time
    if (!userLimit || userLimit.resetTime < now) {
      this.requestCounts.set(userId, { 
        count: 1, 
        resetTime: now + windowMs
      })
      return true
    }

    // Check if user has exceeded limit
    if (userLimit.count >= maxRequests) {
      return false
    }

    // Increment count
    this.requestCounts.set(userId, {
      count: userLimit.count + 1,
      resetTime: userLimit.resetTime
    })

    return true
  }
}

export async function POST(req: Request) {
  const cookieStore = cookies()
  try {
    const supabase = createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user's subscription tier and AI credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_type, ai_credits_used')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Rate limiting based on subscription tier
    const rateLimitMap = {
      free: { maxRequests: 10, windowMs: 3600000 }, // 10 requests per hour
      pro: { maxRequests: 50, windowMs: 3600000 },  // 50 requests per hour
      team: { maxRequests: 100, windowMs: 3600000 } // 100 requests per hour
    }

    const tierRateLimit = rateLimitMap[user.subscription_type as keyof typeof rateLimitMap] || 
      rateLimitMap.free // Default to free tier if not found

    // Check rate limit
    const isRateLimitPassed = RateLimiter.checkLimit(
      session.user.id, 
      tierRateLimit.maxRequests, 
      tierRateLimit.windowMs
    )

    if (!isRateLimitPassed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 } // Too Many Requests
      )
    }

    // Check AI credits limit based on subscription tier
    const creditLimits = {
      free: 10,
      pro: 50,
      team: 100,
    }

    const limit = creditLimits[user.subscription_type as keyof typeof creditLimits] || 0

    if (user.ai_credits_used >= limit) {
      return NextResponse.json(
        { error: 'AI credits limit reached for your plan' },
        { status: 403 }
      )
    }

    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const imageUrl = await generateImage(prompt)

    // Update AI credits used
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        ai_credits_used: (user.ai_credits_used || 0) + 1 
      })
      .eq('id', session.user.id)
    
    if (updateError) {
      console.error('Failed to update AI credits:', updateError)
      return NextResponse.json(
        { error: 'Failed to update AI credits' },
        { status: 500 }
      )
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