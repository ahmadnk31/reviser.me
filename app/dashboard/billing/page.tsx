import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BillingForm } from '@/components/billing/billing-form'

export default async function BillingPage() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Billing Management</h1>
      <BillingForm
        subscription={subscription}
        userEmail={session.user.email!}
      />
    </div>
  )
}

