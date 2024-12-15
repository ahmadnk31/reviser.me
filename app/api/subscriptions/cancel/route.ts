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

    // Retrieve the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    // Cancel the subscription at the end of the current billing period
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true, // Key change: don't terminate immediately
    })

    // Calculate the end of the current billing period
    const periodEnd = new Date(subscription.current_period_end * 1000)

    // Update the subscription status in your database
    const { error: dbError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'pending_cancellation', // Use a specific status
        canceled_at: new Date().toISOString(),
        cancel_reason: reason,
        current_period_end: periodEnd.toISOString() // Store when access will actually end
      })
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', session.user.id)

    if (dbError) {
      throw new Error(`Database update failed: ${dbError.message}`)
    }

    // Update the user's subscription status
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ 
        subscription_status: 'pending_cancellation',
        current_period_end: periodEnd.toISOString() 
      })
      .eq('id', session.user.id)

    if (userUpdateError) {
      throw new Error(`User update failed: ${userUpdateError.message}`)
    }

    return NextResponse.json({
      message: 'Subscription will be canceled at the end of the current billing period',
      accessEndDate: periodEnd.toISOString(),
      subscription: canceledSubscription
    })
  } catch (error: any) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to cancel subscription' 
    }, { status: 400 })
  }
}