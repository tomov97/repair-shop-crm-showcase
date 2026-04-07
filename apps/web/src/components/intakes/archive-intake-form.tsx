"use client";

import { useActionState } from "react";
import type { FormEvent } from "react";
import {
  archiveIntakeAction,
  type ArchiveIntakeActionState,
} from "@/app/actions/intakes";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: ArchiveIntakeActionState = {};

export function ArchiveIntakeForm({
  intakeId,
  returnTo,
  compact = false,
  iconOnly = false,
}: {
  intakeId: string;
  returnTo: string;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const [state, formAction] = useActionState(archiveIntakeAction, initialState);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const shouldArchive = window.confirm("Сигурни ли сте, че искате да архивирате това приемане?");
    if (!shouldArchive) {
      event.preventDefault();
    }
  };

  if (iconOnly) {
    return (
      <form action={formAction} onSubmit={handleSubmit}>
        <input type="hidden" name="intakeId" value={intakeId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          title="Архивирай"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0392b]/12 text-[#c0392b] transition hover:bg-[#c0392b]/20 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
        </button>
      </form>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className={compact ? "flex flex-col gap-2 xl:flex-row xl:items-center" : "space-y-4"}
    >
      <input type="hidden" name="intakeId" value={intakeId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      {state.message ? (
        <p
          className={
            compact
              ? "rounded-xl border border-[#ead7c2] bg-[#fff6ed] px-3 py-2 text-xs text-[#7a4e21] xl:max-w-48"
              : "rounded-2xl border border-[#ead7c2] bg-[#fff6ed] px-3 py-2 text-sm text-[#7a4e21]"
          }
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        label="Архивирай"
        pendingLabel="Архивиране..."
        variant="danger"
        size={compact ? "compact" : "default"}
      />
    </form>
  );
}
