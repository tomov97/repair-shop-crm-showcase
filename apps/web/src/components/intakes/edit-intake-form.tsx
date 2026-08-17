"use client";

import { useActionState } from "react";
import { updateIntakeAction, type UpdateIntakeActionState } from "@/app/actions/intakes";
import { SubmitButton } from "@/components/forms/submit-button";
import { PHONE_COUNTRY_CODES, splitStructuredPhone } from "@/lib/phone";

const initialState: UpdateIntakeActionState = {};

export function EditIntakeForm({
  intakeId,
  intakeType = "service",
  returnTo,
  fullName,
  customerPhone,
  brand,
  model,
  issueDescription,
}: {
  intakeId: string;
  intakeType?: string;
  returnTo: string;
  fullName: string;
  customerPhone: string;
  brand: string;
  model: string;
  issueDescription: string | null;
}) {
  const [state, formAction] = useActionState(updateIntakeAction, initialState);
  const phoneParts = splitStructuredPhone(customerPhone);
  const isSale = intakeType === "sale";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="intakeId" value={intakeId} />
      <input type="hidden" name="intakeType" value={intakeType} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor={`fullName-${intakeId}`} className="text-sm font-medium text-foreground">
            Customer name
          </label>
          <input
            id={`fullName-${intakeId}`}
            name="fullName"
            defaultValue={fullName}
            className="min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor={`phoneNumber-${intakeId}`} className="text-sm font-medium text-foreground">
            Phone
          </label>
          <div className="grid grid-cols-[116px_minmax(0,1fr)] gap-2">
            <select
              id={`countryCode-${intakeId}`}
              name="countryCode"
              defaultValue={phoneParts.countryCode}
              className="min-h-11 rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
            >
              {PHONE_COUNTRY_CODES.map((countryCode) => (
                <option key={countryCode} value={countryCode}>
                  {countryCode}
                </option>
              ))}
            </select>
            <input
              id={`phoneNumber-${intakeId}`}
              name="phoneNumber"
              defaultValue={phoneParts.phoneNumber}
              className="min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor={`brand-${intakeId}`} className="text-sm font-medium text-foreground">
            Brand
          </label>
          <input
            id={`brand-${intakeId}`}
            name="brand"
            defaultValue={brand}
            className="min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={`model-${intakeId}`} className="text-sm font-medium text-foreground">
            Model
          </label>
          <input
            id={`model-${intakeId}`}
            name="model"
            defaultValue={model}
            className="min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor={`issueDescription-${intakeId}`} className="text-sm font-medium text-foreground">
            {isSale ? (
              <>Note <span className="text-muted font-normal">(optional)</span></>
            ) : (
              "Problem description"
            )}
          </label>
          <textarea
            id={`issueDescription-${intakeId}`}
            name="issueDescription"
            rows={3}
            defaultValue={issueDescription ?? ""}
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
          />
        </div>
      </div>

      {state.message ? (
        <p className="rounded-2xl border border-[#ead7c2] bg-[#fff6ed] px-3 py-2 text-sm text-[#7a4e21]">
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Save changes" pendingLabel="Saving..." />
    </form>
  );
}
