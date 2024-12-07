"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { EditDeckDialog } from "@/components/edit-deck-dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import type { Deck } from "@/lib/types"

interface DeckListProps {
  decks: Deck[]
  loading: boolean
  onUpdate: () => void
  canEdit?: boolean
}

export function DeckList({ decks, loading, onUpdate }: DeckListProps) {
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleDeleteDeck = async () => {
    if (!deletingDeckId) return
    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from("decks")
        .delete()
        .eq("id", deletingDeckId)

      if (error) throw error

      onUpdate()
      toast({
        title: "Success",
        description: "Deck deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deck",
        variant: "destructive",
      })
    } finally {
      setDeletingDeckId(null)
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[250px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-[200px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (decks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No decks created yet. Create your first deck to get started!
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {decks.map((deck) => (
        <Card key={deck.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <Link href={`/dashboard/deck/${deck.id}`} className="flex-1">
              <CardTitle>{deck.title}</CardTitle>
            </Link>
            <div className="flex items-center space-x-2">
              <EditDeckDialog deck={deck} onDeckUpdated={onUpdate} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeletingDeckId(deck.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {deck.description || "No description"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Created {formatDistanceToNow(new Date(deck.created_at), { addSuffix: true })}
            </p>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={!!deletingDeckId} onOpenChange={() => setDeletingDeckId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the deck
              and all its flashcards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeck}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}