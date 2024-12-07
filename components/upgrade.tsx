"use client"

import { useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { ArrowUpRight, Check, Crown, Rocket, Zap } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SubscriptionForm } from './subscription-form'
import { createClient } from '@/lib/supabase/client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PLANS = [
  {
    name: 'Basic',
    price: 'Free',
    priceId: null,
    features: [
      'Up to 5 decks',
      'Basic analytics',
      'Standard support'
    ],
    icon: <Zap className="text-blue-500 w-8 h-8" />,
    recommended: false
  },
  {
    name: 'Pro',
    price: '$9.99/month',
    priceId: 'price_1QTPH5CwfSQS5OH3R008tbcS', // Replace with your actual Stripe Price ID
    features: [
      'Unlimited decks',
      'Advanced analytics',
      'Priority support',
      'Custom themes'
    ],
    icon: <Rocket className="text-purple-500 w-8 h-8" />,
    recommended: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceId: 'price_YYYYYYYYYY', // Replace with your actual Stripe Price ID
    features: [
      'Unlimited everything',
      'Team collaboration',
      '24/7 dedicated support',
      'Custom integrations'
    ],
    icon: <Crown className="text-gold w-8 h-8" />,
    recommended: false
  }
]

type Plan = typeof PLANS[number]
type UpgradeModalProps = {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export function UpgradeModal({ isOpen, onClose, userEmail }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1])
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)

  const handleUpgrade = () => {
    if (selectedPlan.name === 'Basic') {
      // Handle free plan upgrade logic
      console.log('Upgraded to Basic plan')
      onClose()
    } else {
      setShowSubscriptionForm(true)
    }
  }

  const handleSubscriptionComplete =async (subscriptionId: string, status: string) => {
    console.log('Subscription completed:', subscriptionId, 'Status:', status)
    setSubscriptionStatus(status)
    // Here you would typically update the user's subscription status in your backend
    const supabase=createClient()
    const {data:user}=await supabase.auth.getUser()

    if (user?.user) {
      const {data} = await supabase.from('subscriptions').update({status: status}).eq('user_id', user.user.id)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold">
            Choose Your Learning Path
          </DialogTitle>
        </DialogHeader>
        
        {!showSubscriptionForm && !subscriptionStatus && (
          <>
            <div className="grid grid-cols-3 gap-6 mt-6">
              {PLANS.map((plan) => (
                <div 
                  key={plan.name}
                  className={`
                    border rounded-xl p-6 transition-all duration-300 
                    ${selectedPlan.name === plan.name 
                      ? 'border-primary bg-muted/20 scale-105 shadow-xl' 
                      : 'border-border hover:border-primary/50'}
                  `}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-center justify-between mb-4">
                    {plan.icon}
                    {plan.recommended && (
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        Most Popular
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-2xl font-bold mb-4">{plan.price}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li 
                        key={feature} 
                        className="flex items-center text-muted-foreground"
                      >
                        <Check className="mr-2 w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={selectedPlan.name === plan.name ? 'default' : 'outline'}
                  >
                    {selectedPlan.name === plan.name ? 'Selected' : 'Select Plan'}
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                size="lg" 
                className="group w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={handleUpgrade}
              >
                Upgrade to {selectedPlan.name} Plan
                <ArrowUpRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </>
        )}

        {showSubscriptionForm && !subscriptionStatus && selectedPlan.priceId && (
          <Elements stripe={stripePromise}>
            <SubscriptionForm 
            subscription_type={selectedPlan.name}
              email={userEmail}
              priceId={selectedPlan.priceId}
              onSubscriptionComplete={handleSubscriptionComplete}
            />
          </Elements>
        )}

        {subscriptionStatus && (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Subscription {subscriptionStatus === 'active' ? 'Complete' : 'Pending'}!</h3>
            <p className="mb-6">
              {subscriptionStatus === 'active' 
                ? `Thank you for upgrading to the ${selectedPlan.name} plan.` 
                : 'Your subscription is being processed. You will receive an email confirmation shortly.'}
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function UpgradeButton({ userEmail }: { userEmail: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button 
        variant="outline" 
        className="mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
        onClick={() => setIsModalOpen(true)}
      >
        Upgrade 
        <ArrowUpRight className="ml-2 h-4 w-4" />
      </Button>
      
      <UpgradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        userEmail={userEmail}
      />
    </>
  )
}

