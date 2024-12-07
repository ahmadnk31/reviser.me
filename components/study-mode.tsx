'use client'

import { useState, useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useErrorBoundary } from "react-error-boundary"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Brain, RotateCcw, Loader2 } from 'lucide-react'
import { calculateNextReview } from "@/lib/spaced-repetition"
import { DIFFICULTY_LABELS, MINIMUM_EASE_FACTOR, DEFAULT_EASE_FACTOR, EASE_FACTOR_MODIFIER } from "@/constants/study"
import type { StudyModeProps, Difficulty, ReviewData } from "@/lib/types"
import { StudyComplete } from "./study-complete"

export function StudyMode({ flashcards = [], deckId = '' }: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [difficultyScores, setDifficultyScores] = useState<number[]>([])
  const [startTime, setStartTime] = useState<number>(Date.now())
  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createClient()
  const { showBoundary } = useErrorBoundary()

  // Filter cards that are due for review
  const dueFlashcards = flashcards.filter(card => {
    if (!card.next_review) return true
    return new Date(card.next_review) <= new Date()
  })

  const currentCard = dueFlashcards[currentIndex]
  const progress = (completed.length / dueFlashcards.length) * 100

  // Reset timer when moving to a new card
  useEffect(() => {
    setStartTime(Date.now())
  }, [currentIndex])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      setIsFlipped(prev => !prev)
    } else if (isFlipped && event.key >= '1' && event.key <= '4') {
      handleDifficultyRating(Number(event.key) as Difficulty)
    }
  }, [isFlipped])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const saveReview = async (reviewData: ReviewData) => {
    const { error } = await supabase
      .from("reviews")
      .insert(reviewData)
    if (error) throw error
  }

  const updateFlashcard = async (flashcardId: string, difficulty: Difficulty) => {
    const { error } = await supabase
      .from("flashcards")
      .update({
        review_count: (currentCard.review_count || 0) + 1,
        last_reviewed: new Date().toISOString(),
        next_review: calculateNextReview(
          difficulty,
          currentCard.review_count || 0,
          currentCard.ease_factor || DEFAULT_EASE_FACTOR
        ).toISOString(),
        ease_factor: Math.max(
          MINIMUM_EASE_FACTOR,
          (currentCard.ease_factor || DEFAULT_EASE_FACTOR) + (0.1 - (5 - difficulty) * EASE_FACTOR_MODIFIER)
        ),
      })
      .eq("id", flashcardId)
    if (error) throw error
  }

  const updateStudySession = async (difficulty: Difficulty) => {
    const { error } = await supabase
      .from("study_sessions")
      .upsert({
        user_id: user!.id,
        deck_id: deckId,
        cards_studied: completed.length + 1,
        average_score: difficulty,
        duration: Math.floor((Date.now() - startTime) / 1000),
      })
    if (error) throw error
  }

  const handleDifficultyRating = async (difficulty: Difficulty) => {
    if (!currentCard || !user) return
    setLoading(true)

    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000)
      
      await Promise.all([
        saveReview({
          user_id: user.id,
          flashcard_id: currentCard.id,
          difficulty,
          time_taken: timeTaken,
        }),
        updateFlashcard(currentCard.id, difficulty),
        updateStudySession(difficulty)
      ])
      setDifficultyScores(prev => [...prev, difficulty])
      setCompleted(prev => [...prev, currentCard.id])
      moveToNext()

      toast({
        title: "Review saved",
        description: "Your progress has been updated",
      })
    } catch (error) {
      console.error("Review error:", error)
      showBoundary(error)
    } finally {
      setLoading(false)
    }
  }
  const calculateAverageDifficulty = useCallback(() => {
    if (difficultyScores.length === 0) return 2.5
    return difficultyScores.reduce((a, b) => a + b, 0) / difficultyScores.length
  }, [difficultyScores])

  const moveToNext = useCallback(() => {
    setIsFlipped(false)
    if (currentIndex < dueFlashcards.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, dueFlashcards.length])

  const resetStudySession = useCallback(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setCompleted([])
    setDifficultyScores([])
  }, [])

  if (dueFlashcards.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
        <p className="text-muted-foreground">
          No flashcards due for review. Check back later!
        </p>
      </motion.div>
    )
  }
  if (currentIndex >= dueFlashcards.length) {
    return (
      <StudyComplete
        cardsStudied={completed.length}
        averageDifficulty={calculateAverageDifficulty()}
        onReset={resetStudySession}
      />
    )
  }

  if (currentIndex >= dueFlashcards.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <h2 className="text-xl font-semibold mb-4">Session Complete!</h2>
        <p className="text-muted-foreground mb-6">
          You've reviewed {completed.length} cards
        </p>
        <Button onClick={resetStudySession}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Start New Session
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Card {currentIndex + 1} of {dueFlashcards.length}
        </div>
        <Progress 
          value={progress} 
          className="w-[60%]"
          aria-label="Study progress"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex + (isFlipped ? '-flipped' : '')}
          initial={{ opacity: 0, rotateX: -90 }}
          animate={{ opacity: 1, rotateX: 0 }}
          exit={{ opacity: 0, rotateX: 90 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            className={`min-h-[200px] p-6 cursor-pointer transition-all duration-300 ${
              isFlipped ? "bg-muted" : ""
            }`}
            onClick={() => !loading && setIsFlipped(!isFlipped)}
            role="button"
            tabIndex={0}
            aria-label={`Flashcard ${currentIndex + 1} of ${dueFlashcards.length}. Press Space or Enter to flip.`}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                !loading && setIsFlipped(!isFlipped)
              }
            }}
          >
            <div className="flex items-center justify-center h-full">
              <p className="text-lg font-medium text-center">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-4 gap-2"
          >
            {([1, 2, 3, 4] as const).map((difficulty) => (
              <Button
                key={difficulty}
                variant={difficulty < 3 ? "destructive" : "default"}
                disabled={loading}
                onClick={() => handleDifficultyRating(difficulty)}
                aria-label={`Rate as ${DIFFICULTY_LABELS[difficulty]}`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  DIFFICULTY_LABELS[difficulty]
                )}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
