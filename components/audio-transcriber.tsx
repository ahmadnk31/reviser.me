'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, PlayCircle, StopCircle } from 'lucide-react';

const CHUNK_SIZE = 5000; // 5 seconds

export default function RealtimeSystemAudioTranscriber() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
      
      const audioTrack = stream.getAudioTracks()[0];
      const audioStream = new MediaStream([audioTrack]);
      
      // Explicitly set audio format
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      const mediaRecorder = new MediaRecorder(audioStream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(CHUNK_SIZE);
      setIsRecording(true);

      // Modified interval to be slightly longer than chunk size
      intervalRef.current = setInterval(sendChunksForTranscription, CHUNK_SIZE + 1000);
    } catch (error) {
      console.error('Error accessing system audio:', error);
      setError('Failed to access system audio. Please ensure you have given permission and try again.');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Add small delay before final transcription
      setTimeout(sendChunksForTranscription, 500);
    }
  }, [isRecording]);

  const sendChunksForTranscription = async () => {
    if (chunksRef.current.length === 0) return;

    try {
      // Create a new blob with explicit type
      const audioBlob = new Blob(chunksRef.current, {
        type: 'audio/webm'
      });

      // Only process if we have enough data
      if (audioBlob.size > 0) {
        await transcribeAudio(audioBlob);
      }
      
      // Clear chunks after successful processing
      chunksRef.current = [];
    } catch (error) {
      console.error('Error processing audio chunks:', error);
      setError('Error processing audio. Please try again.');
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    if (audioBlob.size === 0) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      // Ensure proper filename with extension
      const file = new File([audioBlob], 'recording.webm', {
        type: 'audio/webm',
        lastModified: Date.now(),
      });
      formData.append('audio', file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      if (data.transcript) {
        setTranscript(prev => prev + ' ' + data.transcript.trim());
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      setError(error.message || 'Failed to transcribe audio. Please try again.');
      
      // Stop recording if we encounter an error
      if (isRecording) {
        stopRecording();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        className="w-full"
        disabled={isLoading}
      >
        {isRecording ? (
          <>
            <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
          </>
        ) : (
          <>
            <PlayCircle className="mr-2 h-4 w-4" /> Start Real-time Transcription
          </>
        )}
      </Button>

      {isLoading && (
        <div className="text-center">
          <p>Transcribing...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">Real-time Transcript:</h3>
        <Textarea
          value={transcript}
          readOnly
          className="h-40"
          placeholder="Transcription will appear here in real-time..."
        />
      </div>
    </div>
  );
}