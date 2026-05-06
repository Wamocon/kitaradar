import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  if (!stripe) return NextResponse.json({ error: "stripe_unavailable" }, { status: 503 });

  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    if (!userId) return NextResponse.json({ ok: true });

    const customerId = typeof session.customer === "string" ? session.customer : null;
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;

    await supabase.from("subscriptions").upsert({
      profile_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: "active",
    });

    await supabase.from("profiles").update({ tier: "pro" }).eq("id", userId);
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const active = subscription.status === "active" || subscription.status === "trialing";
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : null;

    if (customerId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("profile_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (sub?.profile_id) {
        await supabase
          .from("subscriptions")
          .update({ status: active ? "active" : "cancelled" })
          .eq("stripe_customer_id", customerId);

        await supabase
          .from("profiles")
          .update({ tier: active ? "pro" : "free" })
          .eq("id", sub.profile_id);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
