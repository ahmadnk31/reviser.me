"use client";

import { useEffect, useState } from 'react';
import { DocumentList } from '@/components/documents/document-list';
import { DocumentProcessor } from '@/components/document-upload';
import { DocumentWorkspace } from '@/components/documents/document-workspace';
import { createClient } from '@/lib/supabase/client';
import { Document } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUpload from '@/components/upload';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedDocs: Document[] = data.map(doc => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          type: doc.type,
          pageCount: doc.page_count,
          uploadedAt: doc.created_at,
          userId: doc.user_id
        }));
        setDocuments(mappedDocs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Document Processing</h1>

      <Tabs defaultValue="upload" className="space-y-8">
        <TabsList>
          <TabsTrigger value="upload">Upload Document</TabsTrigger>
          <TabsTrigger value="workspace" disabled={!selectedDocument}>
            Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-8">
          <FileUpload />
          <DocumentProcessor onUploadComplete={fetchDocuments} />
          <DocumentList
            documents={documents}
            loading={loading}
            selectedDocument={selectedDocument}
            onDocumentSelect={setSelectedDocument}
            onDocumentDelete={fetchDocuments}
          />
        </TabsContent>

        <TabsContent value="workspace">
          {selectedDocument && (
            <DocumentWorkspace document={selectedDocument} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}