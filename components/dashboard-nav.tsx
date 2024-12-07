"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  BarChart2,
  Brain,
  Settings,
  ArrowUpRight
} from "lucide-react"
import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"

const items = [
  {
    title: "Decks",
    href: "/dashboard",
    icon: Brain,
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
]

export function DashboardNav() {
  const pathname = usePathname()
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)

  const handleUpgradeClick = () => {
    setIsUpgradeDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsUpgradeDialogOpen(false)
  }

  return (
    <>
      <nav className="grid  items-start gap-2 p-4">
        {items.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn(
              "justify-start",
              pathname === item.href && "bg-muted font-medium"
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Link>
          </Button>
        ))}
        
        <Button 
          variant="outline" 
          className="mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
          onClick={handleUpgradeClick}
        >
          Upgrade 
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </nav>

      <Dialog open={isUpgradeDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              Unlock advanced features and take your learning to the next level!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Pro Plan Benefits</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Unlimited deck creation</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
                <li>Custom themes</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                // Implement upgrade logic or redirect to payment page
                window.location.href = "/upgrade"
              }}
              className="w-full"
            >
              Go to Upgrade Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}