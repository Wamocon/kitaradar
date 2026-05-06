import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FeedClient } from "@/components/feed/FeedClient";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const mockPosts = [
  {
    id: "p1",
    title: "Kita-Tipps",
    content: "Früh bewerben!",
    tag: "tip",
    upvotes: 5,
    created_at: "2025-01-01T00:00:00Z",
    profiles: { full_name: "Anna" },
  },
];

describe("FeedClient", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ posts: mockPosts }),
      })
    );
  });

  it("loads and displays posts", async () => {
    render(<FeedClient isPro={false} />);
    await waitFor(() => {
      expect(screen.getByText("Kita-Tipps")).toBeTruthy();
    });
  });

  it("shows the Pro-gate notice when not Pro", async () => {
    render(<FeedClient isPro={false} />);
    await waitFor(() => {
      expect(screen.getByText(/Pro-Funktion/)).toBeTruthy();
    });
  });

  it("hides the Pro-gate notice for Pro users", async () => {
    render(<FeedClient isPro={true} />);
    await waitFor(() => {
      expect(screen.queryByText(/Pro-Funktion/)).toBeNull();
    });
  });

  it("shows 'Neuer Beitrag' button for Pro users", async () => {
    render(<FeedClient isPro={true} />);
    await waitFor(() => {
      expect(screen.getByText("Neuer Beitrag")).toBeTruthy();
    });
  });

  it("does not show 'Neuer Beitrag' button for free users", async () => {
    render(<FeedClient isPro={false} />);
    await waitFor(() => {
      expect(screen.queryByText("Neuer Beitrag")).toBeNull();
    });
  });

  it("toggles the new post form when 'Neuer Beitrag' is clicked", async () => {
    render(<FeedClient isPro={true} />);
    await waitFor(() => screen.getByText("Neuer Beitrag"));
    fireEvent.click(screen.getByText("Neuer Beitrag"));
    expect(screen.getByText("Abbrechen")).toBeTruthy();
    expect(screen.getByPlaceholderText("Titel...")).toBeTruthy();
  });

  it("renders tag filter buttons", async () => {
    render(<FeedClient isPro={false} />);
    await waitFor(() => {
      expect(screen.getByText("Alle")).toBeTruthy();
      expect(screen.getByText("Tipps")).toBeTruthy();
      expect(screen.getByText("Fragen")).toBeTruthy();
    });
  });

  it("shows empty state when no posts exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [] }) })
    );
    render(<FeedClient isPro={false} />);
    await waitFor(() => {
      expect(screen.getByText(/Noch keine Beiträge/)).toBeTruthy();
    });
  });

  it("reloads posts when a tag filter is clicked", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ posts: mockPosts }) });
    vi.stubGlobal("fetch", fetchSpy);
    render(<FeedClient isPro={false} />);
    await waitFor(() => screen.getByText("Tipps"));
    fireEvent.click(screen.getByText("Tipps"));
    await waitFor(() => {
      // Called at least twice: initial load + after tag change
      expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
