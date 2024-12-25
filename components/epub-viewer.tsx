'use client'
import React, { useState } from 'react'
import { ReactReader } from 'react-reader'
import { AlertDialog
, AlertDialogContent    , AlertDialogTrigger } from './ui/alert-dialog'
import { Button } from './ui/button'
import { Download, FileIcon, Maximize, Minimize } from 'lucide-react'

export const EpubViewer = ({src}:{src:string}) => {
  const [location, setLocation] = useState<string | number>(0)
    const [isFullscreen, setIsFullscreen] = useState(false);
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    }
    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = src.split('/').pop() || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };
  return (
    <AlertDialog>
        <AlertDialogTrigger asChild>
            <Button variant='outline' size='sm' className="flex items-center gap-2 w-full">
                <FileIcon className="h-4 w-4" />
                View
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className={` overflow-y-auto  ${isFullscreen ? 'w-screen h-screen max-w-none' : 'max-h-[90vh]'}`}>
            <div className="flex justify-end gap-2 mb-2 sticky top-0 z-10">
            <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download
                    </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="flex items-center gap-2"
                >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    {isFullscreen ? 'Minimize' : 'Maximize'}
                </Button>
            </div>
            <ReactReader
                url={src}
                location={location}
                locationChanged={(epubcifi) => setLocation(epubcifi)}
            />
        </AlertDialogContent>
    </AlertDialog>
  )
}