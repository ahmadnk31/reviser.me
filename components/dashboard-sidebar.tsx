'use client'
import { BarChart2, BotIcon, Brain, Calendar, FileType2Icon, Home, Inbox, MessageSquareQuote, Search, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { UpgradeModal } from "./upgrade"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// Menu items.
const items = [
    {
      title: "Decks",
      href: "/dashboard",
      icon: Brain,
    },
    {
      title: "Quizzes",
      href: "/dashboard/quiz",
      icon: FileType2Icon,
    },
    {
      title:"Chats",
      href:"/dashboard/quiz/chats",
      icon:BotIcon
    },
    
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart2,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
        title:'Feedbacks',
        href:'/dashboard/feedbacks',
        icon: MessageSquareQuote
    },
    {
        title: "Billing",
        href: "/dashboard/billing",
        icon: Inbox,
    }
  ]
  


export function AppSidebar() {
    const [open, setOpen] = useState(false)
    const pathname=usePathname()
    const supabase=createClient()
    const [userId, setUserId] = useState<string>('')
    const [user, setUser] = useState<string>('')
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>('')
    useEffect(() => {
        async function fetchUser() {
            try {
                const { data, error } = await supabase.auth.getUser()
                if (error) throw error
                setUser(data.user.email ?? '')
                setUserId(data.user.id)
            } catch (error) {
                console.error('Error fetching user:', error)
            }
        }
        fetchUser()
    }
    , [])
    useEffect(() => {
        async function fetchSubscriptionStatus() {
            if(userId){
              try {
                const { data, error } = await supabase.from('subscriptions').select('status').eq('user_id', userId).single()
                if (error) throw error
                setSubscriptionStatus(data.status)
            } catch (error) {
                console.log('Error fetching subscription status:', error)
            }
            }
        }
        fetchSubscriptionStatus()
    }, [user])
    console.log(subscriptionStatus)
  return (
    <>
     <UpgradeModal
            isOpen={open}
            onClose={() => setOpen(false)}
            userEmail={user}
         /> 
    <Sidebar className="bg-background pt-14">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem  key={item.title}>
                  <SidebarMenuButton className={cn(
                    "flex items-center hover:bg-accent",
                    pathname===item.href ? "text-primary" : "text-muted-foreground"
                  )} asChild>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {
        subscriptionStatus!=='active' && (
          <SidebarFooter className="bg-background">
        <Button
          className="w-full"
          onClick={() => setOpen(true)}
        >
            Upgrade Plan
        </Button>
        </SidebarFooter>
        )
      }

    </Sidebar>
    </>
  )
}


