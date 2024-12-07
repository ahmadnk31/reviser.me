'use client'

import { ErrorBoundary } from "react-error-boundary"
import { Button } from "@/components/ui/button"
import { AlertCircle } from 'lucide-react'

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 rounded-lg border bg-destructive/10 text-destructive">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5" />
        <h2 className="font-semibold">Something went wrong!</h2>
      </div>
      <p className="text-sm mb-4">{error.message}</p>
      <Button onClick={resetErrorBoundary} variant="outline" size="sm">
        Try again
      </Button>
    </div>
  )
}

export function StudyModeErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app here
        window.location.reload()
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
