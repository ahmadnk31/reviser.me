"use client"

import { useState, useCallback } from 'react'
import { useCompletion } from 'ai/react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { FileText, Upload, Loader2, AlertCircle } from 'lucide-react'
import { updateDocumentEmbedding } from '@/lib/embeddings'
import type { DocumentProcessorProps, ProcessedDocument } from '@/lib/types'

const DEFAULT_ALLOWED_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/*': ['.png', '.jpg', '.jpeg']
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function DocumentProcessor({
  onUploadComplete,
  onError,
  onProgress,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
}: DocumentProcessorProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()
  const supabase = createClient()
  
  const {
    completion,
    complete,
    isLoading,
    error
  } = useCompletion({
    api: '/api/process-document',
    onFinish: async (result) => {
      setUploadProgress(75)
      try {
        // Save to Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('documents')
          .insert({
            title: currentFile?.name,
            content: result,
            type: getDocumentType(currentFile?.type),
            user_id: user.id
          })
          .select()
          .single()

        if (error) throw error

        // Generate and store embedding
        await updateDocumentEmbedding(data.id, result)
        
        setUploadProgress(100)
        toast({
          title: 'Success!',
          description: 'Document uploaded and processed successfully.',
        })

        // Call the onUploadComplete callback with the processed document
        onUploadComplete?.({
          content: result,
          type: getDocumentType(currentFile?.type),
          pageCount: countPages(result)
        })

      } catch (err: any) {
        console.error('Upload error:', err)
        const error = new Error(err.message || 'Failed to save document')
        onError?.(error)
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      } finally {
        setUploading(false)
        setCurrentFile(null)
      }
    }
  })

  const [currentFile, setCurrentFile] = useState<File | null>(null)

  const getDocumentType = (mimeType?: string): ProcessedDocument['type'] => {
    if (!mimeType) return 'txt'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('document')) return 'docx'
    if (mimeType.includes('image')) return 'image'
    return 'txt'
  }

  const countPages = (content: string): number => {
    // Rough estimation of pages based on content length
    // You might want to adjust this based on your needs
    return Math.ceil(content.length / 3000)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Check file size
    if (file.size > maxFileSize) {
      const error = new Error(`File size exceeds ${maxFileSize / 1024 / 1024}MB limit`)
      onError?.(error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    setCurrentFile(file)
    setUploading(true)
    setUploadProgress(20)
    onProgress?.(20)

    const formData = new FormData()
    formData.append('file', file)
    
    try {
      setUploadProgress(40)
      onProgress?.(40)
      await complete('', { body: formData })
    } catch (err: any) {
      console.error('Error processing document:', err)
      const error = new Error(err.message || 'Failed to process document')
      onError?.(error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setUploading(false)
      setCurrentFile(null)
    }
  }, [complete, toast, maxFileSize, onError, onProgress])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    multiple: false
  })

  return (
    <div className="space-y-6">
      <Card
        {...getRootProps()}
        className={`p-8 border-2 border-dashed cursor-pointer ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Processing document...</p>
              {uploadProgress > 0 && (
                <div className="w-full max-w-xs">
                  <Progress 
                    value={uploadProgress} 
                    className="w-full"
                    aria-label="Upload progress"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {uploadProgress}% complete
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop your document here' : 'Upload a document'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, TXT, DOCX, and images (max {maxFileSize / 1024 / 1024}MB)
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                <FileText className="mr-2 h-4 w-4" />
                Select File
              </Button>
            </>
          )}
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p>Error processing document. Please try again.</p>
        </div>
      )}

      {completion && (
        <Card className="p-6">
          <h3 className="font-medium mb-2">Processed Content Preview:</h3>
          <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md max-h-[200px] overflow-auto">
            {completion}
          </div>
        </Card>
      )}
    </div>
  )
}

