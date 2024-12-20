"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Brain, Calendar, LineChart, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/components/auth-provider"

interface DeckStats {
  totalCards: number
  cardsReviewed: number
  averageScore: number
  streakDays: number
  nextReview: Date | null
}

interface DeckStatsProps {
  deckId: string
}

export function DeckStats({ deckId }: DeckStatsProps) {
  const [stats, setStats] = useState<DeckStats>({
    totalCards: 0,
    cardsReviewed: 0,
    averageScore: 0,
    streakDays: 0,
    nextReview: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }
    fetchUserId()
  }, [])
  useEffect(() => {
    if (userId) {
      fetchStats()
    }
  }, [deckId, userId])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch flashcards in this deck
      const { data: flashcards, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", deckId)

      if (flashcardsError) throw flashcardsError

      // Fetch reviews for these flashcards
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .in("flashcard_id", flashcards.map(f => f.id))
        .eq("user_id", userId)

      if (reviewsError) throw reviewsError

      // Calculate statistics
      const totalCards = flashcards.length
      const cardsReviewed = flashcards.filter(f => f.review_count > 0).length
      const averageScore = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.difficulty, 0) / reviews.length
        : 0

      // Find next review date
      const nextReviewDate = flashcards
        .map(f => f.next_review)
        .filter(Boolean)
        .sort()[0]

      // Calculate study streak
      const streakDays = calculateStreak(reviews)

      setStats({
        totalCards,
        cardsReviewed,
        averageScore,
        streakDays,
        nextReview: nextReviewDate ? new Date(nextReviewDate) : null,
      })
    } catch (error) {
      console.error("Error fetching deck stats:", error)
      setError("Failed to load deck statistics")
    } finally {
      setLoading(false)
    }
  }

  const calculateStreak = (reviews: any[]): number => {
    if (reviews.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const reviewDates = reviews
      .map(r => {
        const date = new Date(r.created_at)
        date.setHours(0, 0, 0, 0)
        return date.getTime()
      })
      .sort((a, b) => b - a)

    // Check if reviewed today
    const lastReview = new Date(reviewDates[0])
    if (lastReview < today) return 0

    let streak = 1
    let currentDate = new Date(today)

    for (let i = 1; i < reviewDates.length; i++) {
      currentDate.setDate(currentDate.getDate() - 1)
      if (reviewDates.includes(currentDate.getTime())) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  if (loading) {
    return <div className="animate-pulse p-4">Loading statistics...</div>
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCards}</div>
          <p className="text-xs text-muted-foreground">
            {stats.cardsReviewed} cards reviewed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageScore.toFixed(1)}/4.0
          </div>
          <p className="text-xs text-muted-foreground">
            Based on all reviews
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
          <LineChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.streakDays} days</div>
          <p className="text-xs text-muted-foreground">
            Keep it going!
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Review</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.nextReview
              ? formatDistanceToNow(stats.nextReview, { addSuffix: true })
              : "No reviews scheduled"}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.nextReview ? `at ${stats.nextReview.toLocaleDateString()}` : "Create some flashcards to start"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}