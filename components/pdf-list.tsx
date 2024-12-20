import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, List } from 'lucide-react';
import ChatPDF from './chat-pdf';
import SummarizeChat from './summarize-chat';
import PDFViewer from './pdf-viewer';
import CreateNew from './create-new';

interface PDFDocument {
    id: string;
    title: string;
    created_at: string;
    file_url: string;
  }

export function PDFList({active}: {active: boolean}) {
    const [documents, setDocuments] = useState<PDFDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const [chatPDF, setChatPDF] = useState(false);
    const [summarizeChat, setSummarizeChat] = useState(false);
    const [selectedDocumentId, setSelectedDocumentId] = useState('');

    useEffect(() => {
        async function fetchDocuments() {
            try {
                const { data, error } = await supabase
                    .from('documents')
                    .select('*').eq('user_id', (await supabase.auth.getUser()).data?.user?.id || '')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setDocuments(data || []);
            } catch (error) {
                console.error('Error fetching documents:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDocuments();
    }, []);

    const handleOpenChatPDF = (documentId: string) => {
        setSelectedDocumentId(documentId);
        setChatPDF(true);
    };

    const handleOpenSummarizeChat = (documentId: string) => {
        setSelectedDocumentId(documentId);
        setSummarizeChat(true);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {documents.map((doc) => (
                <Card key={doc.id} className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold">{doc.title}</h3>
                            <p className="text-sm text-gray-500">
                                {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                        <PDFViewer 
                            pdfUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/quiz/${doc.file_url}`} 
                        />
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenChatPDF(doc.id)}
                            disabled={active}
                            aria-disabled={active}
                        >
                            <List className="h-4 w-4 mr-2" />
                            Questions
                        </Button>
                        
                        <Button
                            disabled={active}
                            aria-disabled={active}
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSummarizeChat(doc.id)}
                        >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Summarize
                        </Button>
                    </div>
                </Card>
            ))}

            {/* Modals rendered outside of map to avoid multiple renders */}
            <ChatPDF 
                onOpen={setChatPDF} 
                isOpen={chatPDF} 
                id={selectedDocumentId} 
            />
            <SummarizeChat 
                onOpen={setSummarizeChat} 
                isOpen={summarizeChat} 
                id={selectedDocumentId} 
            />

            <CreateNew active={active}/>

            {loading && (
                <div className="text-center col-span-full">
                    Loading documents...
                </div>
            )}

            {documents.length === 0 && !loading && (
                <div className="text-center col-span-full">
                    No documents found.
                </div>
            )}
        </div>
    );
}