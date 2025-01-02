import RealtimeAudioTranscriber from '@/components/audio-transcriber';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <RealtimeAudioTranscriber />
    </main>
  );
}