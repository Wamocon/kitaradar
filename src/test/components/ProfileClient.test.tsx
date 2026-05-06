import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileClient } from "@/components/profile/ProfileClient";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const defaultProps = {
  initialName: "Anna Muster",
  initialChildren: [
    { id: "c1", name: "Lena", birth_month: 3, birth_year: 2022, special_needs: null },
  ],
  tier: "free",
  searchCount: 4,
};

describe("ProfileClient", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    );
  });

  it("renders the name input with initial value", () => {
    render(<ProfileClient {...defaultProps} />);
    const input = screen.getByDisplayValue("Anna Muster") as HTMLInputElement;
    expect(input).toBeTruthy();
  });

  it("shows remaining searches for free tier", () => {
    render(<ProfileClient {...defaultProps} />);
    expect(screen.getByText(/6 von 10 Suchen übrig/)).toBeTruthy();
  });

  it("shows upgrade link for free users", () => {
    render(<ProfileClient {...defaultProps} />);
    expect(screen.getByText(/Auf Pro upgraden/)).toBeTruthy();
  });

  it("shows Pro badge for Pro users", () => {
    render(<ProfileClient {...defaultProps} tier="pro" />);
    expect(screen.getByText("Pro")).toBeTruthy();
    expect(screen.queryByText(/Auf Pro upgraden/)).toBeNull();
  });

  it("renders existing children", () => {
    render(<ProfileClient {...defaultProps} />);
    expect(screen.getByText("Lena")).toBeTruthy();
  });

  it("saves profile on button click and shows success message", async () => {
    render(<ProfileClient {...defaultProps} />);
    fireEvent.click(screen.getByText("Speichern"));
    await waitFor(() => {
      expect(screen.getByText(/Profil gespeichert/)).toBeTruthy();
    });
  });

  it("shows error message when profile save fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "fail" }) })
    );
    render(<ProfileClient {...defaultProps} />);
    fireEvent.click(screen.getByText("Speichern"));
    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Speichern/)).toBeTruthy();
    });
  });

  it("adds a child when the add button is clicked with a name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          child: { id: "c2", name: "Tim", birth_month: null, birth_year: 2023, special_needs: null },
        }),
      })
    );
    render(<ProfileClient {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText("Name des Kindes"), { target: { value: "Tim" } });
    fireEvent.click(screen.getByText("Kind hinzufügen"));
    await waitFor(() => {
      expect(screen.getByText("Tim")).toBeTruthy();
    });
  });

  it("does not add a child when the name field is empty", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<ProfileClient {...defaultProps} />);
    fireEvent.click(screen.getByText("Kind hinzufügen"));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("removes a child when the delete button is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    );
    render(<ProfileClient {...defaultProps} />);
    expect(screen.getByText("Lena")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "" })); // Trash icon button
    await waitFor(() => {
      expect(screen.queryByText("Lena")).toBeNull();
    });
  });

  it("triggers data export download", async () => {
    const blobMock = new Blob(['{"exported":true}'], { type: "application/json" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => blobMock })
    );
    const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation(vi.fn());
    render(<ProfileClient {...defaultProps} />);
    fireEvent.click(screen.getByText("Daten exportieren"));
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
    appendSpy.mockRestore();
  });

  it("shows delete confirmation when 'Konto löschen' is first clicked", () => {
    render(<ProfileClient {...defaultProps} />);
    fireEvent.click(screen.getByText("Konto löschen"));
    expect(screen.getByText(/Wirklich löschen/)).toBeTruthy();
    expect(screen.getByText("Abbrechen")).toBeTruthy();
  });

  it("cancels account deletion when 'Abbrechen' is clicked", () => {
    render(<ProfileClient {...defaultProps} />);
    fireEvent.click(screen.getByText("Konto löschen"));
    fireEvent.click(screen.getByText("Abbrechen"));
    expect(screen.queryByText(/Wirklich löschen/)).toBeNull();
  });
});
