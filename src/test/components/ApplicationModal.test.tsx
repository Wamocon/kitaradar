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
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText("cover_letter_placeholder") as HTMLTextAreaElement;
      expect(textarea.value).toBe("KI-generiertes Anschreiben");
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
});
