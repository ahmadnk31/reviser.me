"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createClient } from '@/lib/supabase/client'
import { Brain } from 'lucide-react'
import { BasicInfoStep, EducationStep, InterestsStep } from "@/components/onboarding-steps"

const steps = ["Basic Info", "Education", "Interests"]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [userData, setUserData] = useState({
    fullName: "",
    occupation: "",
    degree: "",
    favoriteSubject: "",
    interests: [],
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  const userId = searchParams.get("userId")
  

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    const {data:{user}}=await supabase.auth.getUser()
    try {
      const { error } = await supabase
        .from('users')
        .upsert({ 
          id: user?.id,
          full_name: userData.fullName,
          email: user?.email,
          occupation: userData.occupation,
          degree: userData.degree,
          favorite_subject: userData.favoriteSubject,
          interests: userData.interests,
        })

      if (error) throw error

      toast({
        title: "Profile created!",
        description: "Welcome to AI Study Assistant.",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mb-8 flex items-center space-x-2">
        <Brain className="h-6 w-6" />
        <span className="text-2xl font-bold">AI Study Assistant</span>
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">Welcome aboard!</h2>
          <p className="mt-2 text-gray-600">Let's personalize your experience</p>
        </div>
        <div className="flex justify-center space-x-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`h-2 w-16 rounded-full ${
                index <= currentStep ? "bg-blue-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <div className="mt-8">
          {currentStep === 0 && (
            <BasicInfoStep
              fullName={userData.fullName}
              occupation={userData.occupation}
              onInputChange={handleInputChange}
            />
          )}
          {currentStep === 1 && (
            <EducationStep
              degree={userData.degree}
              favoriteSubject={userData.favoriteSubject}
              onInputChange={handleInputChange}
            />
          )}
          {currentStep === 2 && (
            <InterestsStep
              interests={userData.interests}
              onInputChange={handleInputChange}
            />
          )}
        </div>
        <div className="flex justify-between mt-8">
          {currentStep > 0 && (
            <Button onClick={handlePrevStep}>Previous</Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNextStep}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Finishing up..." : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

