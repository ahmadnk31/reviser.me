'use client'
import { FileUploader } from "@/components/document-quiz-upload";
import { checkUserAccess } from "@/lib/check-access";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";


export default function QuizPage(){
     const supabase = createClient()
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
        
    return(
        <FileUploader active={!hasAccess}/>
    )
}