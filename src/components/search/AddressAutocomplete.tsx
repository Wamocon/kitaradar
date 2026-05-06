"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import type { AutocompleteResult } from "@/app/api/geocode/autocomplete/route";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AutocompleteResult) => void;
  placeholder?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Stadt, Stadtteil oder PLZ eingeben...",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/geocode/autocomplete?q=${encodeURIComponent(q)}`);
      const data: { results: AutocompleteResult[] } = await res.json();
      setSuggestions(data.results);
      setIsOpen(data.results.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 300);
  }

  function handleSelect(result: AutocompleteResult) {
    onChange(result.shortName);
    onSelect(result);
    setIsOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const TYPE_ICON: Record<string, string> = {
    city: "🏙️",
    town: "🏘️",
    village: "🌳",
    suburb: "🏠",
    postcode: "📮",
    municipality: "🏛️",
    administrative: "🗺️",
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-48">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      {isLoading && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted" />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-md border border-border bg-card pl-9 pr-8 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lng}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex cursor-pointer items-start gap-2 px-3 py-2 text-sm transition-colors ${
                i === activeIndex
                  ? "bg-primary/10 text-foreground"
                  : "text-foreground hover:bg-border/50"
              }`}
            >
              <span className="mt-0.5 shrink-0 text-base">
                {TYPE_ICON[s.type] ?? <MapPin className="h-4 w-4 text-muted" />}
              </span>
              <span className="flex flex-col min-w-0">
                <span className="font-medium truncate">{s.shortName}</span>
                <span className="text-xs text-muted truncate">{s.displayName}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
