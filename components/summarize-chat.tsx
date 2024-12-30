'use client'

import { useState } from "react";
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
import React from "react";
import { DownloadButton } from "./generate-pdf";
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
    // Reset summary when modal opens or document id changes
    React.useEffect(() => {
        if (isOpen) {
            setSummary("");
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
        setSummary("");  // Clear previous summary

        const formData = new FormData(e.currentTarget);
        const data = {
            topic: formData.get("summaryTopic"),
        };

        try {
            const response = await fetch("/api/quiz/summarize", {
                method: "POST",
                body: JSON.stringify({ topic: data.topic, documentId: id }),
            });
            const result = await response.json();
            setSummary(result.summary);
        } catch (error) {
            console.error(error);
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
                            {loading ? "Summarizing..." : "Generate Summary"}
                        </Button>
                    </form>

                    {summary && (
                        <div className='flex flex-col items-center gap-2'>

                            <div
                                id="document-summary"
                                className="mt-6 p-4 border rounded"
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
                                variant='outline' size='sm'
                                onClick={handleCopy}
                                className=""
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
    )
}