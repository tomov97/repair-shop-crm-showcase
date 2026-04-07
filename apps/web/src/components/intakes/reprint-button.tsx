"use client";

import { useActionState } from "react";
import { reprintIntakeAction, type ReprintIntakeActionState } from "@/app/actions/intakes";

const initialState: ReprintIntakeActionState = {};

export function ReprintButton({
  intakeId,
  returnTo,
}: {
  intakeId: string;
  returnTo: string;
}) {
  const [state, formAction] = useActionState(reprintIntakeAction, initialState);

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="intakeId" value={intakeId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        title={state.message ?? "Печат"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#23443f]/12 text-[#23443f] transition hover:bg-[#23443f]/20 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      </button>
    </form>
  );
}
