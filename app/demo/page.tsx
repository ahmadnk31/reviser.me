"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const demoFlashcards = [
  { front: "What is the capital of France?", back: "Paris" },
  { front: "What is the largest planet in our solar system?", back: "Jupiter" },
  { front: "Who wrote 'Romeo and Juliet'?", back: "William Shakespeare" },
  { front: "What is the chemical symbol for gold?", back: "Au" },
  { front: "What year did World War II end?", back: "1945" },
];

export default function DemoPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentCard = demoFlashcards[currentIndex];
  const progress = (completed.length / demoFlashcards.length) * 100;

  const handleNext = () => {
    if (currentIndex >= demoFlashcards.length - 1) {
      setIsCompleted(true);
      return;
    }

    setCompleted(prev => [...prev, currentIndex]);
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  };

  const resetDemo = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted([]);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <div className="container max-w-4xl py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Brain className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Demo Complete!</h2>
          <p className="text-muted-foreground mb-8">
            You've reviewed all the demo flashcards. Ready to create your own?
          </p>
          <div className="space-x-4">
            <Button onClick={resetDemo} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild>
              <a href="/signup">Get Started</a>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Try Flashcard Master</h1>
        <p className="text-muted-foreground">
          Experience our spaced repetition system with these sample flashcards
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {demoFlashcards.length}
          </div>
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`min-h-[200px] p-6 cursor-pointer transition-all duration-300 ${
                isFlipped ? 'bg-muted' : ''
              }`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className="flex items-center justify-center h-full">
                <motion.p
                  key={isFlipped ? 'back' : 'front'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-lg font-medium text-center"
                >
                  {isFlipped ? currentCard.back : currentCard.front}
                </motion.p>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Click the card to reveal the answer
          </p>
          <AnimatePresence>
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Button onClick={handleNext}>
                  {currentIndex === demoFlashcards.length - 1 ? (
                    "Complete Demo"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}