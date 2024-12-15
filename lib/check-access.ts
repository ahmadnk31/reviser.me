import { createClient } from "./supabase/client"

export async function checkUserAccess(userId: string) {
    const supabase = createClient()
  
    // Fetch user's subscription details
    const { data: userData, error } = await supabase
      .from('users')
      .select('subscription_status, subscription_access_end')
      .eq('id', userId)
      .single()
  
    if (error || !userData) {
      return false
    }
  
    // Check if subscription is active or still within access period
    if (userData.subscription_status === 'active') {
      return true
    }
  
    if (userData.subscription_status === 'pending_cancellation') {
      const accessEnd = new Date(userData.subscription_access_end)
      return accessEnd > new Date()
    }
  
    return false
  }
  
  // Example usage in a route handler
  