'use client'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Download } from "lucide-react";
import { generateQuestionsPDF } from "@/lib/pdf-generator";
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
import { Maximize2, Minimize2, X } from "lucide-react";
import { QuizContainer } from "./quiz-container";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

type ChatPDFProps = {
    onOpen: (open: boolean) => void;
    isOpen: boolean;
    id: string;
};

export default function ChatPDF({ onOpen, isOpen, id }: ChatPDFProps) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [filename,setFilename]=useState('')
  const [fileUrl,setFileUrl]=useState('')
  const { toast } = useToast();
  const supabase=createClient()
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
                    documentId: id
                }),
            });
            const result = await response.json();
            setQuestions(result.questions);
           setFileUrl(result.fileUrl)
           setFilename(result.filename)
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };
    const handleExportPDF = async () => {
      if (questions.length === 0) {
        toast({
          title: "No questions to export",
          description: "Please generate some questions first.",
          variant: "destructive",
        });
        return;
      }
    
      setExportingPDF(true);
      try {
        console.log('Starting PDF export...');
    
        // Open the file in a new window
        window.open(fileUrl, '_blank');
    
        // Create a hidden link element for downloading
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
    
        // Trigger the download
        link.click();
    
        // Clean up
        document.body.removeChild(link);
    
        toast({
          title: "PDF exported successfully",
          description: "The PDF has been opened in a new tab and downloaded.",
        });
      } catch (error) {
        console.error('PDF export error:', error);
        toast({
          title: "Error exporting PDF",
          description: error instanceof Error ? error.message : "Failed to generate or save the PDF.",
          variant: "destructive",
        });
      } finally {
        setExportingPDF(false);
      }
    };
    
    

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpen}>
            <div className={`fixed inset-0 -z-10 flex items-center justify-center ${
                isFullscreen ? 'p-0' : 'p-4'
            }`}>
                <AlertDialogContent 
                    className={`overflow-y-auto transition-all duration-300 ${
                        isFullscreen 
                            ? 'w-screen h-screen max-w-none max-h-none rounded-none m-0'
                            : 'max-h-[80vh] rounded-lg'
                    }`}
                >
                    <AlertDialogHeader className="relative">
                        <div className="absolute -top-4 -right-2 flex gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={handleExportPDF}
                                disabled={exportingPDF || questions.length === 0}
                                className="w-fit p-0 border-0 hover:bg-transparent text-muted-foreground"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-fit p-0 border-0 hover:bg-transparent text-muted-foreground"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </Button>
                            <AlertDialogCancel className='w-fit p-0 border-0 shadow-none hover:bg-transparent'>
                                <X className="h-4 w-4" />
                            </AlertDialogCancel>
                        </div>
                        <AlertDialogTitle>Generate Questions</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className={`container mx- ${
                        isFullscreen ? 'h-[calc(100vh-100px)]' : ''
                    }`}>
                        <Card className="p-4 w-full">
                            <form onSubmit={handleQuestionGeneration} className="space-y-4 min-w-full">
                                <Select name="questionType">
                                    <SelectTrigger className='min-w-full'>
                                        <SelectValue placeholder="Question Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                        <SelectItem value="true_false">True/False</SelectItem>
                                        <SelectItem value="open_ended">Open Ended</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select name="difficulty">
                                    <SelectTrigger className='min-w-full'>
                                        <SelectValue placeholder="Difficulty Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input name="topic" className='min-w-full' placeholder="Enter specific topic (optional)" />

                                <Input
                                    name="count"
                                    className='min-w-full'
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
            </div>
        </AlertDialog>
    );
}