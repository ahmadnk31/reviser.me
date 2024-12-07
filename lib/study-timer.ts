export function calculateNextStudyTime(
    averageDifficulty: number,
    cardsStudied: number
  ): Date {
    // Base delay in hours based on average difficulty (1-4)
    // 1 = 1 hour, 2 = 3 hours, 3 = 6 hours, 4 = 12 hours
    const baseDelay = Math.pow(2, averageDifficulty - 1)
    
    // Adjust delay based on number of cards studied
    // More cards = longer break
    const cardsFactor = Math.min(1.5, 1 + (cardsStudied / 20))
    
    const delayHours = baseDelay * cardsFactor
    
    const nextTime = new Date()
    nextTime.setHours(nextTime.getHours() + Math.round(delayHours))
    
    // Round to nearest hour
    nextTime.setMinutes(0)
    nextTime.setSeconds(0)
    nextTime.setMilliseconds(0)
    
    return nextTime
  }
  
  export function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date)
  }
  
  