'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { encodedRedirect } from "@/components/encoded-redirect"

export async function forgotPasswordAction(formData:FormData){
    const cookieStore=cookies()
    const supabase=await createClient(cookieStore)
    const email=formData.get('email') as string
    const origin=(await headers()).get('origin')
    const callbackUrl=formData.get('callback_url')?.toString()
    if(!email){
        return encodedRedirect('error','/forgot-password','Email is required')
    }
    try{
        await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/callback?redirect_to=/dashboard/reset-password`})
    }
    catch(err:any){
        return encodedRedirect('error','/forgot-password',err.message)
    }
    if(callbackUrl){
        return redirect(callbackUrl)
    }
    return encodedRedirect('success','/forgot-password','Reset link sent')
}

export async function resetPasswordAction(formData:FormData){
    const cookieStore=cookies()
    const supabase=await createClient(cookieStore)
    const password=formData.get('password') as string
    const confirmPassword=formData.get('confirmPassword') as string
    if(!password || !confirmPassword){
        return encodedRedirect('error','/dashboard/reset-password','Password is required')
    }
    if(password!==confirmPassword){
        return encodedRedirect('error','/dashboard/reset-password','Passwords do not match')
    }
    const {error}=await supabase.auth.updateUser({password})
    if(error){
        return encodedRedirect('error','/dashboard/reset-password',error.message)
    }
    return encodedRedirect('success','/dashboard/reset-password','Password reset successfully')
}

export async function signOutAction(){
    const cookieStore=cookies()
    const supabase=await createClient(cookieStore)
    await supabase.auth.signOut()
    return redirect('/auth/signin')
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