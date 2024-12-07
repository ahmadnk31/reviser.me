// app/api/subscriptions/cancel/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
  const cookieStore = cookies()
  
  try {
    const supabase = await createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { subscriptionId, reason } = await req.json()

    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId)

    // Update the subscription status in your database
    const { error: dbError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled', 
        canceled_at: new Date().toISOString(),
        cancel_reason: reason 
      })
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', session.user.id)

    if (dbError) {
      throw new Error(`Database update failed: ${dbError.message}`)
    }

    return NextResponse.json({
      message: 'Subscription canceled successfully',
      subscription: canceledSubscription
    })
  } catch (error: any) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to cancel subscription' 
    }, { status: 400 })
  }
}