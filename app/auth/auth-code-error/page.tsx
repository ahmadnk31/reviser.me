'use client'
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AuthCodeErrorPage() {
    const router = useRouter()
    return (
        <div>
        <h1>Auth Code Error</h1>
        <p>There was an error with your authentication code. Please try again.</p>
        <Button onClick={() => router.push('/login')}>Go back to login</Button>
        </div>
    )
    }