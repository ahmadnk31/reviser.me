'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Menu, Crown, LucideLayoutDashboard } from 'lucide-react'
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FeedbackDialog } from "./feedback-dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
type User = {
  id: string
  email?: string|undefined
  user_metadata: {
    avatar_url: string
  }
}
export function SiteHeader() {
  const [user,setUser]=useState<User>()
  const supabase = createClient()
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const router=useRouter()
 
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      const { data: {user} } = await supabase.auth.getUser();
      if (user) {
        const customUser: User = {
          id: user.id,
          email: user.email,
          user_metadata: {
            avatar_url: user.user_metadata.avatar_url || ''
          }
        };
        setUser(customUser);
      }
      console.log(`user: ${user}`)
      const { data: subscription_status } = await supabase.from('users').select('subscription_status').eq('id', user?.id).single();
      setSubscriptionStatus(subscription_status?.subscription_status);
    };
    fetchSubscriptionStatus();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }


  const MobileNavItems = () => (
    <>
      <Button variant="ghost" asChild className="w-full justify-start">
        <Link href="/dashboard">
        <LucideLayoutDashboard className="size-6 mr-2" />
        Dashboard</Link>
      </Button>
      <FeedbackDialog />
    </>
  )

  return (
    <header className="sticky  top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto px-5 flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span className="font-bold">Reviser</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {user?.id ? (
            <>
              <div className="hidden md:flex items-center space-x-4">
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <FeedbackDialog />
              </div>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {subscriptionStatus === 'active' && (
                      <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                        <Crown className="h-3 w-3 text-background" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={signOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <div className="flex flex-col space-y-4 mt-4">
                    <MobileNavItems />
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Login
              </Link>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </header>
  )
}

