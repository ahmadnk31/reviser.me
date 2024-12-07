"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PricingTables } from "@/components/pricing-tables"
import { Brain } from "lucide-react"
import { motion } from "framer-motion"

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-12">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that's right for you
            </p>
          </motion.div>

          <div className="flex items-center justify-center mt-8 ">
            <div className="relative flex bg-muted rounded-full p-2">
              <Button
              className="rounded-full"
                variant={billingInterval === "monthly" ? "default" : "ghost"}
                size="lg"
                onClick={() => setBillingInterval("monthly")}
              >
                Monthly
              </Button>
              <Button
                className="rounded-full"
                variant={billingInterval === "yearly" ? "default" : "ghost"}
                size="lg"
                onClick={() => setBillingInterval("yearly")}
              >
                Yearly
                <span className="ml-1.5 text-xs font-normal">-20%</span>
              </Button>
            </div>
          </div>
        </div>

        <PricingTables billingInterval={billingInterval} />

        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                q: "Can I switch plans later?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, debit cards, and popular payment methods through Stripe.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes, all paid plans come with a 14-day free trial. No credit card required.",
              },
              {
                q: "How do AI credits work?",
                a: "AI credits are used for generating flashcards and images. They refresh monthly based on your plan.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. No questions asked.",
              },
              {
                q: "Do you offer refunds?",
                a: "Yes, we offer a 30-day money-back guarantee for all paid plans.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-lg p-6 shadow-sm"
              >
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}