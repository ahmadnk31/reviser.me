"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { MessageSquarePlus } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"
import { useAuth } from "@/components/auth-provider"

export function FeedbackDialog() {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [type, setType] = useState<"feedback" | "feature">("feedback")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit feedback.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from("feedback")
        .insert({
          content: feedback,
          type: type,
          user_id: user.id, // Add user ID to track feedback source
        })

      if (error) throw error

      setOpen(false)
      setFeedback("")
      
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      })
    } catch (error) {
      console.error("Feedback submission error:", error)
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex justify-start md:justify-center border-0 md:border" variant="outline">
          <MessageSquarePlus className="mr-2 size-6 md:size-4" />
          Give Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Thoughts</DialogTitle>
          <DialogDescription>
            Help us improve Flashcard Master with your feedback or feature requests.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={type === "feedback" ? "default" : "outline"}
                onClick={() => setType("feedback")}
              >
                General Feedback
              </Button>
              <Button
                type="button"
                variant={type === "feature" ? "default" : "outline"}
                onClick={() => setType("feature")}
              >
                Feature Request
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Your Message</Label>
            <TextareaAutosize
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                type === "feedback"
                  ? "Share your experience with us..."
                  : "Describe the feature you'd like to see..."
              }
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
              required
              minRows={3}
              maxRows={10}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !feedback.trim()}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}