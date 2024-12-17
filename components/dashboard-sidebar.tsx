'use client'
import { BarChart2, BotIcon, Brain, Calendar, CoinsIcon, FileType2Icon, Home, Inbox, LifeBuoyIcon, MessageSquareQuote, Search, Settings, SparklesIcon } from "lucide-react"

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
import { checkUserAccess } from "@/lib/check-access"
import { BorderBeam } from "./ui/border-beam"

// Menu items.
const adminItems = [
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
    },
    {
      title:"Support",
      href:"/dashboard/support",
      icon:LifeBuoyIcon
    }
  ]
  
  const userItems = [
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
        title: "Billing",
        href: "/dashboard/billing",
        icon: Inbox,
    },
    
  ]
  


export function AppSidebar() {
    const [open, setOpen] = useState(false)
    const pathname=usePathname()
    const supabase=createClient()
    const [userId, setUserId] = useState<string>('')
    const [user, setUser] = useState<string>('')
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>('')
    const [hasAccess,setHasAccess]=useState<boolean>(false)
    const [credit, setCredit] = useState<number>(0)
    const [items, setItems] = useState(userItems)
    useEffect(() => {
        async function fetchUser() {
            try {
                const { data, error } = await supabase.auth.getUser()
                if (error) throw error
                setUser(data.user.email ?? '')
                setUserId(data.user.id)
                const access=await checkUserAccess(data.user.id)
                const {data:free_credits}=await supabase.from('users').select('free_credits,role').eq('id',data.user.id).single()
                setCredit(free_credits?.free_credits)
                setHasAccess(access)
                if(free_credits?.role==='admin'){
                    setItems(adminItems)
                }
            } catch (error) {
                console.error('Error fetching user:', error)
            }
        }
        fetchUser()
    }
    , [])
    console.log(`hasAccess: ${hasAccess}`)
    useEffect(() => {
        async function fetchSubscriptionStatus() {
            if(userId){
              try {
                const { data, error } = await supabase.from('users').select('subscription_status').eq('id', userId).single()
                if (error) throw error
                setSubscriptionStatus(data.subscription_status)
            } catch (error) {
                console.log('Error fetching subscription status:', error)
            }
            }
        }
        fetchSubscriptionStatus()
    }, [user])
    console.log(`subscriptionStatus: ${subscriptionStatus}`)
  return (
    <>
     <UpgradeModal
            isOpen={open}
            onClose={() => setOpen(false)}
            userEmail={user}
         /> 
    <Sidebar className="bg-background pt-14">
      <SidebarContent className="bg-background p-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem  key={item.title}>
                  <SidebarMenuButton className={cn(
                    "flex items-center hover:bg-accent ",
                    pathname===item.href ? "text-primary" : "text-muted-foreground"
                  )} asChild>
                    <a href={item.href} className=''>
                      <div>
                        <item.icon className="size-6 mr-1 md:size-5" />
                      </div>
                      <span className="text-xl md:text-base">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      
          <SidebarFooter className="bg-background p-4">
        <Button
          className="w-full relative"
          onClick={() => setOpen(true)}
        >
          
            {
                credit>0?`${credit} credits remaining`:'Upgrade Plan'
            }
          <SparklesIcon className="size-4 ml-2 animate-pulse" />
        </Button>
        </SidebarFooter>
       

    </Sidebar>
    </>
  )
}


