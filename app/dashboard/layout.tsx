'use client'

import { AppSidebar } from "@/components/dashboard-sidebar";
import { Toaster } from "@/components/ui/sonner"
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
export default function Layout({ children }:{
    children: React.ReactNode
}) {
    return (
        <SidebarProvider
        >
      <AppSidebar />
      <main className="w-full">
        <SidebarTrigger className="ml-8 mt-4" />
        <Elements stripe={stripePromise}>
          {children}
        </Elements>
        <Toaster />
      </main>
    </SidebarProvider>
    );
    }