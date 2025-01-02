import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';
import os from 'os';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SUPPORTED_AUDIO_FORMATS = [
  'flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'
];

export async function POST(request: Request) {
  let tempFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Ensure we have a webm file
    if (!audioFile.type.includes('webm')) {
      return NextResponse.json(
        { error: 'Invalid audio format. Expected webm format.' },
        { status: 400 }
      );
    }

    // Create temp file with .webm extension
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `temp-${Date.now()}.webm`);
    
    fs.writeFileSync(tempFilePath, buffer);

    // Verify file exists and has content
    const stats = fs.statSync(tempFilePath);
    if (stats.size === 0) {
      throw new Error('Empty audio file');
    }

    const fileStream = fs.createReadStream(tempFilePath);
    const response = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
      response_format: "json",
      temperature: 0.2,
    });

    // Clean up
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return NextResponse.json({ transcript: response.text });

  } catch (error: any) {
    // Clean up on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to clean up temporary file:', cleanupError);
      }
    }

    console.error('Transcription error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: error.status || 500 }
    );
  }
}