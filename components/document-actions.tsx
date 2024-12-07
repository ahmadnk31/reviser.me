"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Document } from '@/lib/types';
import { Brain, MessageSquare } from 'lucide-react';
import { DocumentChat } from './document-chat';
import { DocumentSummary } from './document-summary';

interface DocumentActionsProps {
  document: Document;
}

export function DocumentActions({ document }: DocumentActionsProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  return (
    <div className="flex space-x-2">
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chat with {document.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <DocumentChat document={document} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Brain className="h-4 w-4 mr-2" />
            Summarize
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Summary</DialogTitle>
          </DialogHeader>
          <DocumentSummary document={document} />
        </DialogContent>
      </Dialog>
    </div>
  );
}