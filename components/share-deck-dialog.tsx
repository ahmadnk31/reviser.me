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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Share2, Copy, Users } from "lucide-react"
import type { Deck } from "@/lib/types"
import { CollaboratorList } from "./collaborator-list"

interface ShareDeckDialogProps {
  deck: Deck
  onUpdate: () => void
}

export function ShareDeckDialog({ deck, onUpdate }: ShareDeckDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collaboratorEmail, setCollaboratorEmail] = useState("")
  const [isPublic, setIsPublic] = useState(deck.is_public)
  const { toast } = useToast()
  const supabase = createClient()

  const shareUrl = `${window.location.origin}/deck/${deck.id}`

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get user by email
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", collaboratorEmail)
        .single()

      if (userError) throw new Error("User not found")

      // Add collaborator
      const { error: collaboratorError } = await supabase
        .from("deck_collaborators")
        .insert({
          deck_id: deck.id,
          user_id: users.id,
          role: "editor",
        })

      if (collaboratorError) throw collaboratorError

      setCollaboratorEmail("")
      onUpdate()
      
      toast({
        title: "Success",
        description: "Collaborator added successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add collaborator",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublic = async () => {
    try {
      const { error } = await supabase
        .from("decks")
        .update({ is_public: !isPublic })
        .eq("id", deck.id)

      if (error) throw error

      setIsPublic(!isPublic)
      onUpdate()

      toast({
        title: "Success",
        description: `Deck is now ${!isPublic ? "public" : "private"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update deck visibility",
        variant: "destructive",
      })
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Deck</DialogTitle>
          <DialogDescription>
            Invite others to collaborate or share your deck publicly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Access</Label>
                <p className="text-sm text-muted-foreground">
                  Allow anyone with the link to view this deck
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={handleTogglePublic} />
            </div>
            
            {isPublic && (
              <div className="flex space-x-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" onClick={copyShareLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label>Add Collaborators</Label>
              <p className="text-sm text-muted-foreground">
                Invite users to edit this deck
              </p>
            </div>
            
            <form onSubmit={handleAddCollaborator} className="flex space-x-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add"}
              </Button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Collaborators</Label>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <CollaboratorList deckId={deck.id} onUpdate={onUpdate} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}