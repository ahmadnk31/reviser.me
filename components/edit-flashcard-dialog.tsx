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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Edit2 } from "lucide-react"
import type { Flashcard } from "@/lib/types"

interface EditFlashcardDialogProps {
  flashcard: Flashcard
  onFlashcardUpdated: () => void
}

export function EditFlashcardDialog({
  flashcard,
  onFlashcardUpdated,
}: EditFlashcardDialogProps) {
  const [open, setOpen] = useState(false)
  const [front, setFront] = useState(flashcard.front)
  const [back, setBack] = useState(flashcard.back)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from("flashcards")
        .update({
          front,
          back,
        })
        .eq("id", flashcard.id)

      if (error) throw error

      onFlashcardUpdated()
      setOpen(false)
      
      toast({
        title: "Success",
        description: "Flashcard updated successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update flashcard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front">Front</Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Enter the question or prompt"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">Back</Label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Enter the answer or explanation"
              required
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
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}