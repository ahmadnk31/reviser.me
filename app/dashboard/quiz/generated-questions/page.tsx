'use client'
import PDFViewer from '@/components/pdf-viewer';
import { Button } from '@/components/ui/button';
import {Card,CardHeader,CardTitle,CardContent,CardFooter} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client';
import { IconFileTypePdf } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
type Document={
  pdf_link:string
  created_at:string
  metadata:{
    type:string
  }
}
export default function GeneratedQuestionsPage() {

  const supabase=createClient()
  const [documents,setDocuments]=useState<Document[]>([])
useEffect(()=>{
  const fetchDocuments=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
  if(!user){
    return null
  }
  const {data:document}=await supabase.from('document_questions').select(`*, documents:document_id(*)`).eq('documents.user_id', user.id)
  console.log(document)
  if (document) {
    setDocuments(document)
  }
  }
  fetchDocuments()
},[])

  return (
    <div className="container py-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {documents?.map((document,i) => (
          <Card key={i} className="space-y-4 flex flex-col justify-between">
            <CardHeader className='text-center'>
              <CardTitle className='text-lg md:text-xl'>
                {document.metadata.type.replace(/_/g, ' ').toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex flex-col gap-4'>
            <PDFViewer className='w-full' text='Open your PDF' pdfUrl={document.pdf_link} />
              <span className="text-sm text-gray-500 line-clamp-1">{`
                ${new Date(document.created_at).toLocaleDateString()} ${new Date(document.created_at).toLocaleTimeString()}
              `}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}