"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { FeedbackDialog } from "@/components/feedback-dialog"

export function DashboardHeader() {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
       

        <div className="flex items-center space-x-4">
          <FeedbackDialog />
          <ThemeToggle />
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}