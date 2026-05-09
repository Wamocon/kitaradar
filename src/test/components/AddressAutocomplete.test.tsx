import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddressAutocomplete } from "@/components/search/AddressAutocomplete";
import type { AutocompleteResult } from "@/app/api/geocode/autocomplete/route";

const mockResults: AutocompleteResult[] = [
  {
    displayName: "Frankfurt am Main, Hessen, Deutschland",
    shortName: "Frankfurt am Main, Hessen",
    lat: 50.11,
    lng: 8.68,
    type: "city",
  },
  {
    displayName: "60488 Dornbusch, Frankfurt am Main",
    shortName: "60488 Frankfurt am Main, Hessen",
    lat: 50.14,
    lng: 8.66,
    type: "postcode",
  },
];

describe("AddressAutocomplete", () => {
  const onChange = vi.fn();
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ results: mockResults }),
      })
    );
  });

  it("renders input with default placeholder", () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    expect(screen.getByPlaceholderText(/Stadt|PLZ/)).toBeTruthy();
  });

  it("renders input with custom placeholder", () => {
    render(
      <AddressAutocomplete
        value=""
        onChange={onChange}
        onSelect={onSelect}
        placeholder="Mein Platzhalter"
      />
    );
    expect(screen.getByPlaceholderText("Mein Platzhalter")).toBeTruthy();
  });

  it("calls onChange when user types", () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Fra" } });
    expect(onChange).toHaveBeenCalledWith("Fra");
  });

  it("does not fetch when input is less than 2 characters", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "F" } });
    // Wait longer than debounce to confirm no fetch
    await new Promise((r) => setTimeout(r, 400));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches suggestions after debounce when input >= 2 chars", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Fra" } });
    await waitFor(
      () => expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/geocode/autocomplete?q=Fra")
      ),
      { timeout: 1000 }
    );
  });

  it("shows suggestions dropdown after successful fetch", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 1000 });
    expect(screen.getByText("Frankfurt am Main, Hessen")).toBeTruthy();
  });

  it("calls onSelect and onChange when suggestion is clicked", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 1000 });
    fireEvent.mouseDown(screen.getByText("Frankfurt am Main, Hessen").closest("li")!);
    expect(onChange).toHaveBeenCalledWith("Frankfurt am Main, Hessen");
    expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it("closes dropdown after selecting a suggestion", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 1000 });
    fireEvent.mouseDown(screen.getByText("Frankfurt am Main, Hessen").closest("li")!);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes dropdown on Escape key", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 1000 });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("navigates suggestions with ArrowDown", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 1000 });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
    const options = screen.getAllByRole("option");
    expect(options[0].getAttribute("aria-selected")).toBe("true");
  });

  it("navigates up with ArrowUp", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 1000 });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowUp" });
    const options = screen.getAllByRole("option");
    expect(options[0].getAttribute("aria-selected")).toBe("true");
  });

  it("selects active suggestion with Enter key", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 1000 });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it("does not select on Enter when no item is active", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 1000 });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("handles fetch error gracefully - no dropdown shown", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => expect(fetch).toHaveBeenCalled(), { timeout: 1000 });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("re-opens dropdown on focus when suggestions exist", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 1000 });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.focus(screen.getByRole("textbox"));
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("highlights suggestion on mouseEnter", async () => {
    render(<AddressAutocomplete value="" onChange={onChange} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Frank" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 1000 });
    const options = screen.getAllByRole("option");
    fireEvent.mouseEnter(options[1]);
    expect(options[1].getAttribute("aria-selected")).toBe("true");
  });
});