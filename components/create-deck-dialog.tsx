"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Plus } from "lucide-react"

interface CreateDeckDialogProps {
  onDeckCreated: (deck: any) => void
}

export function CreateDeckDialog({ onDeckCreated }: CreateDeckDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a deck",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("decks")
        .insert({
          title: title.trim(),
          description: description.trim(),
          user_id: user.id,
          is_public: false,
        })
        .select("*")
        .single()

      if (error) throw error

      onDeckCreated(data)
      setOpen(false)
      setTitle("")
      setDescription("")
      
      toast({
        title: "Success",
        description: "Deck created successfully!",
      })
    } catch (error: any) {
      console.error("Error creating deck:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create deck",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Deck
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter deck title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter deck description (optional)"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setTitle("")
                setDescription("")
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}