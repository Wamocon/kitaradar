import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));
vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/session_1" }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: "https://billing.stripe.com/session_1" }),
      },
    },
    customers: {
      create: vi.fn().mockResolvedValue({ id: "cus_new" }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { POST as CHECKOUT } from "@/app/api/stripe/checkout/route";
import { POST as PORTAL } from "@/app/api/stripe/portal/route";
import { POST as WEBHOOK } from "@/app/api/stripe/webhook/route";

describe("POST /api/stripe/checkout", () => {
  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const res = await CHECKOUT(req);
    expect(res.status).toBe(401);
  });

  it("returns checkout session URL for authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        user: { id: "u1", email: "t@t.de" },
        singleData: { stripe_customer_id: null },
        updateData: {},
      }) as never
    );
    const req = new NextRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const res = await CHECKOUT(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.url).toContain("stripe.com");
  });
});

describe("POST /api/stripe/portal", () => {
  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const res = await PORTAL(req);
    expect(res.status).toBe(401);
  });

  it("returns 404 when user has no Stripe customer", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        user: { id: "u1", email: "t@t.de" },
        singleData: { stripe_customer_id: null },
      }) as never
    );
    const req = new NextRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const res = await PORTAL(req);
    expect(res.status).toBe(404);
  });

  it("returns billing portal URL when customer exists", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        user: { id: "u1", email: "t@t.de" },
        singleData: { stripe_customer_id: "cus_abc" },
      }) as never
    );
    const req = new NextRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const res = await PORTAL(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.url).toContain("stripe.com");
  });
});

describe("POST /api/stripe/webhook", () => {
  it("returns 400 when Stripe-Signature header is missing", async () => {
    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await WEBHOOK(req);
    expect(res.status).toBe(400);
  });

  it("upgrades user to Pro on checkout.session.completed", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    const mockEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_abc",
          subscription: "sub_1",
          customer_email: null,
          metadata: { user_id: "u1" },
        },
      },
    };
    vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(mockEvent as never);
    vi.mocked(createAdminClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, updateData: {}, singleData: { profile_id: "u1" } }) as never
    );
    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=123,v1=abc",
      },
    });
    const res = await WEBHOOK(req);
    expect(res.status).toBe(200);
    vi.unstubAllEnvs();
  });

  it("downgrades user to free on customer.subscription.deleted", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    const mockEvent = {
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_abc", status: "canceled" } },
    };
    vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(mockEvent as never);
    vi.mocked(createAdminClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, updateData: {}, singleData: { profile_id: "u1" } }) as never
    );
    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=123,v1=abc",
      },
    });
    const res = await WEBHOOK(req);
    expect(res.status).toBe(200);
    vi.unstubAllEnvs();
  });
});
