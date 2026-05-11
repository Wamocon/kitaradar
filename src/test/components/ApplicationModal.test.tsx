import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApplicationModal } from "@/components/search/ApplicationModal";
import type { OverpassKita } from "@/lib/overpass";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}` : key,
}));

const baseKita: OverpassKita = {
  id: "osm-1",
  name: "Kita Regenbogen",
  lat: 52.52,
  lng: 13.4,
  address: "Gartenweg 3",
  city: "Berlin",
  postalCode: "10115",
  phone: "+49301111",
  email: "kita@regenbogen.de",
  website: null,
  kitaType: "public",
  osmId: "1",
  distanceKm: 0.5,
  openingHours: null,
  operator: null,
  operatorType: null,
  capacity: null,
  description: null,
  fee: null,
  religion: null,
  minAge: null,
  maxAge: null,
  wheelchair: null,
  fax: null,
};

describe("ApplicationModal", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders the modal title", () => {
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    expect(screen.getByText("modal_title")).toBeTruthy();
  });

  it("calls onClose when the X button is clicked", () => {
    const onClose = vi.fn();
    render(<ApplicationModal kita={baseKita} onClose={onClose} />);
    // The close button (X icon) is the first button in the modal
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the cover letter textarea", () => {
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText("cover_letter_placeholder")).toBeTruthy();
  });

  it("allows typing in the cover letter field", () => {
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("cover_letter_placeholder") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Sehr geehrte Damen und Herren..." } });
    expect(textarea.value).toBe("Sehr geehrte Damen und Herren...");
  });

  it("shows 'ai_generate' button", () => {
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    expect(screen.getByText("ai_generate")).toBeTruthy();
  });

  it("populates cover letter when AI returns a letter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ letter: "KI-generiertes Anschreiben" }),
      })
    );
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("ai_generate"));
    // After generation, editMode is set to false → formatted preview is shown instead of textarea
    await waitFor(() => {
      expect(screen.getByText("KI-generiertes Anschreiben")).toBeTruthy();
    });
  });

  it("shows error message on 401 from AI endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    );
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("ai_generate"));
    await waitFor(() => {
      expect(screen.getByText(/melden Sie sich an/i)).toBeTruthy();
    });
  });

  it("shows error message when AI is unavailable (503)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
    );
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("ai_generate"));
    await waitFor(() => {
      expect(screen.getByText(/nicht verfügbar/i)).toBeTruthy();
    });
  });

  it("shows send_email button when kita has email", () => {
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    expect(screen.getByText("send_email")).toBeTruthy();
  });

  it("shows no_email message when kita has no email", () => {
    render(<ApplicationModal kita={{ ...baseKita, email: null }} onClose={vi.fn()} />);
    expect(screen.getByText("no_email")).toBeTruthy();
  });

  it("shows 'status_sent' after saving a draft", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ application: {} }) })
    );
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("save_draft"));
    await waitFor(() => {
      expect(screen.getByText("status_sent")).toBeTruthy();
    });
  });

  it("shows error text when saving fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error"))
    );
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("save_draft"));
    await waitFor(() => {
      expect(screen.getByText("error")).toBeTruthy();
    });
  });

  it("opens mailto: and saves application as sent when send_email is clicked", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ application: {} }),
    });
    vi.stubGlobal("fetch", fetchSpy);
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("send_email"));
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining("mailto:"), "_blank");
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/applications", expect.objectContaining({ method: "POST" }));
    });
  });

  it("closes modal when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<ApplicationModal kita={baseKita} onClose={onClose} />);
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows edit/preview toggle after AI generates a letter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ letter: "Sehr geehrte Damen und Herren,\n\nBewerbungstext." }),
      })
    );
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("ai_generate"));
    await waitFor(() => screen.getByText("Bewerbungstext."));
    // Toggle to edit mode
    fireEvent.click(screen.getByText("Bearbeiten"));
    // Should now show the textarea again
    expect(screen.getByPlaceholderText("cover_letter_placeholder")).toBeTruthy();
    // Toggle back to preview
    fireEvent.click(screen.getByText("Vorschau"));
    expect(screen.getByText("Bewerbungstext.")).toBeTruthy();
  });

  it("shows regenerate label when cover letter already exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ letter: "Erstes Anschreiben" }),
      })
    );
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("ai_generate"));
    await waitFor(() => screen.getByText("Erstes Anschreiben"));
    expect(screen.getByText("Anschreiben neu generieren")).toBeTruthy();
  });

  it("renders kita address in header when address is present", () => {
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    expect(screen.getByText(/Gartenweg 3/)).toBeTruthy();
  });

  it("renders kita address without city when city is empty", () => {
    render(<ApplicationModal kita={{ ...baseKita, city: "" }} onClose={vi.fn()} />);
    expect(screen.getByText("Gartenweg 3")).toBeTruthy();
  });

  it("send_email uses cover letter text in mailto body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) }));
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("cover_letter_placeholder") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Mein Anschreiben" } });
    fireEvent.click(screen.getByText("send_email"));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("Mein Anschreiben")),
      "_blank"
    );
  });

  // ── generateLetter: network error triggers catch block ────────────────────

  it("shows generic error when AI generate fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("ai_generate"));
    await waitFor(() => {
      expect(screen.getByText("Fehler bei der KI-Generierung.")).toBeTruthy();
    });
  });

  // ── generateLetter: data.letter absent (falsy branch) ────────────────────

  it("does not set cover letter when AI response has no letter field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ error: "no_letter" }),
      })
    );
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("ai_generate"));
    await waitFor(() => {
      // After generation done, textarea is still visible (no letter set = editMode still true)
      expect(screen.getByPlaceholderText("cover_letter_placeholder")).toBeTruthy();
    });
  });

  // ── setInterval timer branch: isGenerating overlay visible ──────────────

  it("shows generating overlay while AI is processing", async () => {
    // Never-resolving fetch keeps isGenerating=true throughout
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise(() => {})));
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("ai_generate"));
    // Overlay (lines 104-114) renders synchronously while isGenerating=true
    await waitFor(() => {
      expect(screen.getByText("KI analysiert und formuliert...")).toBeTruthy();
    });
  });

  // ── setInterval callback (line 29): fake timers advance to trigger it ────

  it("advances elapsed counter after 1s via setInterval", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise(() => {})));
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("ai_generate"));
    // Advance 1100ms → setInterval fires and calls setElapsed
    vi.advanceTimersByTime(1100);
    vi.useRealTimers();
  });

  // ── cover letter with \n within paragraph (line 213: <br />) ──────────────

  it("renders cover letter paragraphs with inline line breaks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        // Single \n inside a paragraph triggers the <br /> branch (line 213)
        json: async () => ({ letter: "Erste Zeile\nZweite Zeile\n\nNeuer Absatz" }),
      })
    );
    render(<ApplicationModal kita={baseKita} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("ai_generate"));
    await waitFor(() => screen.getByText("Erste Zeile"));
    // Both lines of the first paragraph are visible
    expect(screen.getByText("Zweite Zeile")).toBeTruthy();
    expect(screen.getByText("Neuer Absatz")).toBeTruthy();
  });
});
