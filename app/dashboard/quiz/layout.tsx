import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import SubscriptionMessage from "../../../components/subscription-message";
import { checkUserAccess } from "@/lib/check-access";
export default async function GeneratorPage({children}:{
    children:React.ReactNode
}) {
    const cookieStore=cookies()
    const supabase= createClient(cookieStore)
    const {data:{user}}=await supabase.auth.getUser()
    const {data:credits}=await supabase.from('users').select('free_credits').eq('id',user?.id).single()
    const hasAccess = user?.id ? await checkUserAccess(user.id) : false;
    if (hasAccess === false&&credits?.free_credits===0) {
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