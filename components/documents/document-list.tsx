"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { Document } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { FileText, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
  selectedDocument: Document | null;
  onDocumentSelect: (doc: Document) => void;
  onDocumentDelete: () => void;
}

export function DocumentList({
  documents,
  loading,
  selectedDocument,
  onDocumentSelect,
  onDocumentDelete
}: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const handleDeleteDocument = async () => {
    if (!deletingDocument) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', deletingDocument.id);

      if (error) throw error;

      onDocumentDelete();
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingDocument(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No documents uploaded yet. Upload your first document to get started!
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className={`cursor-pointer transition-colors hover:border-primary ${
              selectedDocument?.id === doc.id ? 'border-primary' : ''
            }`}
            onClick={() => onDocumentSelect(doc)}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span className="truncate">{doc.title}</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingDocument(doc);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                {formatDistanceToNow(new Date(doc.uploadedAt), {
                  addSuffix: true,
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}