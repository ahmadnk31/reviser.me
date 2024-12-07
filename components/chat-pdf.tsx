'use client'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { QuizContainer } from "./quiz-container";



type ChatPDFProps = {
    onOpen:(open:boolean)=>void;
    isOpen: boolean;
    id: string;
    };
export default function ChatPDF({ onOpen, isOpen,id }: ChatPDFProps) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  useEffect(() => {
    if (isOpen) {
      setQuestions([]);
    }
  }, [isOpen, id]);

  const handleQuestionGeneration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      type: formData.get("questionType"),
      difficulty: formData.get("difficulty"),
      topic: formData.get("topic"),
      count: formData.get("count"),
    };

    try {
      const response = await fetch("/api/quiz/generate-question", {
        method: "POST",
        body: JSON.stringify({
            ...data,
            documentId:id
        }),
      });
      const result = await response.json();

      setQuestions(result.questions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

 

  return (
   <AlertDialog open={isOpen} onOpenChange={onOpen}>
    <AlertDialogContent className="overflow-y-auto h-screen">
        <AlertDialogHeader className="relative">
        <AlertDialogCancel className='absolute -top-4 text-muted-foreground -right-2 w-fit p-0 border-0 hover:bg-transparent'>
        <X className="h-4 w-4" />
    </AlertDialogCancel>
            <AlertDialogTitle>Generate Questions</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="container mx-auto p-4">
          <Card className="p-6">
            <form onSubmit={handleQuestionGeneration} className="space-y-4">
              <Select name="questionType">
                <SelectTrigger>
                  <SelectValue placeholder="Question Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="open_ended">Open Ended</SelectItem>
                </SelectContent>
              </Select>

              <Select name="difficulty">
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Input name="topic" placeholder="Enter specific topic (optional)" />
              
              <Input 
                name="count" 
                type="number" 
                placeholder="Number of questions" 
                defaultValue="5" 
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Generating..." : "Generate Questions"}
              </Button>
            </form>

            
             <QuizContainer questions={questions} documentId={id} />
          </Card>
    </div>
   
    </AlertDialogContent>
    </AlertDialog>
  );
}