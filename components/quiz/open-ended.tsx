import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Question } from '@/lib/types';

interface Props {
  question: Question;
  onAnswer: (answer: string) => void;
  isAnswered: boolean;
}

export function OpenEndedQuestion({ question, onAnswer, isAnswered }: Props) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{question.question}</h3>
      <Textarea 
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here..."
        disabled={isAnswered}
      />
      <Button onClick={handleSubmit} disabled={isAnswered || !answer.trim()}>
        Submit Answer
      </Button>
    </div>
  );
}

