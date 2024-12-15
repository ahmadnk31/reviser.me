import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const cookieStore = cookies();
  try {
    const supabase = createClient(cookieStore);
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', data.user.id)
      .single();

    if (!user?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing information found' },
        { status: 404 }
      );
    }

    const { url } = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Stripe billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}