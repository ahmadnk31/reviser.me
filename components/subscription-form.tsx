'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'

interface StripePaymentFormProps {
  priceId: string
  subscriptionType: string
  onSubscriptionComplete: (subscriptionId: string, status: string) => void
}

export function StripePaymentForm({
  priceId,
  subscriptionType,
  onSubscriptionComplete
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      })

      if (result.error) {
        throw new Error(result.error.message || 'An error occurred during payment.')
      }

      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Create subscription
        const subscriptionResponse = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: result.paymentIntent.id,
            priceId,
            subscription_type: subscriptionType,
          }),
        })

        if (!subscriptionResponse.ok) {
          throw new Error('Failed to create subscription')
        }

        const { subscriptionId, status } = await subscriptionResponse.json()
        onSubscriptionComplete(subscriptionId, status)
      } else {
        throw new Error('Payment was not successful')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <div className="text-red-500 mt-2">{error}</div>}
      <Button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="mt-4"
      >
        {processing ? 'Processing...' : 'Subscribe'}
      </Button>
    </form>
  )
}

