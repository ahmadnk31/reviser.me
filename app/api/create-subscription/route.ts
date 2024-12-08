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

    const { paymentIntentId, priceId, subscription_type } = await req.json()

    if (!paymentIntentId || !priceId || !subscription_type) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Retrieve the payment intent to get the customer ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    const customerId = paymentIntent.customer as string

    if (!customerId) {
      return NextResponse.json(
        { error: 'No customer found for this payment' },
        { status: 400 }
      )
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    })

    // Check if the subscription is active or if additional action is needed
    if (subscription.status !== 'active') {
      const invoice = subscription.latest_invoice as Stripe.Invoice
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

      if (paymentIntent.status === 'requires_action') {
        return NextResponse.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
          status: 'requires_action',
        })
      } else {
        // If it's not active and doesn't require action, something went wrong
        throw new Error(`Unexpected subscription status: ${subscription.status}`)
      }
    }

    // Save subscription information to your database
    const { data: savedSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: session.user.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.status,
        price_id: priceId,
        price: subscription.items.data[0].price.unit_amount,
        currency: subscription.items.data[0].price.currency,
        subscription_type: subscription_type,
        quantity: 1,
        cancel_at_period_end: false,
        created_at: new Date(subscription.created * 1000).toISOString(),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Failed to save subscription: ${dbError.message}`)
    }

    // Update user's subscription information
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        current_subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_type: subscription_type,
      })
      .eq('id', session.user.id)

    if (userUpdateError) {
      console.error('Error updating user subscription info:', userUpdateError)
      // Consider whether to throw an error here or handle it differently
      throw new Error(`Failed to update user subscription info: ${userUpdateError.message}`)
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      dbSubscription: savedSubscription,
    })
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

