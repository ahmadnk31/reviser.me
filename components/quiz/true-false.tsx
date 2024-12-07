import { Button } from "@/components/ui/button";
import { Question } from '@/lib/types';

interface Props {
  question: Question;
  onAnswer: (answer: string) => void;
  isAnswered: boolean;
}

export function TrueFalseQuestion({ question, onAnswer, isAnswered }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{question.question}</h3>
      <div className="flex space-x-4">
        <Button 
          onClick={() => onAnswer('True')} 
          disabled={isAnswered}
          variant={isAnswered && question.correctAnswer === 'True' ? 'default' : 'outline'}
        >
          True
        </Button>
        <Button 
          onClick={() => onAnswer('False')} 
          disabled={isAnswered}
          variant={isAnswered && question.correctAnswer === 'False' ? 'default' : 'outline'}
        >
          False
        </Button>
      </div>
    </div>
  );
}

