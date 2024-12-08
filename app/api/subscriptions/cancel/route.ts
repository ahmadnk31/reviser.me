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

    // Cancel the subscription in Stripe immediately
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    let refundAmount = 0
    // Only attempt to process a refund if there's an associated invoice
    if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
      // Calculate the amount to be refunded (if any)
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
      const now = new Date()
      const daysLeft = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 3600 * 24))
      const totalDays = Math.ceil((currentPeriodEnd.getTime() - new Date(subscription.current_period_start * 1000).getTime()) / (1000 * 3600 * 24))
      refundAmount = Math.round((daysLeft / totalDays) * subscription.items.data[0].price.unit_amount! * 100) / 100

      // Create a refund if there's an amount to refund
      if (refundAmount > 0 && subscription.latest_invoice.payment_intent) {
        try {
          await stripe.refunds.create({
            payment_intent: subscription.latest_invoice.payment_intent as string,
            amount: Math.round(refundAmount),
          })
        } catch (refundError) {
          console.error('Refund processing error:', refundError)
          // Continue with cancellation even if refund fails
        }
      }
    }

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

    // Update the user's subscription status
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ subscription_status: 'canceled' })
      .eq('id', session.user.id)

    if (userUpdateError) {
      throw new Error(`User update failed: ${userUpdateError.message}`)
    }

    return NextResponse.json({
      message: 'Subscription canceled successfully',
      subscription: canceledSubscription,
      refundAmount: refundAmount > 0 ? refundAmount : 0
    })
  } catch (error: any) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to cancel subscription' 
    }, { status: 400 })
  }
}

