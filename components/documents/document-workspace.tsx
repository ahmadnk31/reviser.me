"use client";

import { Document } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentChat } from '../document-chat';
import { DocumentSummary } from '../document-summary';
import { QuestionGenerator } from '../question-generator';

interface DocumentWorkspaceProps {
  document: Document;
}

export function DocumentWorkspace({ document }: DocumentWorkspaceProps) {
  return (
    <Tabs defaultValue="chat" className="space-y-4">
      <TabsList>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="questions">Generate Questions</TabsTrigger>
      </TabsList>

      <TabsContent value="chat">
        <DocumentChat document={document} />
      </TabsContent>

      <TabsContent value="summary">
        <DocumentSummary document={document} />
      </TabsContent>

      <TabsContent value="questions">
        <QuestionGenerator document={document} />
      </TabsContent>
    </Tabs>
  );
}