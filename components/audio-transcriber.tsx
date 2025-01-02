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
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioChunksRef = useRef<Float32Array[]>([])
  const [title, setTitle] = useState('')
  const [savedTranscripts, setSavedTranscripts] = useState<Array<{title: string, text: string, date: string}>>([])
  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript)
      .then(() => {
        // Show temporary success message
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
    // Optional: Clear current transcript
    // setTranscript('')
  }
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const getMicrophoneStream = async () => {
    return navigator.mediaDevices.getUserMedia({ audio: true })
  }

  const getSystemAudioStream = async () => {
    // @ts-ignore - TypeScript doesn't recognize getDisplayMedia options
    return navigator.mediaDevices.getDisplayMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
      video: true
    })
  }

  const startRecording = async () => {
    try {
      setError(null)
      let stream: MediaStream | null = null

      // Get the appropriate audio stream based on selection
      if (audioSource === 'microphone') {
        stream = await getMicrophoneStream()
      } else if (audioSource === 'system') {
        stream = await getSystemAudioStream()
      } else if (audioSource === 'both') {
        const micStream = await getMicrophoneStream()
        const sysStream = await getSystemAudioStream()
        
        // Combine both audio streams
        const audioContext = new AudioContext()
        const micSource = audioContext.createMediaStreamSource(micStream)
        const sysSource = audioContext.createMediaStreamSource(sysStream)
        const destination = audioContext.createMediaStreamDestination()
        
        micSource.connect(destination)
        sysSource.connect(destination)
        
        stream = destination.stream
      }

      if (!stream) {
        throw new Error('Failed to get audio stream')
      }

      mediaStreamRef.current = stream
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1)

      source.connect(processorRef.current)
      processorRef.current.connect(audioContextRef.current.destination)

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        audioChunksRef.current.push(new Float32Array(inputData))
      }

      setIsRecording(true)
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to start recording. Please make sure you have granted the necessary permissions.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    setIsRecording(false)
    sendAudioToServer()
  }

  const sendAudioToServer = async () => {
    if (audioChunksRef.current.length === 0) return

    const sampleRate = audioContextRef.current?.sampleRate || 44100
    const bufferLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0)
    const audioBuffer = new Float32Array(bufferLength)
    let offset = 0
    for (const chunk of audioChunksRef.current) {
      audioBuffer.set(chunk, offset)
      offset += chunk.length
    }

    const wavBuffer = createWavFile(audioBuffer, sampleRate)
    const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' })
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.wav')

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

  const createWavFile = (audioBuffer: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + audioBuffer.length * 2)
    const view = new DataView(buffer)

    // Write WAV header
    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + audioBuffer.length * 2, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(view, 36, 'data')
    view.setUint32(40, audioBuffer.length * 2, true)

    const volume = 1
    let index = 44
    for (let i = 0; i < audioBuffer.length; i++) {
      view.setInt16(index, audioBuffer[i] * (0x7FFF * volume), true)
      index += 2
    }

    return buffer
  }

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
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

      <Button
        onClick={isRecording ? stopRecording : startRecording}
        className={`${isRecording ? 'bg-red-500 hover:bg-red-600' : ' '}`}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
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
      <div className="flex gap-2 mb-2">
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