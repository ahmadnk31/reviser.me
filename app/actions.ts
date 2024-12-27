'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { encodedRedirect } from "@/components/encoded-redirect"

export async function forgotPasswordAction(formData: FormData) {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    const email = formData.get('email') as string

    

    if (!email) {
        return encodedRedirect('error', '/forgot-password', 'Email is required')
    }

    try {
        // Generate the PKCE code verifier
        
        // Store the code verifier in a cookie
        
        const { data,error } = await supabase.auth.resetPasswordForEmail(email)
        
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
    const confirmPassword=formData.get('confirm-password') as string
    if(!password || !confirmPassword){
        return encodedRedirect('error','/account/update-password','Password is required')
    }
    if(password!==confirmPassword){
        return encodedRedirect('error','/account/update-password','Passwords do not match')
    }
    const {error}=await supabase.auth.updateUser({password})
    if(error){
        return encodedRedirect('error','/account/update-password',error.message)
    }
    return encodedRedirect('success','/account/update-password','Password reset successfully')
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
        return encodedRedirect('error','/signup','Email and password are required')
    }
    const {error}=await supabase.auth.signUp({email,password})
    if(error){
        return encodedRedirect('error','/signup',error.message)
    }
    return encodedRedirect('success','/signup','Account created successfully')
}


