// app/api/subscriptions/update-payment-method/route.ts
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

    const { 
      paymentMethodId, 
      customerId, 
      subscriptionId 
    } = await req.json()

    // Attach the new payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Update the customer's default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { 
        default_payment_method: paymentMethodId 
      },
    })

    // Update the subscription's default payment method
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        default_payment_method: paymentMethodId,
      }
    )

    // Update the payment method in your database if needed
    const { error: dbError } = await supabase
      .from('users')
      .update({ 
        stripe_default_payment_method: paymentMethodId 
      })
      .eq('id', session.user.id)

    if (dbError) {
      throw new Error(`Database update failed: ${dbError.message}`)
    }

    return NextResponse.json({
      message: 'Payment method updated successfully',
      subscription: updatedSubscription
    })
  } catch (error: any) {
    console.error('Payment method update error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to update payment method' 
    }, { status: 400 })
  }
}