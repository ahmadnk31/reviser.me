

import { AppSidebar } from "@/components/dashboard-sidebar";
import { Toaster } from "@/components/ui/sonner"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import {redirect} from 'next/navigation'
import { createClient } from "@/lib/supabase/server";
export default async function Layout({ children }:{
    children: React.ReactNode
}) {
  const cookieStore=cookies()
  const supabase=await createClient(cookieStore)
  const {data: {user}}=await supabase.auth.getUser()
  if(!user){
    return redirect('/login')
  }
    return (
        <SidebarProvider
        >
      <AppSidebar />
      <main className="w-full">
        <SidebarTrigger className="ml-4 mt-4" />
        
          {children}
        
        <Toaster />
      </main>
    </SidebarProvider>
    );
    }