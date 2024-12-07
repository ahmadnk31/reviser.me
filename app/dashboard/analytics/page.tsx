"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Brain, Calendar, LineChart, TrendingUp } from "lucide-react"
import { StudyChart } from "@/components/study-chart"
import { useToast } from "@/hooks/use-toast"

interface AnalyticsData {
  totalCards: number
  totalDecks: number
  totalReviews: number
  averageScore: number
  studyStreak: number
  reviewsByDay: { date: string; count: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const decksResponse = await supabase
        .from("decks")
        .select("id")
        .eq("user_id", session.user.id) as { data: { id: string }[], error: any }

      if (decksResponse.error) throw decksResponse.error

      const [flashcardsResponse, reviewsResponse] = await Promise.all([
        supabase
          .from("flashcards")
          .select("id, deck_id")
          .in("deck_id", decksResponse.data.map(deck => deck.id)),
        supabase
          .from("reviews")
          .select("*")
          .eq("user_id", session.user.id)
      ])

      if (decksResponse.error) throw decksResponse.error
      if (flashcardsResponse.error) throw flashcardsResponse.error
      if (reviewsResponse.error) throw reviewsResponse.error

      // Calculate analytics
      const totalDecks = decksResponse.data.length
      const totalCards = flashcardsResponse.data.length
      const totalReviews = reviewsResponse.data.length
      const averageScore = reviewsResponse.data.length > 0
        ? reviewsResponse.data.reduce((acc, r) => acc + r.difficulty, 0) / reviewsResponse.data.length
        : 0

      // Calculate reviews by day
      const reviewsByDay = reviewsResponse.data.reduce((acc: Record<string, number>, review) => {
        const date = new Date(review.created_at).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})

      // Calculate study streak
      const studyStreak = calculateStudyStreak(reviewsByDay)

      setData({
        totalCards,
        totalDecks,
        totalReviews,
        averageScore,
        studyStreak,
        reviewsByDay: Object.entries(reviewsByDay).map(([date, count]) => ({
          date,
          count,
        })),
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStudyStreak = (reviewsByDay: Record<string, number>): number => {
    const dates = Object.keys(reviewsByDay).sort()
    if (dates.length === 0) return 0

    const today = new Date().toISOString().split('T')[0]
    if (dates[dates.length - 1] < today) return 0

    let streak = 1
    let currentDate = new Date(today)

    while (true) {
      currentDate.setDate(currentDate.getDate() - 1)
      const dateStr = currentDate.toISOString().split('T')[0]
      if (reviewsByDay[dateStr]) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        
        <div className="flex">
         
          <main className="flex-1 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 bg-muted rounded"></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-background">
   
      <div className="flex">
    
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Analytics</h1>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalDecks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalCards}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.studyStreak} days</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.averageScore.toFixed(1)}/4.0
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Study Activity</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <StudyChart data={data.reviewsByDay} />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}