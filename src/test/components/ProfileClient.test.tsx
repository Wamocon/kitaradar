import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { ProfileClient } from "@/components/profile/ProfileClient";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

const defaultProps = {
  initialName: "Anna Muster",
  initialChildren: [
    { id: "c1", name: "Lena", birth_month: 3, birth_year: 2022, special_needs: null },
  ],
  tier: "free",
  searchCount: 4,
};

/** Navigate to a tab by its display label */
function goToTab(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

describe("ProfileClient", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    );
  });

  it("renders the name input with initial value", () => {
    render(<ProfileClient {...defaultProps} />);
    // Default tab is "Persönliche Daten"
    const input = screen.getByDisplayValue("Anna Muster") as HTMLInputElement;
    expect(input).toBeTruthy();
  });

  it("shows remaining searches for free tier", () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.plan");
    expect(screen.getByText("plan.searches_remaining")).toBeTruthy();
  });

  it("shows upgrade link for free users", () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.plan");
    expect(screen.getByText("plan.upgrade_link")).toBeTruthy();
  });

  it("shows Pro badge for Pro users", () => {
    render(<ProfileClient {...defaultProps} tier="pro" />);
    goToTab("tabs.plan");
    expect(screen.getByText("Pro")).toBeTruthy();
    expect(screen.queryByText("plan.upgrade_link")).toBeNull();
  });

  it("renders existing children", () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.children");
    expect(screen.getByText("Lena")).toBeTruthy();
  });

  it("saves profile on button click and shows success message", async () => {
    render(<ProfileClient {...defaultProps} />);
    // Default tab is "personal" — save button is visible
    const saveButtons = screen.getAllByRole("button", { name: "personal.save" });
    fireEvent.click(saveButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("save_success")).toBeTruthy();
    });
  });

  it("shows error message when profile save fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "fail" }) })
    );
    render(<ProfileClient {...defaultProps} />);
    const saveButtons = screen.getAllByRole("button", { name: "personal.save" });
    fireEvent.click(saveButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("save_error")).toBeTruthy();
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
    goToTab("tabs.children");
    fireEvent.change(screen.getByPlaceholderText("children.child_name_placeholder"), { target: { value: "Tim" } });
    fireEvent.click(screen.getByText("children.add_btn"));
    await waitFor(() => {
      expect(screen.getByText("Tim")).toBeTruthy();
    });
  });

  it("does not add a child when the name field is empty", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.children");
    fireEvent.click(screen.getByText("children.add_btn"));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("removes a child when the delete button is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    );
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.children");
    expect(screen.getByText("Lena")).toBeTruthy();
    const childItem = screen.getByText("Lena").closest("div")!.parentElement as HTMLElement;
    const trashBtn = within(childItem).getByRole("button");
    fireEvent.click(trashBtn);
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
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.privacy");
    fireEvent.click(screen.getByText("privacy_tab.export"));
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it("shows delete confirmation when 'Konto löschen' is first clicked", () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.privacy");
    fireEvent.click(screen.getByText("privacy_tab.delete"));
    expect(screen.getByText("privacy_tab.delete_confirm_text")).toBeTruthy();
    expect(screen.getByText("privacy_tab.cancel")).toBeTruthy();
  });

  it("cancels account deletion when 'Abbrechen' is clicked", () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.privacy");
    fireEvent.click(screen.getByText("privacy_tab.delete"));
    fireEvent.click(screen.getByText("privacy_tab.cancel"));
    expect(screen.queryByText("privacy_tab.delete_confirm_text")).toBeNull();
  });

  // ──────────── Additional tab coverage ────────────

  it("renders family tab section header when navigated to", () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.family");
    expect(screen.getByText("family.title")).toBeTruthy();
  });

  it("saves family data on button click", async () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.family");
    fireEvent.click(screen.getByRole("button", { name: "family.save" }));
    await waitFor(() => {
      expect(screen.getByText("save_success")).toBeTruthy();
    });
  });

  it("renders work tab section header when navigated to", () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.work");
    expect(screen.getByText("work.title")).toBeTruthy();
  });

  it("saves work data on button click", async () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.work");
    fireEvent.click(screen.getByRole("button", { name: "work.save" }));
    await waitFor(() => {
      expect(screen.getByText("save_success")).toBeTruthy();
    });
  });

  it("renders childcare tab section when navigated to", () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.childcare");
    expect(screen.getByText("childcare.title")).toBeTruthy();
  });

  it("saves childcare data on button click", async () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.childcare");
    fireEvent.click(screen.getByRole("button", { name: "childcare.save" }));
    await waitFor(() => {
      expect(screen.getByText("save_success")).toBeTruthy();
    });
  });

  it("renders KI tab section when navigated to", () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.ki");
    expect(screen.getByText("ki.title")).toBeTruthy();
  });

  it("saves KI preferences on button click", async () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.ki");
    fireEvent.click(screen.getByRole("button", { name: "ki.save" }));
    await waitFor(() => {
      expect(screen.getByText("save_success")).toBeTruthy();
    });
  });

  it("renders notifications tab section when navigated to", () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.notifications");
    expect(screen.getByText("notifications_tab.title")).toBeTruthy();
  });

  it("saves notification settings on button click", async () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.notifications");
    fireEvent.click(screen.getByRole("button", { name: "notifications_tab.save" }));
    await waitFor(() => {
      expect(screen.getByText("save_success")).toBeTruthy();
    });
  });

  it("toggles email notification switch", () => {
    render(<ProfileClient {...defaultProps} notificationEmail={true} />);
    goToTab("tabs.notifications");
    const toggle = screen.getByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("saves search settings on button click", async () => {
    render(<ProfileClient {...defaultProps} />);
    goToTab("tabs.notifications");
    const saveButtons = screen.getAllByRole("button", { name: "search_settings.save" });
    fireEvent.click(saveButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("save_success")).toBeTruthy();
    });
  });
});
