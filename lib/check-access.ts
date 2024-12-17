import { createClient } from "./supabase/client"

export async function checkUserAccess(userId: string) {
    const supabase = createClient()
  
    // Fetch user's subscription details
    const { data: userData, error } = await supabase
      .from('users')
      .select('subscription_status, subscription_end_date, free_credits')
      .eq('id', userId)
      .single()
  
    if (error || !userData) {
      return false
    }
  
    // Check if subscription is active or still within access period
    if (userData.subscription_status === 'active'||userData.free_credits>0) {
      return true
    }
    
    if (userData.subscription_status === 'pending_cancellation') {
      const accessEnd = new Date(userData.subscription_end_date)
      return accessEnd > new Date()
    }
  
    return false
  }
  
  // Example usage in a route handler
  