import React from 'react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Question } from '@/lib/types'

interface MultipleChoiceQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
  isAnswered: boolean
}

export function MultipleChoiceQuestion({ question, onAnswer, isAnswered }: MultipleChoiceQuestionProps) {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null)

  const handleSubmit = () => {
    if (selectedOption) {
      onAnswer(selectedOption)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{question.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          onValueChange={(value) => setSelectedOption(value)}
          disabled={isAnswered}
        >
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem
                value={option}
                id={`option-${index}`}
                disabled={isAnswered}
              />
              <Label
                htmlFor={`option-${index}`}
                className="text-base cursor-pointer flex-grow p-2 rounded-md hover:bg-accent"
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={isAnswered || !selectedOption}
          className="w-full"
        >
          Submit Answer
        </Button>
      </CardFooter>
    </Card>
  )
}

