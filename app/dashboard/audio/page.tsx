import RealtimeAudioTranscriber from '@/components/audio-transcriber';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Audio Transcription with Whisper AI</h1>
      <RealtimeAudioTranscriber />
    </main>
  );
}