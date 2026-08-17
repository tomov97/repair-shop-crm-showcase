"use client";

import { useState, useRef, useEffect, useOptimistic } from "react";
import { saveCoffeeCountAction } from "@/app/actions/intakes";

const POPOUT_HEIGHT = 140;

export function CoffeeCountPopout({
  intakeId,
  initialValue = null,
}: {
  intakeId: string;
  initialValue?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const normalizedValue = initialValue === null || initialValue === undefined ? "" : String(initialValue);
  // Optimistically reflect the just-saved value until the server revalidation arrives.
  const [optimisticValue, setOptimisticValue] = useOptimistic(normalizedValue);
  const hasCount = optimisticValue.trim().length > 0;

  async function handleSubmit(formData: FormData) {
    const newValue = String(formData.get("coffeeCount") ?? "").trim();
    setErrorMessage(undefined);
    setOptimisticValue(newValue);
    setOpen(false);
    const result = await saveCoffeeCountAction({}, formData);
    if (result.message) {
      setErrorMessage(result.message);
      setOpen(true);
    }
  }

  useEffect(() => {
    if (open) {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setOpenAbove(rect.top > POPOUT_HEIGHT + 16);
      }
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const popoutPositionClass = openAbove ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center gap-1 rounded-full border border-[#c1d4cf] bg-[#e0ebe8] px-3 py-1.5 text-sm font-semibold text-[#3d5f58] transition hover:bg-[#d0e3e0] active:scale-95"
        title="Enter coffee count"
      >
        {hasCount ? (
          <>
            {optimisticValue}
            <span className="text-xs text-[#3d5f58]/60">☕</span>
          </>
        ) : (
          <span className="text-sm font-medium text-[#3d5f58]/60">+ coffees</span>
        )}
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-30 w-48 rounded-2xl border border-border bg-white p-3 shadow-[0_8px_32px_rgba(20,30,28,0.18)] ${popoutPositionClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-xs font-medium text-muted">Coffee count</p>
          <form action={handleSubmit} className="flex flex-col gap-2">
            <input type="hidden" name="intakeId" value={intakeId} />
            <input
              ref={inputRef}
              name="coffeeCount"
              inputMode="numeric"
              defaultValue={normalizedValue}
              placeholder="e.g. 5000"
              className="min-h-9 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none transition focus:border-surface-strong"
            />
            <button
              type="submit"
              className="inline-flex min-h-8 w-full items-center justify-center rounded-xl bg-surface-strong px-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Save
            </button>
            {errorMessage ? (
              <p className="rounded-lg bg-[#fff6ed] px-2 py-1 text-xs text-[#7a4e21]">{errorMessage}</p>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}
