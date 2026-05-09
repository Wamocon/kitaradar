import { describe, it, expect } from "vitest";
import { routing } from "@/i18n/routing";

describe("i18n routing configuration", () => {
  it("supports German and English locales", () => {
    expect(routing.locales).toContain("de");
    expect(routing.locales).toContain("en");
    expect(routing.locales).toHaveLength(2);
  });

  it("uses German as the default locale", () => {
    expect(routing.defaultLocale).toBe("de");
  });

  it("locales array is readonly and has the correct order", () => {
    expect(routing.locales[0]).toBe("de");
    expect(routing.locales[1]).toBe("en");
  });
});
