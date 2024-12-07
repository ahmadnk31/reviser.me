"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"

interface Collaborator {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: "viewer" | "editor"
}

interface CollaboratorListProps {
  deckId: string
  onUpdate: () => void
}

export function CollaboratorList({ deckId, onUpdate }: CollaboratorListProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchCollaborators()
  }, [deckId])

  const fetchCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from("deck_collaborators")
        .select(`
          user_id,
          role,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq("deck_id", deckId)

      if (error) throw error

      setCollaborators(
        data.map((item: any) => ({
          id: item.user_id,
          email: item.users.email,
          full_name: item.users.full_name,
          avatar_url: item.users.avatar_url,
          role: item.role,
        }))
      )
    } catch (error) {
      console.error("Error fetching collaborators:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateCollaboratorRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("deck_collaborators")
        .update({ role: newRole })
        .eq("deck_id", deckId)
        .eq("user_id", userId)

      if (error) throw error

      fetchCollaborators()
      onUpdate()

      toast({
        title: "Success",
        description: "Collaborator role updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update collaborator role",
        variant: "destructive",
      })
    }
  }

  const removeCollaborator = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("deck_collaborators")
        .delete()
        .eq("deck_id", deckId)
        .eq("user_id", userId)

      if (error) throw error

      setCollaborators(prev => prev.filter(c => c.id !== userId))
      onUpdate()

      toast({
        title: "Success",
        description: "Collaborator removed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove collaborator",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading collaborators...</div>
  }

  if (collaborators.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        No collaborators yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {collaborators.map((collaborator) => (
        <div
          key={collaborator.id}
          className="flex items-center justify-between p-2 rounded-lg border"
        >
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={collaborator.avatar_url || undefined} />
              <AvatarFallback>
                {(collaborator.full_name || collaborator.email)
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {collaborator.full_name || "Unnamed User"}
              </p>
              <p className="text-sm text-muted-foreground">
                {collaborator.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              defaultValue={collaborator.role}
              onValueChange={(value) =>
                updateCollaboratorRole(collaborator.id, value)
              }
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCollaborator(collaborator.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}