import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const cookieStore=cookies()
  try {
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: user } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.stripe_customer_id) {
      return NextResponse.json({
        subscription: null,
        upcomingInvoice: null,
        invoices: [],
      });
    }

    const [subscription, upcomingInvoice, invoices] = await Promise.all([
      stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: 'active',
        limit: 1,
      }),
      stripe.invoices.list({
        customer: user.stripe_customer_id,
        status: 'draft',
        limit: 1,
      }),
      stripe.invoices.list({
        customer: user.stripe_customer_id,
        status: 'paid',
        limit: 12,
      }),
    ]);

    return NextResponse.json({
      subscription: subscription.data[0] || null,
      upcomingInvoice: upcomingInvoice.data[0] || null,
      invoices: invoices.data,
    });
  } catch (error) {
    console.error('Stripe billing info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    );
  }
}