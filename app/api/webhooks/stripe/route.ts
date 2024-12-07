import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await supabase
          .from('users')
          .update({
            subscription_tier: subscription.items.data[0].price.lookup_key || 'free',
            subscription_status: subscription.status,
          })
          .eq('stripe_customer_id', subscription.customer);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await supabase
          .from('users')
          .update({
            subscription_type: 'free',
            subscription_status: 'canceled',
          })
          .eq('stripe_customer_id', deletedSubscription.customer);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
}