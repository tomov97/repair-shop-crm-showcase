"use client";

import { useState, useRef, useEffect } from "react";
import { useActionState } from "react";
import {
  saveChargedAmountAction,
  type SaveChargedAmountActionState,
} from "@/app/actions/intakes";

const initialState: SaveChargedAmountActionState = {};

const POPOUT_HEIGHT = 140; // approximate popout height in px

export function PricePopout({
  intakeId,
  returnTo,
  initialValue = "",
}: {
  intakeId: string;
  returnTo: string;
  initialValue?: string | number;
}) {
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(true);
  const [state, formAction] = useActionState(saveChargedAmountAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const normalizedValue = initialValue === undefined || initialValue === null ? "" : String(initialValue);
  const hasAmount = normalizedValue.trim().length > 0;

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
    if (state.message) {
      setOpen(false);
    }
  }, [state.message]);

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

  const popoutPositionClass = openAbove
    ? "bottom-full mb-2"
    : "top-full mt-2";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center gap-1 rounded-full border border-[#e0d1a7] bg-[#fbf3de] px-3 py-1.5 text-sm font-semibold text-[#7b6530] transition hover:bg-[#f5e9c8] active:scale-95"
        title="Въведи цена"
      >
        {hasAmount ? (
          <>
            {normalizedValue}
            <span className="text-xs text-[#7b6530]/60">€</span>
          </>
        ) : (
          <span className="text-sm font-medium text-[#7b6530]/60">+ цена</span>
        )}
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-30 w-48 rounded-2xl border border-border bg-white p-3 shadow-[0_8px_32px_rgba(20,30,28,0.18)] ${popoutPositionClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-xs font-medium text-muted">Сума (€)</p>
          <form
            action={formAction}
            onSubmit={() => setOpen(false)}
            className="flex flex-col gap-2"
          >
            <input type="hidden" name="intakeId" value={intakeId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input
              ref={inputRef}
              name="chargedAmount"
              inputMode="decimal"
              defaultValue={normalizedValue}
              placeholder="Напр. 120"
              className="min-h-9 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none transition focus:border-surface-strong"
            />
            <button
              type="submit"
              className="inline-flex min-h-8 w-full items-center justify-center rounded-xl bg-surface-strong px-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Запази
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
