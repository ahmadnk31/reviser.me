import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioContext: AudioContext;
  mediaStream: MediaStream;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioContext, mediaStream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !mediaStream) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Create source from the provided media stream
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgb(200, 200, 200)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(0, 0, 0)';
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      requestAnimationFrame(draw);
    };

    draw();

    return () => {
      source.disconnect();
    };
  }, [audioContext, mediaStream]);

  return <canvas ref={canvasRef} width="640" height="100" className="w-full" />;
};

export default AudioVisualizer;