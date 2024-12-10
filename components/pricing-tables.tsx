import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { UpgradeModal } from './upgrade'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from './ui/alert-dialog'
import { toast } from 'sonner'

interface PricingTablesProps {
  billingInterval: 'monthly' | 'yearly'
}

const plans = {
  monthly: [
    {
      name: "Free",
      price: 0,
      features: [
        "5 Decks",
        "50 AI-generated cards per month",
        "Basic analytics",
        "Community support",
      ],
      buttonText: "Get Started",
      priceId: 'free',
    },
    {
      name: "Pro",
      price: 9.99,
      features: [
        "Unlimited decks",
        "200 AI-generated cards per month",
        "Advanced analytics",
        "Priority support",
        "Collaborative features",
        "Custom themes",
      ],
      buttonText: "Subscribe",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    },
    {
      name: "Team",
      price: 29.99,
      features: [
        "Everything in Pro",
        "Unlimited AI-generated cards",
        "Team management",
        "Dedicated support",
        "API access",
        "Custom branding",
      ],
      buttonText: "Subscribe",
      priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID,
    },
  ],
  yearly: [
    {
      name: "Free",
      price: 0,
      features: [
        "5 Decks",
        "50 AI-generated cards per month",
        "Basic analytics",
        "Community support",
      ],
      buttonText: "Get Started",
      priceId: 'free',
    },
    {
      name: "Pro",
      price: 99.0,
      features: [
        "Unlimited decks",
        "200 AI-generated cards per month",
        "Advanced analytics",
        "Priority support",
        "Collaborative features",
        "Custom themes",
      ],
      buttonText: "Subscribe",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
    },
    {
      name: "Team",
      price: 287.88,
      features: [
        "Everything in Pro",
        "Unlimited AI-generated cards",
        "Team management",
        "Dedicated support",
        "API access",
        "Custom branding",
      ],
      buttonText: "Subscribe",
      priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID,
    },
  ],
}

export function PricingTables({ billingInterval }: PricingTablesProps) {
  const [loading, setLoading] = useState<string | null>(null)

  
  const supabase = createClient();
  const [subscription_status, setSubscriptionStatus] = useState<string | null>(null);
  const currentPlans = plans[billingInterval]
  const [openUpgradeModal, setOpenUpgradeModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null);
  const [openLoginMessage, setOpenLoginMessage] = useState(false)
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        setUserId(user.user.id);
      }
      if (user.user === null) {
        return;
      }
      const { data: subscription_status } = await supabase.from('users').select('subscription_status').eq('id', user.user?.id).single();
      setSubscriptionStatus(subscription_status?.subscription_status);
    };
    fetchSubscriptionStatus();
  }, []);
  const handleUpgradeModal=()=>{
    if(subscription_status!=='active'&&userId){
      setOpenUpgradeModal(true);
    }else if(!userId){
      setOpenLoginMessage(true);
    }
  }
  return (
    <div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <LoginMessage isOpen={openLoginMessage} onClose={()=>setOpenLoginMessage(false)} />
      <UpgradeModal isOpen={openUpgradeModal} onClose={()=>setOpenUpgradeModal(false)} />
      {subscription_status!=='active'&&currentPlans.map((plan, index) => (
        <motion.div
          key={plan.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
          className={`relative overflow-hidden rounded-lg border bg-background p-8 ${
            plan.name === "Pro" ? "ring-2 ring-primary" : ""
          }`}
        >
          {plan.name === "Pro" && (
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 rotate-45">
              <div className="bg-primary px-8 py-1 text-xs text-primary-foreground">
                Popular
              </div>
            </div>
          )}
          <div className="mb-8">
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold">${plan.price}</span>
              {plan.price > 0 && (
                <span className="text-muted-foreground">
                  /{billingInterval === "yearly" ? "year" : "month"}
                </span>
              )}
              {billingInterval === "yearly" && plan.price > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  ${(plan.price / 12).toFixed(2)} per month when billed yearly
                </p>
              )}
            </div>
          </div>
          <ul className="mb-8 space-y-4">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            className="w-full"
            variant={plan.name === "Pro" ? "default" : "outline"}
            onClick={handleUpgradeModal}
            disabled={loading === plan.priceId}
          >
            {loading === plan.priceId ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              plan.buttonText
            )}
          </Button>
        </motion.div>
      ))}
      
    </div>
    {
       subscription_status==='active'&&<div className='flex items-center justify-center'>
        <Link href="/dashboard/billing">
        <Button>
          Manange Subscription
        </Button>
        </Link>
        </div>
      }
    </div>
  )
}

type UpgradeModalProps = {
  isOpen: boolean
  onClose: () => void
}
const LoginMessage = ({isOpen,onClose}:UpgradeModalProps) => {
  return(
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogTitle>
          Please login to upgrade your plan
        </AlertDialogTitle>
        <AlertDialogDescription>
          <Link href="/login">
          <Button>
            Login
          </Button>
          </Link>
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>
           Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}