import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Progress } from "@/components/ui/progress";
import { MultipleChoiceQuestion } from '@/components/multiple-choice-questions';
import { Button } from "@/components/ui/button";
import { Question, QuizResult } from '@/lib/types';
import { toast } from "sonner";
import { DownloadButton } from './generate-pdf';
import { TextDownloadButton } from './generate-text-pdf';
import { TrueFalseQuestion } from './quiz/true-false';
import { OpenEndedQuestion } from './quiz/open-ended';

interface Props {
  questions: Question[];
  documentId: string;
}

export function QuizContainer({ questions, documentId }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const supabase = createClient();

  const handleAnswer = async (answer: string) => {
    const question = questions[currentQuestionIndex];
    const isCorrect = answer === question.correctAnswer;
    
    setAnswers(prev => ({
      ...prev,
      [question.id]: answer
    }));

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      await saveQuizResult();
    }
  };

  const saveQuizResult = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user?.id) {
        toast.error("User not authenticated");
        return;
      }

      const result: QuizResult = {
        user_id: userData.user.id,
        document_id: documentId,
        score,
        total_questions: questions.length,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          userAnswer: answer,
          isCorrect: answer === questions.find(q => q.id === questionId)?.correctAnswer
        })),
        completed_at: new Date()
      };

      const { error } = await supabase
        .from('quiz_results')
        .insert(result);

      if (error) {
        toast.error("Failed to save quiz result");
        console.error('Error saving quiz result:', error);
      } else {
        toast.success("Quiz result saved successfully");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error('Unexpected error:', error);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers({});
    setIsComplete(false);
  };

  return (
    <div className="space-y-6 mt-4">
      {!isComplete ? (
        <>
          <Progress 
            value={(currentQuestionIndex / questions.length) * 100} 
            className="w-full"
          />
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          {questions[currentQuestionIndex]?.type === 'multiple_choice' && (
            <MultipleChoiceQuestion
              question={questions[currentQuestionIndex]}
              onAnswer={handleAnswer}
              isAnswered={!!answers[questions[currentQuestionIndex].id]}
            />
          )}
          {
            questions[currentQuestionIndex]?.type === 'true_false' && (
              <TrueFalseQuestion
                question={questions[currentQuestionIndex]}
                onAnswer={handleAnswer}
                isAnswered={!!answers[questions[currentQuestionIndex].id]}
                />
            )
          }
          {
            questions[currentQuestionIndex]?.type === 'open-ended' && (
              <OpenEndedQuestion
                question={questions[currentQuestionIndex]}
                onAnswer={handleAnswer}
                isAnswered={!!answers[questions[currentQuestionIndex].id]}
                />
            )
          }
        </>
      ) : (
        <div className="text-center space-y-4">
          
       
  <h2 className="text-2xl font-bold">Quiz Complete!</h2>
  <p className="text-lg">
    Your score: {score} out of {questions.length}
    ({Math.round((score / questions.length) * 100)}%)
  </p>
  <TextDownloadButton 
  content={`Quiz Results
Score: ${score} out of ${questions.length}
Percentage: ${Math.round((score / questions.length) * 100)}%

Detailed Answers:
${questions.map((q, index) => 
  `Question ${index + 1}: ${q.question}
Correct Answer: ${q.correctAnswer}
Your Answer: ${answers[q.id]}
`).join('\n')}`}
  filename="quiz-results.pdf"
  title="Quiz Results"
/>

          <Button onClick={restartQuiz}>
            Take Another Quiz
          </Button>
        </div>
      )}
    </div>
  );
}