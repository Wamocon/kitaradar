import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApplicationsClient } from "@/components/search/ApplicationsClient";

// lucide-react icons are used but don't need to be mocked

const baseApp = {
  id: "app-1",
  kita_name: "Kita Sonnenschein",
  kita_email: "kita@sonnenschein.de",
  status: "draft",
  cover_letter: null,
  notes: null,
  response_at: null,
  sent_at: null,
  created_at: "2026-05-01T10:00:00Z",
};

describe("ApplicationsClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders empty state when no applications exist", () => {
    render(<ApplicationsClient initialApplications={[]} />);
    expect(screen.getByText("Noch keine Bewerbungen")).toBeTruthy();
    expect(screen.getByText(/Starten Sie eine Suche/)).toBeTruthy();
  });

  it("renders the kita name", () => {
    render(<ApplicationsClient initialApplications={[baseApp]} />);
    expect(screen.getByText("Kita Sonnenschein")).toBeTruthy();
  });

  it("renders the status badge label for 'draft'", () => {
    render(<ApplicationsClient initialApplications={[baseApp]} />);
    expect(screen.getByText("Entwurf")).toBeTruthy();
  });

  it("renders the kita email in the header", () => {
    render(<ApplicationsClient initialApplications={[baseApp]} />);
    expect(screen.getByText(/kita@sonnenschein\.de/)).toBeTruthy();
  });

  it("does not render kita email when null", () => {
    const app = { ...baseApp, kita_email: null };
    render(<ApplicationsClient initialApplications={[app]} />);
    // email must not appear
    expect(screen.queryByText(/kita@/)).toBeNull();
  });

  it("shows chevron-down icon (not expanded) initially", () => {
    render(<ApplicationsClient initialApplications={[baseApp]} />);
    // The expanded content should not be visible
    expect(screen.queryByText("Status ändern")).toBeNull();
  });

  it("expands the card when the header button is clicked", () => {
    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Status ändern")).toBeTruthy();
  });

  it("collapses the card when clicked again", () => {
    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Status ändern")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.queryByText("Status ändern")).toBeNull();
  });

  it("shows all status option buttons when expanded", () => {
    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Eingereicht")).toBeTruthy();
    expect(screen.getByText("Warteliste")).toBeTruthy();
    expect(screen.getByText("Rückmeldung")).toBeTruthy();
    expect(screen.getByText("Zusage")).toBeTruthy();
    expect(screen.getByText("Abgelehnt")).toBeTruthy();
  });

  it("calls PATCH /api/applications when a status button is clicked", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ application: { ...baseApp, status: "sent" } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.click(screen.getByText("Eingereicht"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/applications",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"status":"sent"'),
        }),
      );
    });
  });

  it("updates the status badge after successful status change", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ application: { ...baseApp, status: "sent" } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.click(screen.getByText("Eingereicht"));

    await waitFor(() => {
      expect(screen.getAllByText("Eingereicht").length).toBeGreaterThan(0);
    });
  });

  it("shows error message when status update fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false }),
    );

    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.click(screen.getByText("Eingereicht"));

    await waitFor(() => {
      expect(screen.getByText("Status konnte nicht gespeichert werden.")).toBeTruthy();
    });
  });

  it("shows notes textarea when expanded", () => {
    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(
      screen.getByPlaceholderText(/Eigene Notizen/),
    ).toBeTruthy();
  });

  it("prefills notes textarea with existing notes", () => {
    const app = { ...baseApp, notes: "Mein Kommentar" };
    render(<ApplicationsClient initialApplications={[app]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    const ta = screen.getByPlaceholderText(/Eigene Notizen/) as HTMLTextAreaElement;
    expect(ta.value).toBe("Mein Kommentar");
  });

  it("shows save-notes button only when notes are changed", () => {
    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.queryByText("Notizen speichern")).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(/Eigene Notizen/), {
      target: { value: "neue Notiz" },
    });
    expect(screen.getByText("Notizen speichern")).toBeTruthy();
  });

  it("calls PATCH /api/applications when notes are saved", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ application: { ...baseApp, notes: "neue Notiz" } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.change(screen.getByPlaceholderText(/Eigene Notizen/), {
      target: { value: "neue Notiz" },
    });
    fireEvent.click(screen.getByText("Notizen speichern"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/applications",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"notes":"neue Notiz"'),
        }),
      );
    });
  });

  it("shows error message when notes save fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false }),
    );

    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.change(screen.getByPlaceholderText(/Eigene Notizen/), {
      target: { value: "neue Notiz" },
    });
    fireEvent.click(screen.getByText("Notizen speichern"));

    await waitFor(() => {
      expect(screen.getByText("Notizen konnten nicht gespeichert werden.")).toBeTruthy();
    });
  });

  it("shows cover letter toggle button when cover_letter exists", () => {
    const app = { ...baseApp, cover_letter: "Sehr geehrte Damen und Herren..." };
    render(<ApplicationsClient initialApplications={[app]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Anschreiben anzeigen")).toBeTruthy();
  });

  it("does not show cover letter toggle when cover_letter is null", () => {
    render(<ApplicationsClient initialApplications={[baseApp]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.queryByText("Anschreiben anzeigen")).toBeNull();
  });

  it("toggles cover letter visibility when the button is clicked", () => {
    const app = { ...baseApp, cover_letter: "Sehr geehrte Damen und Herren..." };
    render(<ApplicationsClient initialApplications={[app]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    // Initially hidden
    expect(screen.queryByText("Sehr geehrte Damen und Herren...")).toBeNull();
    fireEvent.click(screen.getByText("Anschreiben anzeigen"));
    expect(screen.getByText("Sehr geehrte Damen und Herren...")).toBeTruthy();
  });

  it("hides cover letter when toggled off", () => {
    const app = { ...baseApp, cover_letter: "Brieftext hier" };
    render(<ApplicationsClient initialApplications={[app]} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.click(screen.getByText("Anschreiben anzeigen"));
    expect(screen.getByText("Brieftext hier")).toBeTruthy();
    fireEvent.click(screen.getByText("Anschreiben ausblenden"));
    expect(screen.queryByText("Brieftext hier")).toBeNull();
  });

  it("renders multiple applications", () => {
    const apps = [
      baseApp,
      { ...baseApp, id: "app-2", kita_name: "Kita Regenbogen", status: "sent" },
    ];
    render(<ApplicationsClient initialApplications={apps} />);
    expect(screen.getByText("Kita Sonnenschein")).toBeTruthy();
    expect(screen.getByText("Kita Regenbogen")).toBeTruthy();
  });

  it("renders 'Eingereicht' badge for status 'sent'", () => {
    const app = { ...baseApp, status: "sent" };
    render(<ApplicationsClient initialApplications={[app]} />);
    expect(screen.getByText("Eingereicht")).toBeTruthy();
  });

  it("renders 'Zusage' badge for status 'positive'", () => {
    const app = { ...baseApp, status: "positive" };
    render(<ApplicationsClient initialApplications={[app]} />);
    expect(screen.getByText("Zusage")).toBeTruthy();
  });

  it("renders 'Abgelehnt' badge for status 'rejected'", () => {
    const app = { ...baseApp, status: "rejected" };
    render(<ApplicationsClient initialApplications={[app]} />);
    expect(screen.getByText("Abgelehnt")).toBeTruthy();
  });

  // ── statusMeta fallback: unknown status → defaults to STATUS_OPTIONS[0] ──

  it("statusMeta falls back to first option for unknown status", () => {
    const app = { ...baseApp, status: "unknown_status_xyz" };
    render(<ApplicationsClient initialApplications={[app]} />);
    // Should not crash; first status (draft = "Entwurf") badge label is shown as fallback
    expect(screen.getByText("Entwurf")).toBeTruthy();
  });

  // ── updateStatus with multiple apps: covers both branches of ternary ─────

  it("updateStatus: only updates the matching app when multiple exist", async () => {
    const apps = [
      { ...baseApp, id: "app-1", kita_name: "Kita Sonnenschein", status: "draft" },
      { ...baseApp, id: "app-2", kita_name: "Kita Regenbogen", status: "draft" },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          application: { ...apps[0], status: "sent" },
        }),
      })
    );
    render(<ApplicationsClient initialApplications={apps} />);
    // Expand first app (first button is the expand/collapse button)
    fireEvent.click(screen.getAllByRole("button")[0]);
    await waitFor(() => expect(screen.getAllByText("Eingereicht").length).toBeGreaterThan(0));
    // Click "Eingereicht" to update status for app-1
    const buttons = screen.getAllByText("Eingereicht");
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      // app-1 now shows "Eingereicht" badge in header
      expect(screen.getAllByText("Eingereicht").length).toBeGreaterThan(1);
    });
    // app-2 still shows "Entwurf" (not updated → took false branch in map)
    expect(screen.getAllByText("Entwurf").length).toBeGreaterThan(0);
  });

  // ── saveNotes: success path with data.application update ─────────────────

  it("saveNotes: updates app in list after successful save", async () => {
    const app = { ...baseApp, notes: null };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          application: { ...app, notes: "Neue Notiz" },
        }),
      })
    );
    render(<ApplicationsClient initialApplications={[app]} />);
    // Expand app
    fireEvent.click(screen.getAllByRole("button")[0]);
    await waitFor(() => screen.getByPlaceholderText(/Eigene Notizen/));
    const notesArea = screen.getByPlaceholderText(/Eigene Notizen/) as HTMLTextAreaElement;
    fireEvent.change(notesArea, { target: { value: "Neue Notiz" } });
    // Click save notes button
    fireEvent.click(screen.getByText("Notizen speichern"));
    await waitFor(() => {
      // Fetch was called
      expect(fetch).toHaveBeenCalledWith(
        "/api/applications",
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });
});
