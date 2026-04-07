"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/dashboard/cards";
import type { SearchResult } from "@/app/api/search/route";

type SidebarProps = { variant: "sidebar" };
type OverlayProps = { variant: "overlay"; isOpen: boolean; onClose: () => void };
type SearchBarProps = SidebarProps | OverlayProps;

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({
  result,
  focused,
  onSelect,
}: {
  result: SearchResult;
  focused: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(result.id)}
      className={`w-full px-4 py-3 text-left transition border-b border-[#e8e4d4] last:border-0 focus-visible:outline-none ${
        focused ? "bg-[#f4f1e5]" : "hover:bg-[#f4f1e5]"
      }`}
    >
      <p className="text-sm font-semibold text-[#101614] truncate">{result.customerName}</p>
      <p className="text-xs text-[#60726d]">{result.customerPhone}</p>
      <p className="mt-0.5 text-xs text-[#7b6530] font-medium">{result.brand} {result.model}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-[#23443f]">{result.intakeNumber}</p>
      <div className="mt-0.5 flex items-center gap-2">
        <p className="text-[11px] text-[#60726d]">{result.createdAtLabel}</p>
        <StatusPill
          label={result.isArchived ? "Архивиран" : "Активен"}
          archived={result.isArchived}
        />
      </div>
    </button>
  );
}

// ── Dropdown portal (escapes sidebar clipping) ────────────────────────────────

function DropdownPortal({
  anchorRef,
  children,
  onClickOutside,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  onClickOutside: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Update position on mount and on scroll/resize
  useEffect(() => {
    function updateRect() {
      if (anchorRef.current) {
        setRect(anchorRef.current.getBoundingClientRect());
      }
    }
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [anchorRef]);

  // Click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClickOutside();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [anchorRef, onClickOutside]);

  if (!rect) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      }}
      className="rounded-2xl bg-white shadow-[0_8px_32px_rgba(35,68,63,0.25)] overflow-hidden max-h-[60vh] overflow-y-auto"
    >
      {children}
    </div>,
    document.body
  );
}

// ── Shared search input ───────────────────────────────────────────────────────

function SearchInput({
  value,
  onChange,
  onKeyDown,
  inputRef,
  isLoading,
  className,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? "Търсене…"}
        autoFocus={autoFocus}
        autoComplete="off"
        className={className}
      />
      {isLoading ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </span>
      ) : null}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SearchBar(props: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestQueryRef = useRef("");

  // Debounced fetch
  useEffect(() => {
    const trimmed = query.trim();
    latestQueryRef.current = trimmed;

    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setFocusedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok && latestQueryRef.current === trimmed) {
          const data: SearchResult[] = await res.json();
          setResults(data);
          setIsOpen(data.length > 0);
          setFocusedIndex(-1);
        }
      } catch {
        // Network error — silently ignore
      } finally {
        if (latestQueryRef.current === trimmed) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
  }, []);

  function navigateToSearchPage() {
    const q = query.trim();
    if (q.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setQuery("");
      setIsOpen(false);
      if (props.variant === "overlay") props.onClose();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setQuery("");
      setIsOpen(false);
      if (props.variant === "overlay") props.onClose();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && results[focusedIndex]) {
        handleSelect(results[focusedIndex]!.id);
      } else {
        navigateToSearchPage();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, -1));
    }
  }

  function handleSelect(id: string) {
    router.push(`/intakes/${id}`);
    setQuery("");
    setIsOpen(false);
    if (props.variant === "overlay") props.onClose();
  }

  // Focus input when overlay opens
  useEffect(() => {
    if (props.variant === "overlay" && props.isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [props]);

  // ── Sidebar variant ────────────────────────────────────────────────────────
  if (props.variant === "sidebar") {
    return (
      <div ref={containerRef}>
        <SearchInput
          value={query}
          onChange={setQuery}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          isLoading={isLoading}
          placeholder="Търсене…"
          className="w-full rounded-xl bg-white/10 pl-8 pr-8 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:ring-1 focus:ring-white/30 [&::-webkit-search-cancel-button]:hidden"
        />

        {isOpen && results.length > 0 ? (
          <DropdownPortal anchorRef={containerRef} onClickOutside={closeDropdown}>
            {results.map((r, i) => (
              <ResultCard key={r.id} result={r} focused={i === focusedIndex} onSelect={handleSelect} />
            ))}
            {/* "See all" footer */}
            <button
              type="button"
              onClick={navigateToSearchPage}
              className="w-full px-4 py-2.5 text-center text-xs font-semibold text-[#23443f]/60 hover:bg-[#f4f1e5] transition border-t border-[#e8e4d4]"
            >
              Виж всички резултати →
            </button>
          </DropdownPortal>
        ) : null}
      </div>
    );
  }

  // ── Overlay variant (mobile) ───────────────────────────────────────────────
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#23443f] flex flex-col">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/15">
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setIsOpen(false);
            props.onClose();
          }}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 text-white"
          aria-label="Затвори"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            isLoading={isLoading}
            autoFocus
            placeholder="Търсене по клиент, машина, телефон…"
            className="w-full rounded-xl bg-white/10 pl-8 pr-8 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:ring-1 focus:ring-white/30 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div className="bg-white">
            {results.map((r, i) => (
              <ResultCard key={r.id} result={r} focused={i === focusedIndex} onSelect={handleSelect} />
            ))}
            <button
              type="button"
              onClick={navigateToSearchPage}
              className="w-full px-4 py-3 text-center text-sm font-semibold text-[#23443f]/70 hover:bg-[#f4f1e5] transition border-t border-[#e8e4d4]"
            >
              Виж всички резултати →
            </button>
          </div>
        ) : query.trim().length >= 2 && !isLoading ? (
          <p className="px-6 py-8 text-sm text-white/60 text-center">Няма намерени резултати</p>
        ) : null}
      </div>
    </div>
  );
}
