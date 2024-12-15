"use client"

import { useEffect, useState } from "react"
import { StudyModeErrorBoundary } from "@/components/error-boundary"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FlashcardList } from "@/components/flashcard-list"
import { CreateFlashcardDialog } from "@/components/create-flashcard-dialog"
import { ShareDeckDialog } from "@/components/share-deck-dialog"
import { StudyMode } from "@/components/study-mode"
import { DeckStats } from "@/components/deck-stats"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Brain } from "lucide-react"
import type { Deck, Flashcard } from "@/lib/types"

export default function DeckPage() {
  const [deck, setDeck] = useState<Deck | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const params = useParams()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchDeckAndFlashcards()
  }, [params.id])

  const fetchDeckAndFlashcards = async () => {
    try {
      // Get deck and check permissions
      const { data: deckData, error: deckError } = await supabase
        .from("decks")
        .select(`
          *,
          deck_collaborators (
            role
          )
        `)
        .eq("id", params.id)
        .single()

      if (deckError) throw deckError

      // Check if user can edit
      const isOwner = deckData.user_id === (await supabase.auth.getUser()).data.user?.id
      const isEditor = deckData.deck_collaborators?.some(
        (c: any) => c.role === "editor"
      )
      setCanEdit(isOwner || isEditor)

      // Get flashcards
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", params.id)
        .order("position", { ascending: true })

      if (flashcardsError) throw flashcardsError

      setDeck(deckData)
      setFlashcards(flashcardsData)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load deck and flashcards",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFlashcardCreated = (newFlashcard: Flashcard) => {
    setFlashcards((prev) => [...prev, newFlashcard])
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Brain className="h-12 w-12 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Deck not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">{deck.title}</h1>
          <p className="text-muted-foreground">{deck.description}</p>
        </div>
        <div className="flex items-center justify-center gap-4">
          {canEdit && (
            <CreateFlashcardDialog
              deckId={deck.id}
              onFlashcardCreated={handleFlashcardCreated}
            />
          )}
          <ShareDeckDialog deck={deck} onUpdate={fetchDeckAndFlashcards} />
        </div>
      </div>

      <Tabs defaultValue="cards" className="space-y-4 w-full lg:w-fit">
        <TabsList className="w-full lg:w-fit">
          <TabsTrigger className="w-full lg:w-fit" value="cards">Flashcards</TabsTrigger>
          <TabsTrigger className="w-full lg:w-fit" value="study">Study</TabsTrigger>
          <TabsTrigger className="w-full lg:w-fit" value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          <FlashcardList
            flashcards={flashcards}
            onUpdate={fetchDeckAndFlashcards}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="study">
          <StudyModeErrorBoundary>
          <StudyMode flashcards={flashcards} deckId={deck.id} />
          </StudyModeErrorBoundary>
        </TabsContent>

        <TabsContent value="stats">
          <DeckStats deckId={deck.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}