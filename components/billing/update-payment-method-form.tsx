// components/UpdatePaymentMethodForm.tsx
"use client"

import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { 
  Elements, 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Ensure to use your actual publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface UpdatePaymentMethodFormProps {
  customerId: string
  subscriptionId: string
  onSuccess: () => void
  onCancel: () => void
}

function UpdatePaymentMethodFormContent({
  customerId,
  subscriptionId,
  onSuccess,
  onCancel
}: UpdatePaymentMethodFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      // Create PaymentMethod
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement('card')!,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Send to backend to update payment method
      const response = await fetch('/api/subscriptions/update-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod!.id,
          customerId,
          subscriptionId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment method')
      }

      toast.success('Payment method updated successfully')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex justify-between space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !stripe}
        >
          {isLoading ? 'Updating...' : 'Update Payment Method'}
        </Button>
      </div>
    </form>
  )
}

export function UpdatePaymentMethodForm(props: UpdatePaymentMethodFormProps) {
  const options = {
    mode: 'setup' as const,
    currency: 'usd',
    // You might want to pass additional options here
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <UpdatePaymentMethodFormContent {...props} />
    </Elements>
  )
}