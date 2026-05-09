import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const STRIPE_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";

export async function POST(request: NextRequest) {
  if (!stripe) return NextResponse.json({ error: "stripe_unavailable" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    customer_email: user.email,
    metadata: { user_id: user.id },
    success_url: `${origin}/dashboard?upgrade=success`,
    cancel_url: `${origin}/pricing?upgrade=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
