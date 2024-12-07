"use client"

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'

type SubscriptionFormProps = {
  email: string
  priceId: string
  subscription_type: string
  onSubscriptionComplete: (subscriptionId: string, status: string) => void
}

export function SubscriptionForm({ email, priceId, onSubscriptionComplete,subscription_type }: SubscriptionFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError(null)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error("Card element not found")

      const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (cardError) throw cardError

      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          paymentMethodId: paymentMethod.id,
          priceId,
            subscription_type
        }),
      })

      const { subscriptionId, clientSecret, status, dbSubscription, error: serverError } = await response.json()
      if (serverError) throw new Error(serverError)

      if (status === 'incomplete') {
        if (!clientSecret) throw new Error("No client secret returned from the server")

        const { error: confirmationError, paymentIntent } = await stripe.confirmCardPayment(clientSecret)
        if (confirmationError) throw confirmationError

        if (paymentIntent.status === 'succeeded') {
          onSubscriptionComplete(subscriptionId, 'active')
        } else {
          onSubscriptionComplete(subscriptionId, 'incomplete')
        }
      } else if (status === 'active') {
        onSubscriptionComplete(subscriptionId, status)
      } else {
        throw new Error(`Unexpected subscription status: ${status}`)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during the subscription process.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement className="p-3 border rounded-md" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Processing...' : 'Subscribe'}
      </Button>
    </form>
  )
}

