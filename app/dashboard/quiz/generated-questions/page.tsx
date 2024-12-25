'use client'
import PDFViewer from '@/components/pdf-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client';
import { IconFileTypePdf } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

type Document = {
  id: string
  document_id: string
  pdf_link: string
  metadata: {
    type: string
  },
  documents: {
    id: string
    user_id: string
    pdf_link: string
    created_at: string
    metadata: {
      type: string
    }
  }
}

export default function GeneratedQuestionsPage() {
  const supabase = createClient()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('No user found')
          return
        }

        // First, get the user's documents
        const { data: documentQuestions, error: queryError } = await supabase
          .from('documents')
          .select(`
            id,
            file_url,
            created_at,
            metadata,
            document_questions (*)
          `)
          .eq('user_id', user.id)

        if (queryError) {
          console.error('Query error:', queryError)
          setError(queryError.message)
          return
        }

        console.log('Fetched data:', documentQuestions)

        if (documentQuestions) {
          // Transform the data to match your component's expectations
          const transformedData = documentQuestions.flatMap(doc => 
            doc.document_questions.map(question => ({
              ...question,
              documents: {
                id: doc.id,
                user_id: user.id,
                pdf_link: doc.file_url,
                created_at: doc.created_at,
                metadata: doc.metadata
              }
            }))
          )

          setDocuments(transformedData)
        }
      } catch (err) {
        console.error('Error fetching documents:', err)
        setError('Failed to fetch documents')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDocuments()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  console.log(`Documents:`, documents)
  return (
    <div className="container py-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {documents?.map((document, i) => (
          <Card key={i} className="space-y-4 flex flex-col justify-between">
            <CardHeader className='text-center'>
              <CardTitle className='text-lg md:text-xl'>
                {document.metadata.type}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex flex-col gap-4'>
              <PDFViewer 
                className='w-full' 
                text='Open your PDF' 
                pdfUrl={document.pdf_link} 
              />
              <span className="text-sm text-gray-500 line-clamp-1">{`
                ${new Date(document.documents.created_at).toLocaleDateString()} ${new Date(document.documents.created_at).toLocaleTimeString()}
              `}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
      {
        documents.length === 0 && (
          <div className="text-center text-gray-500 mt-4">
            No questions found
          </div>
        )
      }
    </div>
  );
}