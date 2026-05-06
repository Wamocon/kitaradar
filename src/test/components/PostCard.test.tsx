import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PostCard, NewPostForm } from "@/components/feed/PostCard";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const basePost = {
  id: "post-1",
  title: "Mein Tipp für die Kita-Suche",
  content: "Früh anfangen und viele Kitas kontaktieren.",
  tag: "tip",
  upvotes: 3,
  created_at: "2025-01-15T10:00:00Z",
  profiles: { full_name: "Max Mustermann" },
};

describe("PostCard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  it("renders title and content", () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText("Mein Tipp für die Kita-Suche")).toBeTruthy();
    expect(screen.getByText("Früh anfangen und viele Kitas kontaktieren.")).toBeTruthy();
  });

  it("renders the tag label", () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText("Tipp")).toBeTruthy();
  });

  it("renders the author name", () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText(/Max Mustermann/)).toBeTruthy();
  });

  it("renders 'Anonym' when profiles is null", () => {
    render(<PostCard post={{ ...basePost, profiles: null }} />);
    expect(screen.getByText(/Anonym/)).toBeTruthy();
  });

  it("renders formatted date (year visible)", () => {
    render(<PostCard post={basePost} />);
    // toLocaleDateString('de-DE') returns something like '15.1.2025' or '15.01.2025'
    expect(screen.getByText(/2025/)).toBeTruthy();
  });

  it("renders initial upvote count", () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("increments upvote count optimistically on click", async () => {
    render(<PostCard post={basePost} />);
    fireEvent.click(screen.getByText("3"));
    await waitFor(() => {
      expect(screen.getByText("4")).toBeTruthy();
    });
  });

  it("disables upvote button after clicking", async () => {
    render(<PostCard post={basePost} />);
    const upvoteBtn = screen.getByText("3").closest("button")!;
    fireEvent.click(upvoteBtn);
    await waitFor(() => {
      expect(upvoteBtn).toBeDisabled();
    });
  });

  it("changes report label to 'Gemeldet' after clicking", async () => {
    render(<PostCard post={basePost} />);
    fireEvent.click(screen.getByText("Melden"));
    await waitFor(() => {
      expect(screen.getByText("Gemeldet")).toBeTruthy();
    });
  });

  it("sends upvote request to the correct URL", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchSpy);
    render(<PostCard post={basePost} />);
    fireEvent.click(screen.getByText("3"));
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/feed/posts/post-1/upvote",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});

describe("NewPostForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) }));
  });

  it("renders form fields", () => {
    render(<NewPostForm onPosted={vi.fn()} />);
    expect(screen.getByPlaceholderText("Titel...")).toBeTruthy();
    expect(screen.getByPlaceholderText("Ihr Beitrag...")).toBeTruthy();
  });

  it("renders submit button", () => {
    render(<NewPostForm onPosted={vi.fn()} />);
    expect(screen.getByText("Veröffentlichen")).toBeTruthy();
  });

  it("calls onPosted after successful submit", async () => {
    const onPosted = vi.fn();
    render(<NewPostForm onPosted={onPosted} />);
    fireEvent.change(screen.getByPlaceholderText("Titel..."), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Ihr Beitrag..."), { target: { value: "Inhalt" } });
    fireEvent.click(screen.getByText("Veröffentlichen"));
    await waitFor(() => {
      expect(onPosted).toHaveBeenCalledTimes(1);
    });
  });

  it("shows 'Pro-Mitglieder' error on 403 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) })
    );
    render(<NewPostForm onPosted={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Titel..."), { target: { value: "T" } });
    fireEvent.change(screen.getByPlaceholderText("Ihr Beitrag..."), { target: { value: "C" } });
    fireEvent.click(screen.getByText("Veröffentlichen"));
    await waitFor(() => {
      expect(screen.getByText(/Pro-Mitglieder/)).toBeTruthy();
    });
  });

  it("does not submit when title or content is empty", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<NewPostForm onPosted={vi.fn()} />);
    fireEvent.click(screen.getByText("Veröffentlichen"));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
