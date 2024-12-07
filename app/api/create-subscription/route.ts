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

    const { email, paymentMethodId, priceId,subscription_type} = await req.json()
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (!email || !paymentMethodId || !priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    let customerId = user?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
        metadata: {
          supabase_user_id: session.user.id,
        },
      })
      customerId = customer.id

      // Save Stripe customer ID
      await supabase
        .from('users')
        .update({ 
            stripe_customer_id: customerId,
            stripe_default_payment_method: paymentMethodId,
            payment_method_last4: paymentMethod.card?.last4,
            payment_method_brand: paymentMethod.card?.brand,
            payment_method_expiry: `${paymentMethod.card?.exp_year}-${paymentMethod.card?.exp_month}-01`
         })
        .eq('id', session.user.id)
    } else {
      // Update the customer's payment method
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      })
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

    // Save subscription information
    const { data: savedSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: session.user.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.items.data[0].plan.active? 'active' : 'incomplete',
        price_id: priceId,
        subscription_type:subscription_type,
        quantity: 1,
        price: subscription.items.data[0].price.unit_amount,
        currency: subscription.items.data[0].price.currency, 
        cancel_at_period_end: false,
        created_at: new Date(subscription.created * 1000).toISOString(),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      })
      .select()
      .single()
      await supabase
      .from('users')
      .update({
        current_subscription_id: subscription.id,
        subscription_status: subscription.items.data[0].plan.active? 'active' : 'incomplete',
        subscription_type: subscription_type,
        subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', session.user.id)
    if (dbError) {
      throw new Error(`Failed to save subscription: ${dbError.message}`)
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      status: subscription.status,
      dbSubscription: savedSubscription,
    })
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

