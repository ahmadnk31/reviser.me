import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import SubscriptionMessage from "../../../components/subscription-message";
export default async function GeneratorPage({children}:{
    children:React.ReactNode
}) {
    const cookieStore=cookies()
    const supabase= createClient(cookieStore)
    const {data:{user}}=await supabase.auth.getUser()
    const {data}=await supabase.from('users').select('subscription_status').eq('id',user?.id).single()
    if(data?.subscription_status!=="active"){
        return (
            <SubscriptionMessage/>
        )
    }
    return(
       <>
        {children}
       </>
    )
}