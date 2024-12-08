'use client'

import { useState, useEffect } from 'react'
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// Import the styles
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import { Eye } from 'lucide-react'

type PDFViewerProps = {
  pdfUrl: string
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [defaultTabs[0], defaultTabs[1]],
  })

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setError(null)
    }
  }, [isOpen, pdfUrl])

  const handleDocumentLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setError('Failed to load PDF. Please try again.')
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
            <Eye className="mr-2 size-4" />
            Open PDF</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>PDF Viewer</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          <div className="relative h-[70vh] w-full overflow-hidden rounded-md border">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                <Skeleton className="h-[450px] w-full" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                <p className="text-center text-destructive">{error}</p>
              </div>
            )}
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js">
              <Viewer
                fileUrl={pdfUrl}
                plugins={[defaultLayoutPluginInstance]}
                defaultScale={SpecialZoomLevel.PageFit}
                onDocumentLoad={handleDocumentLoad}
                
              />
            </Worker>
          </div>
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="default"
              onClick={() => window.open(pdfUrl, '_blank')}
            >
              Open in New Tab
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

