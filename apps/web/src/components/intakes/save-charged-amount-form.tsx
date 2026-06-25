"use client";

import { useActionState } from "react";
import {
  saveChargedAmountAction,
  type SaveChargedAmountActionState,
} from "@/app/actions/intakes";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: SaveChargedAmountActionState = {};

export function SaveChargedAmountForm({
  intakeId,
  returnTo,
  initialValue = "",
  compact = false,
}: {
  intakeId: string;
  returnTo: string;
  initialValue?: string | number;
  compact?: boolean;
}) {
  const [state, formAction] = useActionState(saveChargedAmountAction, initialState);
  const normalizedInitialValue = initialValue === undefined || initialValue === null ? "" : String(initialValue);
  const hasRecordedAmount = normalizedInitialValue.trim().length > 0;

  return (
    <form action={formAction} className={compact ? "flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center" : "space-y-4"}>
      <input type="hidden" name="intakeId" value={intakeId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className={compact ? "flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center" : "space-y-3"}>
        <label
          htmlFor={`chargedAmount-${intakeId}`}
          className={compact ? "text-xs font-medium text-muted lg:sr-only" : "text-sm font-medium text-foreground"}
        >
          Сума за плащане
        </label>
        <input
          id={`chargedAmount-${intakeId}`}
          name="chargedAmount"
          inputMode="decimal"
          defaultValue={normalizedInitialValue}
          placeholder="Например 120"
          className={
            compact
              ? `min-h-9 w-full min-w-0 rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-surface-strong xl:w-32 ${
                  hasRecordedAmount
                    ? "border-[#b7cce8] bg-[#eef5ff] font-medium text-[#26456e]"
                    : "border-border bg-white text-foreground"
                }`
              : `min-h-11 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-surface-strong ${
                  hasRecordedAmount
                    ? "border-[#b7cce8] bg-[#eef5ff] font-medium text-[#26456e]"
                    : "border-border bg-white text-foreground"
                }`
          }
        />
        <SubmitButton
          label={hasRecordedAmount ? "Обнови сумата" : "Запази сумата"}
          pendingLabel="Запазване..."
          variant={compact ? "secondary" : "primary"}
          size={compact ? "compact" : "default"}
        />
      </div>

      {state.message ? (
        <p
          className={
            compact
              ? "rounded-xl border border-[#ead7c2] bg-[#fff6ed] px-3 py-2 text-xs text-[#7a4e21] xl:max-w-52"
              : "rounded-2xl border border-[#ead7c2] bg-[#fff6ed] px-3 py-2 text-sm text-[#7a4e21]"
          }
        >
          {state.message}
        </p>
      ) : state.ok ? (
        <p
          className={
            compact
              ? "rounded-xl border border-[#c7e0d2] bg-[#eef7f1] px-3 py-2 text-xs text-[#2f6b4f] xl:max-w-52"
              : "rounded-2xl border border-[#c7e0d2] bg-[#eef7f1] px-3 py-2 text-sm text-[#2f6b4f]"
          }
        >
          Запазено.
        </p>
      ) : null}
    </form>
  );
}
