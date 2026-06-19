"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/types";

interface SearchBarProps {
  onSelect: (result: SearchResult) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as SearchResult[];
        setResults(Array.isArray(data) ? data : []);
        setActiveIndex(0);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function commit(result: SearchResult) {
    setQuery(result.symbol);
    setOpen(false);
    onSelect(result);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      commit(results[activeIndex]);
    }
    if (event.key === "Escape") setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
      <input
        value={query}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          if (value.trim().length < 2) {
            setResults([]);
            setOpen(false);
          }
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search any stock, ETF, mutual fund..."
        className="h-12 w-full rounded-md border border-border bg-panel px-11 pr-24 text-sm outline-none transition placeholder:text-muted focus:border-blue"
        aria-label="Search instruments"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded border border-border bg-surface px-2 py-1 text-xs text-muted">
        {loading ? "Searching" : "Global"}
      </span>

      {open ? (
        <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-md border border-border bg-surface shadow-[0_22px_60px_-32px_rgba(22,30,45,0.75)]">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">No instruments found.</p>
          ) : (
            results.map((result, index) => (
              <button
                type="button"
                key={`${result.symbol}-${index}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(result)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                  index === activeIndex ? "bg-blue/12" : "hover:bg-panel"
                }`}
              >
                <span className="min-w-0">
                  <span className="font-mono font-semibold">{result.symbol}</span>
                  <span className="ml-2 text-muted">{result.name}</span>
                </span>
                <span className="shrink-0 rounded border border-border px-2 py-0.5 text-xs text-muted">
                  {result.exchange || result.type}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
