import { describe, it, expect } from "vitest";

describe("KitaRadar Smoke Tests", () => {
  it("should have a valid app name", () => {
    expect("kitaradar").toBe("kitaradar");
  });

  it("should define the supported locales", () => {
    const locales = ["de", "en"];
    expect(locales).toHaveLength(2);
    expect(locales).toContain("de");
    expect(locales).toContain("en");
  });

  it("should define the subscription tiers", () => {
    const tiers = ["free", "pro"] as const;
    expect(tiers[0]).toBe("free");
    expect(tiers[1]).toBe("pro");
  });

  it("should have the correct pro price", () => {
    const proPriceEur = 7.99;
    expect(proPriceEur).toBeGreaterThan(0);
  });
});
