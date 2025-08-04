import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2022-11-15",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") as string,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
);

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") as string
    );
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        await supabase.from('subscriptions').update({ 
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'active',
          current_period_end: new Date(session.expires_at * 1000)
        }).eq('user_id', userId);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        await supabase.from('subscriptions').update({ 
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000)
        }).eq('stripe_subscription_id', sub.id);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await supabase.from('subscriptions').update({ 
          status: 'canceled'
        }).eq('stripe_subscription_id', sub.id);
        break;
      }
    }
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
