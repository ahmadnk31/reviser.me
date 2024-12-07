// components/CancelSubscriptionDialog.tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface CancelSubscriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  subscriptionId: string
}

export function CancelSubscriptionDialog({ 
  isOpen, 
  onClose, 
  subscriptionId 
}: CancelSubscriptionDialogProps) {
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          reason: reason || 'No reason provided'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      toast.success('Subscription canceled successfully')
      router.refresh()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your subscription?
          </DialogDescription>
        </DialogHeader>
        
        <Textarea 
          placeholder="Optional: Tell us why you're canceling (helps us improve)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Keep Subscription
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancelSubscription}
            disabled={isLoading}
          >
            {isLoading ? 'Canceling...' : 'Cancel Subscription'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}