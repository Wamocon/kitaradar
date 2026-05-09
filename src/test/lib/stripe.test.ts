import { describe, it, expect, vi, afterEach } from "vitest";

// ─── stripe exports a Stripe instance when key is available ──────────────────
describe("stripe lib", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("exports null when STRIPE_SECRET_KEY is not set", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const { stripe } = await import("@/lib/stripe");
    expect(stripe).toBeNull();
  });

  it("exports a Stripe-like object when STRIPE_SECRET_KEY is set", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake_key_for_testing");
    const { stripe } = await import("@/lib/stripe");
    // Stripe constructor creates an object with known properties
    expect(stripe).not.toBeNull();
    expect(stripe).toHaveProperty("checkout");
    expect(stripe).toHaveProperty("subscriptions");
  });
});
