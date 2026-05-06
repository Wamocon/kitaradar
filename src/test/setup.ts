import "@testing-library/jest-dom";
import { vi } from "vitest";

// ─── next/headers ──────────────────────────────────────────────────────────
// Not available in jsdom – provide a stub so server-side modules can be imported
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    has: vi.fn().mockReturnValue(false),
    toString: vi.fn().mockReturnValue(""),
  }),
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// ─── Browser APIs not in jsdom ──────────────────────────────────────────────
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

Object.defineProperty(window, "open", { value: vi.fn(), writable: true });
Object.defineProperty(URL, "createObjectURL", {
  value: vi.fn().mockReturnValue("blob:mock"),
  writable: true,
});
Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), writable: true });
