"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/lib/types';
import { Brain, Loader2 } from 'lucide-react';

interface QuestionGeneratorProps {
  document: Document;
}

export function QuestionGenerator({ document }: QuestionGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [pageNumber, setPageNumber] = useState<string>('');
  const [questionCount, setQuestionCount] = useState('5');
  const [questions, setQuestions] = useState<Array<{ front: string; back: string }>>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
          topic: topic || undefined,
          count: parseInt(questionCount)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setQuestions(data.questions);
      toast({
        title: 'Success!',
        description: `Generated ${data.questions.length} questions.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate questions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {document.pageCount && (
            <div className="space-y-2">
              <Label htmlFor="page">Page Number (Optional)</Label>
              <Input
                id="page"
                type="number"
                min="1"
                max={document.pageCount}
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder={`1-${document.pageCount}`}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="count">Number of Questions</Label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 10].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} questions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Topic (Optional)</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a specific topic to focus on"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generate Questions
            </>
          )}
        </Button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Questions</h3>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-2"
              >
                <p className="font-medium">Q: {question.front}</p>
                <p className="text-muted-foreground">A: {question.back}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}