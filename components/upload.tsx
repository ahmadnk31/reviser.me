'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string>('')
  const [progress, setProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setProcessing(true)
    setProgress(0)
    setResult('')

    try {
      // Create FormData and append the file
      const formData = new FormData()
      formData.append('file', file)

      // Make the request
      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle the streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            break
          }

          // Append the new text to the result
          const text = decoder.decode(value)
          setResult(prev => prev + text)
          
          // Update progress (this is approximate)
          setProgress(prev => Math.min(prev + 10, 90))
        }
      }

    } catch (error) {
      console.error('Upload error:', error)
      setResult('Error processing file')
    } finally {
      setProcessing(false)
      setProgress(100)
    }
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={processing}
          accept=".txt,.pdf,.doc,.docx"
        />
        <Button type="submit" disabled={!file || processing}>
          {processing ? 'Processing...' : 'Upload and Process'}
        </Button>
      </form>

      {processing && (
        <Progress value={progress} className="w-full" />
      )}

      {result && (
        <div className="mt-4 p-4 border rounded-md bg-muted">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  )
}

