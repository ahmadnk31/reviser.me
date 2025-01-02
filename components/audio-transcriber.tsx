'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Copy, Download, Save } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from './ui/input'

export default function SystemAudioTranscription() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [audioSource, setAudioSource] = useState<'microphone' | 'system' | 'both'>('microphone')
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const audioChunksRef = useRef<Blob[]>([])
  const [title, setTitle] = useState('')
  const [savedTranscripts, setSavedTranscripts] = useState<Array<{title: string, text: string, date: string}>>([])
  const [visualizerType, setVisualizerType] = useState<'waveform' | 'bars'>('waveform')
  const checkBrowserCompatibility = () => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      setError('System audio capture is not supported on iOS devices. Please use microphone only.');
      return false;
    }
    
    if (isSafari) {
      setError('System audio capture may be limited in Safari. For best results, use Chrome or Firefox.');
      return false;
    }
    
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('Your browser does not support system audio capture. Please use microphone only.');
      return false;
    }
    
    return true;
  };
  
  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript)
      .then(() => {
        setError('Copied to clipboard!')
        setTimeout(() => setError(null), 2000)
      })
      .catch(() => setError('Failed to copy to clipboard'))
  }

  const handleDownloadTranscript = () => {
    const element = document.createElement('a')
    const file = new Blob([transcript], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = `transcript-${new Date().toISOString().slice(0,10)}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleSaveTranscript = () => {
    if (!transcript.trim()) {
      setError('Nothing to save!')
      return
    }

    const newTranscript = {
      title: title || `Transcript ${savedTranscripts.length + 1}`,
      text: transcript,
      date: new Date().toLocaleString()
    }

    setSavedTranscripts([...savedTranscripts, newTranscript])
    setTitle('')
    setTranscript('')
  }

  const drawWaveform = (analyser: AnalyserNode, canvas: HTMLCanvasElement) => {
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const ctx = canvas.getContext('2d')!
    
    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      
      analyser.getByteTimeDomainData(dataArray)
      
      ctx.fillStyle = 'rgb(20, 20, 20)'
      ctx.fillRect(0, 0, width, height)
      
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgb(0, 255, 0)'
      ctx.beginPath()
      
      const sliceWidth = width / bufferLength
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = v * height / 2
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        
        x += sliceWidth
      }
      
      ctx.lineTo(width, height / 2)
      ctx.stroke()
      
      animationFrameRef.current = requestAnimationFrame(draw)
    }
    
    draw()
  }

  const drawBars = (analyser: AnalyserNode, canvas: HTMLCanvasElement) => {
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const ctx = canvas.getContext('2d')!
    
    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      
      analyser.getByteFrequencyData(dataArray)
      
      ctx.fillStyle = 'rgb(20, 20, 20)'
      ctx.fillRect(0, 0, width, height)
      
      const barWidth = (width / bufferLength) * 2.5
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height
        
        const r = barHeight + 25
        const g = 250
        const b = 50
        
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)
        
        x += barWidth + 1
      }
      
      animationFrameRef.current = requestAnimationFrame(draw)
    }
    
    draw()
  }

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const startVisualization = (stream: MediaStream) => {
    if (!canvasRef.current) return

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    analyserRef.current = audioContextRef.current.createAnalyser()
    
    const source = audioContextRef.current.createMediaStreamSource(stream)
    source.connect(analyserRef.current)
    
    analyserRef.current.fftSize = 2048
    
    if (visualizerType === 'waveform') {
      drawWaveform(analyserRef.current, canvasRef.current)
    } else {
      drawBars(analyserRef.current, canvasRef.current)
    }
  }

  const getMicrophoneStream = async () => {
    try {
      return await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
    } catch (err) {
      console.error('Microphone access error:', err)
      throw new Error('Microphone access denied')
    }
  }

  const getSystemAudioStream = async () => {
    try {
      // @ts-ignore - TypeScript doesn't fully recognize getDisplayMedia options
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        video: true // We only want audio, but some browsers require this
      });
  
      // Check if we got an audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('No audio track available in the captured stream');
      }
  
      // Create a new stream with only the audio track
      const audioStream = new MediaStream([audioTrack]);
  
      // Stop the video track if it exists
      stream.getVideoTracks().forEach(track => track.stop());
  
      return audioStream;
    } catch (err) {
      console.error('System audio access error:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        throw new Error('System audio access was denied. Please grant screen sharing permissions.');
      }
      throw new Error('Failed to capture system audio. Please try again.');
    }
  };
const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      ''  // Empty string is a last resort fallback
    ]
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    
    return ''
  }

  const startRecording = async () => {
    try {
      setError(null);
      let stream: MediaStream | null = null;
  
      // First do browser compatibility check for system audio if needed
      if ((audioSource === 'system' || audioSource === 'both') && !checkBrowserCompatibility()) {
        if (audioSource === 'both') {
          // Fall back to microphone only for 'both' option
         setAudioSource('microphone');
        } else {
          return; // Don't proceed if system audio was specifically requested
        }
      }
  
      // Get the appropriate stream based on audio source
      try {
        switch (audioSource) {
          case 'microphone':
            stream = await getMicrophoneStream();
            break;
          case 'system':
            stream = await getSystemAudioStream();
            break;
          case 'both':
            // Get both streams and combine them
            const [micStream, sysStream] = await Promise.all([
              getMicrophoneStream(),
              getSystemAudioStream()
            ]);
            
            // Combine the audio tracks from both streams
            const combinedTracks = [
              ...micStream.getAudioTracks(),
              ...sysStream.getAudioTracks()
            ];
            
            stream = new MediaStream(combinedTracks);
            break;
        }
      } catch (streamError) {
        console.error('Stream error:', streamError);
        throw new Error(
          streamError instanceof Error 
            ? streamError.message 
            : 'Failed to access audio stream'
        );
      }
  
      if (!stream || !stream.getAudioTracks().length) {
        throw new Error('No audio tracks available in the stream');
      }
  
      // Store the stream reference
      mediaStreamRef.current = stream;
  
      // Start audio visualization
      try {
        startVisualization(stream);
      } catch (visualError) {
        console.warn('Visualization error:', visualError);
        // Don't throw - visualization is not critical
      }
  
      // Get supported MIME type
      const mimeType = getSupportedMimeType();
      const mediaRecorderOptions: MediaRecorderOptions = {};
      
      if (mimeType) {
        mediaRecorderOptions.mimeType = mimeType;
      }
  
      // Try to create MediaRecorder with options first
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, mediaRecorderOptions);
      } catch (recorderError) {
        console.warn('MediaRecorder creation failed with mime type, trying without options');
        try {
          // Fallback to basic initialization
          mediaRecorderRef.current = new MediaRecorder(stream);
        } catch (fallbackError) {
          throw new Error('Failed to create MediaRecorder with the available audio stream');
        }
      }
  
      // Initialize recording
      audioChunksRef.current = [];
  
      // Set up MediaRecorder event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
  
      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        stopRecording();
        setError('Recording error occurred. Please try again.');
      };
  
      mediaRecorderRef.current.onstop = () => {
        sendAudioToServer();
      };
  
      // Start recording
      try {
        mediaRecorderRef.current.start(1000); // Collect data every second
        setIsRecording(true);
      } catch (startError) {
        throw new Error('Failed to start recording: ' + 
          (startError instanceof Error ? startError.message : 'unknown error'));
      }
  
    } catch (err) {
      console.error('Recording error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecording(false);
      
      // Cleanup any partial setup
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null;
      }
    }
  };
  const stopRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    setIsRecording(false)

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!
      ctx.fillStyle = 'rgb(20, 20, 20)'
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const sendAudioToServer = async () => {
    if (audioChunksRef.current.length === 0) return

    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
    const formData = new FormData()
    formData.append('audio', audioBlob, `audio.${mimeType.split('/')[1].split(';')[0]}`)

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setTranscript(prev => prev + ' ' + data.transcript)
      } else {
        console.error('Transcription failed')
        setError('Transcription failed. Please try again.')
      }
    } catch (err) {
      console.error('Error sending audio to server:', err)
      setError('Failed to send audio for transcription. Please try again.')
    }

    audioChunksRef.current = []
  }
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Enhanced Audio Transcription</h1>
      
      <div className="flex gap-4 mb-4">
        <Select 
          value={audioSource}
          onValueChange={(value: 'microphone' | 'system' | 'both') => setAudioSource(value)}
          disabled={isRecording}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select audio source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="microphone">Microphone Only</SelectItem>
            <SelectItem value="system">System Audio Only</SelectItem>
            <SelectItem value="both">Both System & Microphone</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={visualizerType}
          onValueChange={(value: 'waveform' | 'bars') => setVisualizerType(value)}
          disabled={isRecording}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select visualizer type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="waveform">Waveform</SelectItem>
            <SelectItem value="bars">Frequency Bars</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={isRecording ? stopRecording : startRecording}
          className={`${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
      </div>

      <div className="mb-4 bg-black rounded-lg overflow-hidden">
        <canvas 
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full"
        />
      </div>

      {error && (
        <Alert variant={error.includes('Copied') ? 'default' : 'destructive'} className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.includes('Copied') ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current Transcript</h2>
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          <Input
            placeholder="Enter title to save transcript"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSaveTranscript} disabled={!transcript}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={handleCopyTranscript} disabled={!transcript}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button onClick={handleDownloadTranscript} disabled={!transcript}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        <div 
          className="p-4 rounded-lg min-h-[200px] whitespace-pre-wrap border"
          aria-live="polite"
        >
          {transcript || 'Transcript will appear here...'}
        </div>
      </div>

      {savedTranscripts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Saved Transcripts</h2>
          <div className="space-y-2">
            {savedTranscripts.map((saved, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">{saved.title}</h3>
                  <span className="text-sm text-gray-500">{saved.date}</span>
                </div>
                <p className="text-sm text-gray-600">{saved.text.slice(0, 100)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}