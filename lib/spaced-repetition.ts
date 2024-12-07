// Implements the SuperMemo 2 algorithm for spaced repetition
// Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

const MIN_EASE_FACTOR = 1.3
const DEFAULT_EASE_FACTOR = 2.5

export function calculateNextReview(
  quality: number, // 1-4 rating
  repetitions: number,
  previousEaseFactor: number = DEFAULT_EASE_FACTOR
): Date {
  // Calculate new ease factor
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  // Calculate interval
  let interval: number
  if (quality < 3) {
    // If rating is "Again" or "Hard", reset to 1 day
    interval = 1
  } else if (repetitions === 0) {
    interval = 1
  } else if (repetitions === 1) {
    interval = 6
  } else {
    // Calculate next interval using the ease factor
    const lastInterval = Math.max(6, Math.pow(previousEaseFactor, repetitions - 1))
    interval = Math.round(lastInterval * newEaseFactor)
  }

  // Add some randomness to avoid all cards coming due on the same day
  const randomFactor = 0.95 + Math.random() * 0.1 // ±5% randomness
  interval = Math.round(interval * randomFactor)

  // Calculate next review date
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)
  
  return nextReview
}