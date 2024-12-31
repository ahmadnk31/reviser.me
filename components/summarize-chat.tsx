'use client'

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Copy, X } from "lucide-react";
import { TextDownloadButton } from "./generate-text-pdf";

type ChatPDFProps = {
    onOpen: (open: boolean) => void;
    isOpen: boolean;
    id: string;
};

export default function SummarizeChat({ onOpen, isOpen, id }: ChatPDFProps) {
    const [summary, setSummary] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens or document id changes
    useEffect(() => {
        if (isOpen) {
            setSummary("");
            setError(null);
        }
    }, [isOpen, id]);

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const handleSummarize = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setSummary("");
        setError(null);

        const formData = new FormData(e.currentTarget);
        const topic = formData.get("summaryTopic");

        try {
            // Set up SSE connection
            const response = await fetch("/api/quiz/summarize", {
                method: "POST",
                body: JSON.stringify({ topic, documentId: id }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate summary');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('Failed to initialize stream reader');
            }

            // Process the stream
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (!line.startsWith('data: ')) continue;

                    const jsonStr = line.slice(5); // Remove 'data: ' prefix
                    if (jsonStr === '[DONE]') break;

                    try {
                        const eventData = JSON.parse(jsonStr);
                        if (eventData.error) {
                            throw new Error(eventData.error);
                        }
                        if (eventData.data) {
                            setSummary(prev => prev + eventData.data);
                        }
                    } catch (e) {
                        console.error('Failed to parse SSE data:', e);
                    }
                }
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
            console.error('Summarization error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpen}>
            <AlertDialogContent className='overflow-y-auto max-h-[80vh]'>
                <AlertDialogHeader className='relative'>
                    <AlertDialogTitle>Summarize Document</AlertDialogTitle>
                    <AlertDialogCancel className='absolute -top-7 text-muted-foreground -right-2 border-none p-0 hover:bg-transparent'>
                        <X className="size-4" />
                    </AlertDialogCancel>
                </AlertDialogHeader>
                <Card className="p-0 border-0">
                    <form onSubmit={handleSummarize} className="space-y-4">
                        <Input
                            name="summaryTopic"
                            placeholder="Enter topic to focus on (optional)"
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? "Generating summary..." : "Generate Summary"}
                        </Button>
                    </form>

                    {error && (
                        <div className="mt-4 p-4 border border-red-200 rounded bg-red-50 text-red-600">
                            {error}
                        </div>
                    )}

                    {summary && (
                        <div className='flex flex-col items-center gap-2'>
                            <div
                                id="document-summary"
                                className="mt-6 p-4 border rounded w-full"
                            >
                                <ReactMarkdown>{summary}</ReactMarkdown>
                            </div>
                            <div className='flex gap-2 items-center'>
                                <TextDownloadButton
                                    content={summary}
                                    filename="document-summary.pdf"
                                    title={`Summary of ${id}`}
                                />
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={handleCopy}
                                >
                                    {copied ? "Copied!" : (
                                        <>
                                            <Copy className="mr-2 size-4" />
                                            Copy Summary
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </AlertDialogContent>
        </AlertDialog>
    );
}