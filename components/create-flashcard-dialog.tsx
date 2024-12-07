"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { ImagePlus, Mic, Plus, StopCircle, Wand2 } from 'lucide-react'
import type { Flashcard } from "@/lib/types"

interface CreateFlashcardDialogProps {
  deckId: string
  onFlashcardCreated: (flashcard: Flashcard) => void
}

export function CreateFlashcardDialog({
  deckId,
  onFlashcardCreated,
}: CreateFlashcardDialogProps) {
  const [open, setOpen] = useState(false)
  const [front, setFront] = useState("")
  const [back, setBack] = useState("")
  const [frontImage, setFrontImage] = useState<File | null>(null)
  const [backImage, setBackImage] = useState<File | null>(null)
  const [frontAudio, setFrontAudio] = useState<File | null>(null)
  const [backAudio, setBackAudio] = useState<File | null>(null)
  const [recording, setRecording] = useState<"front" | "back" | null>(null)
  const [loading, setLoading] = useState(false)
  const [useAiImage, setUseAiImage] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleImageUpload = async (file: File, side: "front" | "back") => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${deckId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("flashcard-media")
      .upload(filePath, file)

    if (uploadError) throw uploadError

    return filePath
  }

  const generateAiImage = async (side: "front" | "back") => {
    const {data:{user}} = await supabase.auth.getUser();
    if(user === null){
      toast({
        title: "Login Required",
        description: "Please login to generate images.",
        variant: "destructive",
      });
      return;
    }
    const {data:subscription_status}=await supabase.from('users').select('subscription_status').eq('id',user.id).single();
    if(subscription_status?.subscription_status!=="active"){
      return(
        toast(
        {
          title: "Subscription Required",
          description: "Please subscribe to generate images.",
          variant: "destructive",
        }
        )
      )
    }
    setGeneratingImage(true)
    try {
      const prompt = side === "front" ? front : back
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
  
      const data = await response.json()
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image")
      }
  
      // Download and convert the image to a File object
      const imageResponse = await fetch(data.imageUrl)
      const blob = await imageResponse.blob()
      const file = new File([blob], "ai-generated.png", { type: "image/png" })
  
      if (side === "front") {
        setFrontImage(file)
      } else {
        setBackImage(file)
      }
  
      toast({
        title: "Success",
        description: "AI image generated successfully",
      })
    } catch (error: any) {
      console.error("Image generation error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI image",
        variant: "destructive",
      })
    } finally {
      setGeneratingImage(false)
    }
  }

  const startRecording = async (side: "front" | "back") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        const audioFile = new File([audioBlob], "recording.wav", { type: "audio/wav" })
        if (side === "front") {
          setFrontAudio(audioFile)
        } else {
          setBackAudio(audioFile)
        }
      }

      mediaRecorder.start()
      setRecording(side)

      // Stop recording after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop()
          setRecording(null)
        }
      }, 30000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    setRecording(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let frontImagePath = null
      let backImagePath = null
      let frontAudioPath = null
      let backAudioPath = null

      if (frontImage) {
        frontImagePath = await handleImageUpload(frontImage, "front")
      }
      if (backImage) {
        backImagePath = await handleImageUpload(backImage, "back")
      }
      if (frontAudio) {
        frontAudioPath = await handleImageUpload(frontAudio, "front")
      }
      if (backAudio) {
        backAudioPath = await handleImageUpload(backAudio, "back")
      }

      const { data, error } = await supabase
        .from("flashcards")
        .insert({
          front,
          back,
          deck_id: deckId,
          front_image: frontImagePath,
          back_image: backImagePath,
          front_audio: frontAudioPath,
          back_audio: backAudioPath,
        })
        .select()
        .single()

      if (error) throw error

      onFlashcardCreated(data)
      setOpen(false)
      resetForm()
      
      toast({
        title: "Success",
        description: "Flashcard created successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create flashcard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFront("")
    setBack("")
    setFrontImage(null)
    setBackImage(null)
    setFrontAudio(null)
    setBackAudio(null)
    setRecording(null)
    setUseAiImage(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Flashcard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Flashcard</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={useAiImage}
              onCheckedChange={setUseAiImage}
              id="ai-image"
            />
            <Label htmlFor="ai-image">Generate AI images for content</Label>
          </div>

          <Tabs defaultValue="front" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="front">Front</TabsTrigger>
              <TabsTrigger value="back">Back</TabsTrigger>
            </TabsList>
            <TabsContent value="front" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="front">Content</Label>
                <Textarea
                  id="front"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Enter the question or prompt"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Media</Label>
                <div className="flex space-x-4">
                  {useAiImage ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateAiImage("front")}
                      disabled={!front || generatingImage}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      {generatingImage ? "Generating..." : "Generate Image"}
                    </Button>
                  ) : (
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="frontImage"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) setFrontImage(file)
                        }}
                      />
                      <Label
                        htmlFor="frontImage"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Button type="button" variant="outline" size="sm">
                          <ImagePlus className="h-4 w-4 mr-2" />
                          Add Image
                        </Button>
                      </Label>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (recording === "front") {
                        stopRecording()
                      } else {
                        startRecording("front")
                      }
                    }}
                  >
                    {recording === "front" ? (
                      <>
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Record Audio
                      </>
                    )}
                  </Button>
                </div>
                {frontImage && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(frontImage)}
                      alt="Front preview"
                      className="max-h-32 rounded-md"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="back" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="back">Content</Label>
                <Textarea
                  id="back"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Enter the answer or explanation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Media</Label>
                <div className="flex space-x-4">
                  {useAiImage ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateAiImage("back")}
                      disabled={!back || generatingImage}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      {generatingImage ? "Generating..." : "Generate Image"}
                    </Button>
                  ) : (
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="backImage"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) setBackImage(file)
                        }}
                      />
                      <Label
                        htmlFor="backImage"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Button type="button" variant="outline" size="sm">
                          <ImagePlus className="h-4 w-4 mr-2" />
                          Add Image
                        </Button>
                      </Label>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (recording === "back") {
                        stopRecording()
                      } else {
                        startRecording("back")
                      }
                    }}
                  >
                    {recording === "back" ? (
                      <>
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Record Audio
                      </>
                    )}
                  </Button>
                </div>
                {backImage && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(backImage)}
                      alt="Back preview"
                      className="max-h-32 rounded-md"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}