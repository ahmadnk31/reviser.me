'use client'
import { createClient } from "@/lib/supabase/client";
import SubscriptionMessage from "../../../components/subscription-message";
import { checkUserAccess } from "@/lib/check-access";
import { useEffect, useState } from "react";
export default function GeneratorPage({children}:{
    children:React.ReactNode
}) {
    
    const supabase = createClient();
    const [hasAccess, setHasAccess] = useState<boolean>(false);
    useEffect(() => {
        const fetchHasAccess= async () => {
            const { data: {user} } = await supabase.auth.getUser();
            if (user === null) {
                return;
            }
            if(user?.id){
                const access=await checkUserAccess(user.id)
                setHasAccess(access)
            }
        };
        fetchHasAccess();
    }, []);
    console.log(`hasAccess from quiz`, hasAccess)
    return(
       <>
        {
            children
        }
       </>
    )
}