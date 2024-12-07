import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Brain, Clock } from 'lucide-react'
import { calculateNextStudyTime, formatTime } from "@/lib/study-timer"

interface StudyCompleteProps {
  cardsStudied: number
  averageDifficulty: number
  onReset: () => void
}

export function StudyComplete({ 
  cardsStudied, 
  averageDifficulty, 
  onReset 
}: StudyCompleteProps) {
  const nextStudyTime = calculateNextStudyTime(averageDifficulty, cardsStudied)
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Brain className="h-12 w-12 text-primary" />
            <Clock className="h-6 w-6 text-primary absolute -bottom-1 -right-1" />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-2">
          Study Session Complete!
        </h2>
        
        <div className="space-y-4 mb-6">
          <p className="text-muted-foreground">
            Great job! You've reviewed {cardsStudied} cards.
          </p>
          
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">
              Based on your performance, we recommend returning at:
            </p>
            <p className="text-2xl font-bold text-primary mt-2" aria-label={`Next study session at ${formatTime(nextStudyTime)}`}>
              {formatTime(nextStudyTime)}
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Taking breaks helps reinforce your learning. We'll notify you when it's time to return.
          </p>
        </div>
        
        <div className="flex justify-center gap-4">
          <Button 
            onClick={onReset}
            variant="outline"
          >
            Study Again
          </Button>
          <Button 
            onClick={() => window.close()}
            variant="default"
          >
            Close Session
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

