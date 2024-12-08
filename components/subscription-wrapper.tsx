'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { StripePaymentForm } from './subscription-form'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeSubscriptionWrapperProps {
  priceId: string
  subscriptionType: string
  onSubscriptionComplete: (subscriptionId: string, status: string) => void
}

export function StripeSubscriptionWrapper({
  priceId,
  subscriptionType,
  onSubscriptionComplete
}: StripeSubscriptionWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch client secret')
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (error) {
        console.error('Error fetching client secret:', error)
      }
    }

    fetchClientSecret()
  }, [priceId])

  if (!clientSecret) {
    return <div>Loading...</div>
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripePaymentForm
        priceId={priceId}
        subscriptionType={subscriptionType}
        onSubscriptionComplete={onSubscriptionComplete}
      />
    </Elements>
  )
}

