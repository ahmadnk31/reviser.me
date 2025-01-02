import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`)

    const buffer = Buffer.from(await audioFile.arrayBuffer())
    await fs.writeFile(tempFilePath, buffer)

    const transcription = await openai.audio.transcriptions.create({
      file: new File([await fs.readFile(tempFilePath)], 'audio.webm', { type: 'audio/webm' }),
      model: "whisper-1",
      response_format: "text",
    })

    await fs.unlink(tempFilePath)

    return NextResponse.json({ transcript: transcription })
  } catch (error: any) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}

