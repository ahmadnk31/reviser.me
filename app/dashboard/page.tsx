"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { DeckList } from "@/components/deck-list"
import { CreateDeckDialog } from "@/components/create-deck-dialog"
import { createClient } from "@/lib/supabase/client"
import { Brain} from "lucide-react"
import { AIGenerator } from "@/components/ai-generator"
import type { Deck } from "@/lib/types"
type User = {
  id: string
  email: string
  user_metadata: {
    avatar_url: string
  }
}
export default function DashboardPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)


  useEffect(() => {
    const fetchUser = async () => {
      const { data:{user}, error } = await supabase.auth.getUser()

      if (error) {
        console.error("Error fetching user:", error)
        return
      }

      if (user) {
        setUser({
          id: user.id,
          email: user.email || "",
          user_metadata: {
            avatar_url: user.user_metadata?.avatar_url || "",
          },
        })
      }
    }
    fetchUser()
  }, [])

  console.log(`user: ${user}`)

  const fetchDecks = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("decks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        console.log(data)
      if (error) throw error

      setDecks(data || [])
    } catch (error: any) {
      console.error("Error fetching decks:", error)
      toast({
        title: "Error",
        description: "Failed to fetch decks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
useEffect(() => {
    if (user) {
      fetchDecks()
    }
  }
, [user])

console.log(`decks: ${decks}`)
  const handleDeckCreated = (newDeck: Deck) => {
    setDecks((prev) => [newDeck, ...prev])
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Please sign in to continue</p>
              <Button onClick={() => router.push("/login")}>Sign In</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen container bg-background">
      <div className="flex">
        <main className="flex-1 ">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl md:text-3xl font-bold">Your Flashcard Decks</h1>
            <CreateDeckDialog onDeckCreated={handleDeckCreated} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <DeckList
                decks={decks}
                loading={loading}
                onUpdate={fetchDecks}
                canEdit={true}
              />
            </div>
            
            <div className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">AI Flashcard Generator</h2>
                <AIGenerator onFlashcardsGenerated={async (flashcards) => {
                  if (!user) return

                  try {
                    const { data: deck, error: deckError } = await supabase
                      .from("decks")
                      .insert({
                        title: "AI Generated Deck",
                        description: "Automatically generated flashcards",
                        user_id: user.id,
                        is_public: false,
                      })
                      .select()
                      .single()

                    if (deckError) throw deckError

                    const { error: cardsError } = await supabase
                      .from("flashcards")
                      .insert(
                        flashcards.map((card) => ({
                          deck_id: deck.id,
                          front: card.front,
                          back: card.back,
                        }))
                      )

                    if (cardsError) throw cardsError

                    fetchDecks()
                    toast({
                      title: "Success",
                      description: "AI-generated deck created successfully!",
                    })
                  } catch (error: any) {
                    console.error("Error creating AI deck:", error)
                    toast({
                      title: "Error",
                      description: "Failed to create AI-generated deck",
                      variant: "destructive",
                    })
                  }
                }} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}