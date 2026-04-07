"use client";

import { useState, useRef, useEffect } from "react";
import { useActionState } from "react";
import {
  saveCoffeeCountAction,
  type SaveCoffeeCountActionState,
} from "@/app/actions/intakes";

const initialState: SaveCoffeeCountActionState = {};

const POPOUT_HEIGHT = 140;

export function CoffeeCountPopout({
  intakeId,
  returnTo,
  initialValue = null,
}: {
  intakeId: string;
  returnTo: string;
  initialValue?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(true);
  const [state, formAction] = useActionState(saveCoffeeCountAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasCount = initialValue !== null && initialValue !== undefined;

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

  const popoutPositionClass = openAbove ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center gap-1 rounded-full border border-[#c1d4cf] bg-[#e0ebe8] px-3 py-1.5 text-sm font-semibold text-[#3d5f58] transition hover:bg-[#d0e3e0] active:scale-95"
        title="Въведи брой кафета"
      >
        {hasCount ? (
          <>
            {initialValue}
            <span className="text-xs text-[#3d5f58]/60">☕</span>
          </>
        ) : (
          <span className="text-sm font-medium text-[#3d5f58]/60">+ кафета</span>
        )}
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-30 w-48 rounded-2xl border border-border bg-white p-3 shadow-[0_8px_32px_rgba(20,30,28,0.18)] ${popoutPositionClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-xs font-medium text-muted">Брой кафета</p>
          <form
            action={formAction}
            onSubmit={() => setOpen(false)}
            className="flex flex-col gap-2"
          >
            <input type="hidden" name="intakeId" value={intakeId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input
              ref={inputRef}
              name="coffeeCount"
              inputMode="numeric"
              defaultValue={hasCount ? String(initialValue) : ""}
              placeholder="Напр. 5000"
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
