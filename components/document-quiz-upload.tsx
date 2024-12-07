'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, File, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {toast} from 'sonner'

interface FileWithPreview extends File {
  preview: string;
}

export function FileUploader() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const supabase= createClient()
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': []
    }
  })
  const router=useRouter()
  const removeFile = (file: FileWithPreview) => {
    const newFiles = [...files]
    newFiles.splice(newFiles.indexOf(file), 1)
    setFiles(newFiles)
  }

  const uploadFiles = async () => {
    setUploading(true)
    setUploadProgress(0)
    const formData = new FormData()
    formData.append('file', files[0])
    const generateFileNameFromTimestamp = (file: File) => {
        const timestamp = new Date().getTime()
        return `${timestamp}-${file.name}`
        }
   
    const fileName = generateFileNameFromTimestamp(files[0])
    formData.append('fileName', fileName)
    try {
        const response = await fetch('/dashboard/api/upload', {
          method: 'POST',
          body: formData,
        })
        const {data,error}=await supabase.storage.from('quiz').upload(fileName, files[0],{
            upsert:true
        })
        if (error) {
            console.error(error)
        }
        console.log(data)
        if (!response.ok) {
          toast.error('Upload failed')
          throw new Error('Upload failed')
        }
        if(response.ok){
          router.push('/quiz/chats')
          toast.success('File uploaded successfully')
        }
        const result = await response.json()
        console.log('Upload successful:', result)
  
        // Clear the files after successful upload
        setFiles([])
        setUploadProgress(100)
      } catch (error) {
        console.error('Error uploading files:', error)
      } finally {
        setUploading(false)
      }

    }

  return (
    <div className="max-w-md mx-auto p-6 rounded-lg shadow-md">
      <div
        {...getRootProps()}
        className={`p-10 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag 'n' drop some files here, or click to select files
        </p>
        <p className="mt-1 text-xs text-gray-500">
          (Only images and PDF files will be accepted)
        </p>
      </div>

      {files.length > 0 && (
        <ul className="mt-6 space-y-2">
          {files.map((file) => (
            <li key={file.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <File className="h-6 w-6 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">{file.name}</span>
                <span className="ml-2 text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <button
                onClick={() => removeFile(file)}
                className="text-red-500 hover:text-red-700"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <div className="mt-6">
          <Button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
          {uploading && (
            <Progress value={uploadProgress} className="mt-2" />
          )}
        </div>
      )}
    </div>
  )
}

