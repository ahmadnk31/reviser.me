

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Progress } from "@/components/ui/progress";
import { MultipleChoiceQuestion } from '@/components/multiple-choice-questions';
import { Button } from "@/components/ui/button";
import { Question, QuizResult } from '@/lib/types';
import { toast } from "sonner";
import { TextDownloadButton } from './generate-text-pdf';
import { TrueFalseQuestion } from './quiz/true-false';
import { OpenEndedQuestion } from './quiz/open-ended';
import { Share2, Twitter, Facebook,Lock, Timer } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { IconBrandFacebook, IconBrandX } from '@tabler/icons-react';

interface Props {
  questions: Question[];
  documentId: string;
}

interface AttemptRecord {
  id?: string;
  user_id: string;
  document_id: string;
  attempt_count: number;
  last_attempt_time: string;
  block_end_time: string | null;
  created_at?: string;
}

interface ShareButtonProps {
  platform: 'twitter' | 'facebook';
  color: string;
  score: number;
  totalQuestions: number;
}

const ShareButton = ({ platform, color, score, totalQuestions }: ShareButtonProps) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  const shareText = `I just scored ${score}/${totalQuestions} (${percentage}%) on this quiz! 🎉`;
  const encodedText = encodeURIComponent(shareText);
  
  const handleShare = () => {
    if (platform === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&hashtags=QuizTime&url=${window.location.href}`;
      window.open(twitterUrl, '_blank', 'width=600,height=400');
    } else {
      // Facebook requires URL to share
      const url = window.location.href;
      const facebookUrl = `https://www.facebook.com/dialog/share?app_id=520330464369988&display=popup&href=${encodeURIComponent(url)}&quote=${encodedText}&hashtag=%23Quiz`;
      window.open(facebookUrl, '_blank', 'width=626,height=436');
    }
  };

  return (
    <Button
      onClick={handleShare}
      className="flex items-center gap-2"
      style={{ backgroundColor: color }}
    >
      {platform === 'twitter' ? <IconBrandX className="w-4 h-4" /> : <IconBrandFacebook className="w-4 h-4" />}
      Share on {platform === 'twitter' ? 'X' : 'Facebook'}
    </Button>
  );
};


export function QuizContainer({ questions, documentId }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptRecord, setAttemptRecord] = useState<AttemptRecord | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const supabase = createClient();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Constants for blocking rules
  const MAX_ATTEMPTS = 3; // Maximum attempts before blocking
  const BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const ATTEMPT_COOLDOWN = 60 * 60 * 1000; // 1 hour cooldown between attempts

  useEffect(() => {
    fetchAttemptRecord();
  }, [documentId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const fetchAttemptRecord = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to take the quiz");
        return;
      }

      // Check if attempt record exists
      let { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('document_id', documentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (!attempts) {
        // Create new attempt record
        const newAttempt: AttemptRecord = {
          user_id: user.id,
          document_id: documentId,
          attempt_count: 0,
          last_attempt_time: new Date().toISOString(),
          block_end_time: null
        };

        const { data: newRecord, error: insertError } = await supabase
          .from('quiz_attempts')
          .insert(newAttempt)
          .select()
          .single();

        if (insertError) throw insertError;
        attempts = newRecord;
      }

      setAttemptRecord(attempts);

      // Check if user is blocked
      if (attempts.block_end_time) {
        const blockEndTime = new Date(attempts.block_end_time).getTime();
        const now = Date.now();
        if (blockEndTime > now) {
          setTimeRemaining(blockEndTime - now);
        } else {
          // Remove block if time has passed
          await supabase
            .from('quiz_attempts')
            .update({ block_end_time: null })
            .eq('id', attempts.id);
          attempts.block_end_time = null;
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching attempt record:', error);
      toast.error("Failed to load quiz attempt data");
      setIsLoading(false);
    }
  };

  const checkAndUpdateAttempts = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to take the quiz");
        return false;
      }

      if (!attemptRecord) return false;

      const currentTime = new Date();
      const lastAttemptTime = new Date(attemptRecord.last_attempt_time);
      const timeSinceLastAttempt = currentTime.getTime() - lastAttemptTime.getTime();

      // Check cooldown period
      if (timeSinceLastAttempt < ATTEMPT_COOLDOWN) {
        const waitTime = formatTimeRemaining(ATTEMPT_COOLDOWN - timeSinceLastAttempt);
        toast.error(`Please wait ${waitTime} before your next attempt`);
        return false;
      }

      // Update attempt count
      const newAttemptCount = attemptRecord.attempt_count + 1;
      let blockEndTime = null;

      if (newAttemptCount >= MAX_ATTEMPTS) {
        blockEndTime = new Date(currentTime.getTime() + BLOCK_DURATION).toISOString();
        setTimeRemaining(BLOCK_DURATION);
      }

      // Update record in database
      const { data: updatedAttempt, error } = await supabase
        .from('quiz_attempts')
        .update({
          attempt_count: newAttemptCount,
          last_attempt_time: currentTime.toISOString(),
          block_end_time: blockEndTime
        })
        .eq('id', attemptRecord.id)
        .select()
        .single();

      if (error) throw error;

      setAttemptRecord(updatedAttempt);
      return !blockEndTime;
    } catch (error) {
      console.error('Error updating attempts:', error);
      toast.error("Failed to update attempt record");
      return false;
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
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

  const restartQuiz = async () => {
    if (await checkAndUpdateAttempts()) {
      setCurrentQuestionIndex(0);
      setScore(0);
      setAnswers({});
      setIsComplete(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (attemptRecord?.block_end_time && new Date(attemptRecord.block_end_time) > new Date()) {
    return (
      <Alert variant="destructive" className="mt-4">
        <Lock className="h-4 w-4" />
        <AlertTitle>Access Blocked</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>You have exceeded the maximum number of attempts.</p>
            <p>Time remaining: {formatTimeRemaining(timeRemaining)}</p>
            <p>Please try again later.</p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {!isComplete ? (
        <>
         <Alert>
            <Timer className="h-4 w-4" />
            <AlertTitle>Test Mode Active</AlertTitle>
            <AlertDescription>
              You have {MAX_ATTEMPTS - (attemptRecord?.attempt_count || 0)} attempts remaining.
              Each attempt requires a {formatTimeRemaining(ATTEMPT_COOLDOWN)} cooldown period.
            </AlertDescription>
          </Alert>
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
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white">Quiz Complete! 🎉</h2>
            <p className="text-lg text-white mt-2">
              Your score: {score} out of {questions.length}
              ({Math.round((score / questions.length) * 100)}%)
            </p>
          </div>
          
          <div className="flex justify-center gap-4 mt-6">
            <ShareButton
              platform="twitter"
              color="#1DA1F2"
              score={score}
              totalQuestions={questions.length}
            />
            <ShareButton
              platform="facebook"
              color="#4267B2"
              score={score}
              totalQuestions={questions.length}
            />
          </div>

          <div className="mt-6">
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

            <Button className='ml-2' onClick={restartQuiz}>
              Take Another Quiz
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

