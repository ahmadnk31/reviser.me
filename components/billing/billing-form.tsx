"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { UpdatePaymentMethodForm } from './update-payment-method-form'
import { CancelSubscriptionDialog } from './cancel-subscription-dialog'

type BillingFormProps = {
  subscription: any
  userEmail: string
}

export function BillingForm({ subscription, userEmail }: BillingFormProps) {
  const router = useRouter()
  const [showUpdatePaymentMethod, setShowUpdatePaymentMethod] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const handleUpdateSuccess = async () => {
    // Logic to update payment method
    setShowUpdatePaymentMethod(false)
    router.refresh()
  }


console.log(subscription)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Details</CardTitle>
        <CardDescription>Manage your subscription and billing information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
       {subscription?.status === 'active' ? (
        <>
         <div>
          <h3 className="text-lg font-medium">Current Plan</h3>
          <p className="text-sm text-gray-500">
            {subscription?.subscription_type || 'No active subscription'}
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium">Billing Cycle</h3>
          <p className="text-sm text-gray-500">
            {subscription
              ? `${new Date(subscription.current_period_start).toLocaleDateString()} to ${new Date(subscription.current_period_end).toLocaleDateString()}`
              : 'N/A'}
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium">Next Invoice</h3>
          <p className="text-sm text-gray-500">
            {subscription
              ? `${new Date(subscription.current_period_end).toLocaleDateString()}`
              : 'N/A'}
          </p>
        </div>
        {showUpdatePaymentMethod && (
            <UpdatePaymentMethodForm
              customerId={subscription.stripe_customer_id}
              subscriptionId={subscription.stripe_subscription_id}
              onSuccess={handleUpdateSuccess}
              onCancel={() => setShowUpdatePaymentMethod(false)}
            />
          )}
        </>
       ):(
        <div>
          <h3 className="text-lg font-medium">No active subscription</h3>
          </div>
       )}
      </CardContent>
      {
        subscription?.status==='active'&&(
            <>
            <CardFooter className="flex flex-col md:flex-row justify-between">
        <Button
          variant="outline"
          onClick={() => setShowUpdatePaymentMethod(true)}
          disabled={showUpdatePaymentMethod}
        >
          Update Payment Method
        </Button>
        <Button 
            variant="destructive" 
            onClick={() => setShowCancelDialog(true)}
            disabled={subscription.status !== 'active'}
          >
            Cancel Subscription
          </Button>
      </CardFooter>
      <CancelSubscriptionDialog 
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        subscriptionId={subscription.stripe_subscription_id}
      />
            </>
        )
      }
    </Card>
  )
}

