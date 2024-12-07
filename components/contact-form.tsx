"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface ContactFormProps {
  type: "sales" | "support"
}

export function ContactForm({ type }: ContactFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      teamSize: formData.get("teamSize"),
      message: formData.get("message"),
      type,
    }

    try {
      // Store in Supabase and send notification email
      const { error } = await supabase
        .from("contact_requests")
        .insert([data])

      if (error) throw error

      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      })

      // Reset form
      e.currentTarget.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              placeholder="Company name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamSize">Team Size</Label>
            <Select name="teamSize" required>
              <SelectTrigger>
                <SelectValue placeholder="Select team size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="501+">501+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Tell us about your needs..."
            className="min-h-[150px]"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending..." : "Send Message"}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        We'll get back to you within 24 hours during business days.
      </p>
    </form>
  )
}