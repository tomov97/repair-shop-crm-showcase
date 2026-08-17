"use client";

import { useState, useRef, useEffect, useOptimistic } from "react";
import { createPortal } from "react-dom";
import { saveChargedAmountAction } from "@/app/actions/intakes";

const POPOUT_HEIGHT = 140; // approximate popout height in px
const POPOUT_WIDTH = 192; // w-48 = 12rem = 192px

export function PricePopout({
  intakeId,
  initialValue = "",
}: {
  intakeId: string;
  initialValue?: string | number;
}) {
  const [open, setOpen] = useState(false);
  const [popoutStyle, setPopoutStyle] = useState<React.CSSProperties>({});
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoutRef = useRef<HTMLDivElement>(null);
  const normalizedValue = initialValue === undefined || initialValue === null ? "" : String(initialValue);
  // Optimistically reflect the just-saved value until the server revalidation arrives.
  const [optimisticValue, setOptimisticValue] = useOptimistic(normalizedValue);
  const hasAmount = optimisticValue.trim().length > 0;

  async function handleSubmit(formData: FormData) {
    const newValue = String(formData.get("chargedAmount") ?? "").trim();
    setErrorMessage(undefined);
    setOptimisticValue(newValue);
    setOpen(false);
    const result = await saveChargedAmountAction({}, formData);
    if (result.message) {
      setErrorMessage(result.message);
      setOpen(true);
    }
  }

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const openAbove = rect.top > POPOUT_HEIGHT + 16;
      setPopoutStyle({
        position: "fixed",
        right: window.innerWidth - rect.right,
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 8 }
          : { top: rect.bottom + 8 }),
        width: POPOUT_WIDTH,
        zIndex: 9999,
      });
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoutRef.current && !popoutRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleScroll() {
      setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [open]);

  const popout = open ? (
    <div
      ref={popoutRef}
      style={popoutStyle}
      className="rounded-2xl border border-border bg-white p-3 shadow-[0_8px_32px_rgba(20,30,28,0.18)]"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="mb-2 text-xs font-medium text-muted">Amount (€)</p>
      <form action={handleSubmit} className="flex flex-col gap-2">
        <input type="hidden" name="intakeId" value={intakeId} />
        <input
          ref={inputRef}
          name="chargedAmount"
          inputMode="decimal"
          defaultValue={normalizedValue}
          placeholder="e.g. 120"
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
  ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center gap-1 rounded-full border border-[#e0d1a7] bg-[#fbf3de] px-3 py-1.5 text-sm font-semibold text-[#7b6530] transition hover:bg-[#f5e9c8] active:scale-95"
        title="Enter price"
      >
        {hasAmount ? (
          <>
            {optimisticValue}
            <span className="text-xs text-[#7b6530]/60">€</span>
          </>
        ) : (
          <span className="text-sm font-medium text-[#7b6530]/60">+ price</span>
        )}
      </button>

      {typeof document !== "undefined" ? createPortal(popout, document.body) : null}
    </div>
  );
}
