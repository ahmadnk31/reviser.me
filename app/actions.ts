'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { encodedRedirect } from "@/components/encoded-redirect"

export async function forgotPasswordAction(formData: FormData) {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    const email = formData.get('email') as string
    const origin = (await headers()).get('origin')
    const forwardedHost = (await headers()).get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === "development"
    
    let baseUrl = origin
    if (!isLocalEnv && forwardedHost) {
      baseUrl = `https://${forwardedHost}`
    }

    if (!email) {
        return encodedRedirect('error', '/forgot-password', 'Email is required')
    }

    try {
        // Generate the PKCE code verifier
        const codeVerifier = crypto.randomUUID();
        
        // Store the code verifier in a cookie
        await (await cookieStore).set('code_verifier', codeVerifier, {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 // 1 hour
        });

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${baseUrl}/auth/callback?redirect_to=/reset-password`,
            captchaToken:codeVerifier// Add the code verifier here
        })
        
        if (error) throw error
    } catch (err: any) {
        return encodedRedirect('error', '/forgot-password', err.message)
    }

    return encodedRedirect('success', '/forgot-password', 'Reset link sent')
}
export async function resetPasswordAction(formData:FormData){
    const cookieStore=cookies()
    const supabase=await createClient(cookieStore)
    const password=formData.get('password') as string
    const confirmPassword=formData.get('confirmPassword') as string
    if(!password || !confirmPassword){
        return encodedRedirect('error','/reset-password','Password is required')
    }
    if(password!==confirmPassword){
        return encodedRedirect('error','/reset-password','Passwords do not match')
    }
    const {error}=await supabase.auth.updateUser({password})
    if(error){
        return encodedRedirect('error','/reset-password',error.message)
    }
    return encodedRedirect('success','/reset-password','Password reset successfully')
}

export async function signOutAction(){
    const cookieStore=cookies()
    const supabase=await createClient(cookieStore)
    await supabase.auth.signOut()
    return redirect('/login')
}
export async function signInWithGoogleAction(){
    const cookieStore=cookies()
    const supabase=await createClient(cookieStore)
    await supabase.auth.signInWithOAuth({provider:'google'})
}

export async function signUpAction(formData:FormData){
    const cookieStore=cookies()
    const supabase=await createClient(cookieStore)
    const email=formData.get('email') as string
    const password=formData.get('password') as string
    if(!email || !password){
        return encodedRedirect('error','/auth/signup','Email and password are required')
    }
    const {error}=await supabase.auth.signUp({email,password})
    if(error){
        return encodedRedirect('error','/auth/signup',error.message)
    }
    return encodedRedirect('success','/auth/signup','Account created successfully')
}