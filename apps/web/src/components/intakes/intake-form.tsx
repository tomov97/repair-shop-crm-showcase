"use client";

import { useActionState, useState } from "react";
import { createIntakeAction, type IntakeActionState } from "@/app/actions/intakes";
import { SubmitButton } from "@/components/forms/submit-button";
import { PHONE_COUNTRY_CODES } from "@/lib/phone";

const initialState: IntakeActionState = {};

function buildSubmissionToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#8a4f22]">{message}</p>;
}

type IntakeFormProps = {
  defaultType?: "service" | "sale";
  initialFullName?: string;
  initialCountryCode?: string;
  initialPhoneNumber?: string;
  initialBrand?: string;
  initialModel?: string;
};

export function IntakeForm({
  defaultType = "service",
  initialFullName,
  initialCountryCode,
  initialPhoneNumber,
  initialBrand,
  initialModel,
}: IntakeFormProps) {
  const [state, formAction] = useActionState(createIntakeAction, initialState);
  const [submissionToken] = useState(buildSubmissionToken);
  const [intakeType, setIntakeType] = useState<"service" | "sale">(defaultType);

  const isSale = intakeType === "sale";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="submissionToken" value={submissionToken} />
      <input type="hidden" name="intakeType" value={intakeType} />

      {/* Type toggle */}
      <div className="flex gap-2 rounded-2xl border border-border bg-[#f0ede0] p-1">
        <button
          type="button"
          onClick={() => setIntakeType("service")}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            !isSale
              ? "bg-[#23443f] text-white shadow-sm"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          Service
        </button>
        <button
          type="button"
          onClick={() => setIntakeType("sale")}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isSale
              ? "bg-[#23443f] text-white shadow-sm"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          Sales
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Customer name
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            defaultValue={state.values?.fullName ?? initialFullName ?? ""}
            className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
            placeholder="e.g. Maria Jansen"
          />
          <FieldError message={state.fieldErrors?.fullName} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
            Phone
          </label>
          <div className="grid grid-cols-[116px_minmax(0,1fr)] gap-2">
            <select
              id="countryCode"
              name="countryCode"
              defaultValue={state.values?.countryCode ?? initialCountryCode ?? "+359"}
              className="min-h-12 rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
            >
              {PHONE_COUNTRY_CODES.map((countryCode) => (
                <option key={countryCode} value={countryCode}>
                  {countryCode}
                </option>
              ))}
            </select>
            <input
              id="phoneNumber"
              name="phoneNumber"
              required
              inputMode="tel"
              defaultValue={state.values?.phoneNumber ?? initialPhoneNumber ?? ""}
              className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
              placeholder="876 123 456"
            />
          </div>
          <FieldError message={state.fieldErrors?.phoneNumber} />
        </div>

        <div className="space-y-2">
          <label htmlFor="brand" className="text-sm font-medium text-foreground">
            Brand
          </label>
          <input
            id="brand"
            name="brand"
            required
            defaultValue={state.values?.brand ?? initialBrand ?? ""}
            className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
            placeholder="Delonghi"
          />
          <FieldError message={state.fieldErrors?.brand} />
        </div>

        <div className="space-y-2">
          <label htmlFor="model" className="text-sm font-medium text-foreground">
            Model
          </label>
          <input
            id="model"
            name="model"
            required
            defaultValue={state.values?.model ?? initialModel ?? ""}
            className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
            placeholder="Magnifica S"
          />
          <FieldError message={state.fieldErrors?.model} />
        </div>

        {/* Service: required issue description. Sales: optional note. */}
        {!isSale ? (
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="issueDescription" className="text-sm font-medium text-foreground">
              Problem description
            </label>
            <textarea
              id="issueDescription"
              name="issueDescription"
              required
              rows={4}
              defaultValue={state.values?.issueDescription ?? ""}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
              placeholder="No water flow, leaking underneath, making noise..."
            />
            <FieldError message={state.fieldErrors?.issueDescription} />
          </div>
        ) : (
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="issueDescription" className="text-sm font-medium text-foreground">
              Note <span className="text-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="issueDescription"
              name="issueDescription"
              rows={3}
              defaultValue={state.values?.issueDescription ?? ""}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
              placeholder="Additional information..."
            />
          </div>
        )}
      </div>

      {state.message ? (
        <div className="rounded-[1.5rem] border border-[#d6c6b4] bg-[#fff6ed] px-4 py-4 text-sm text-[#7a4e21]">
          <p>{state.message}</p>

          {state.matches?.length ? (
            <div className="mt-4 space-y-3">
              {state.matches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-[#ead7c2] bg-white px-4 py-4 text-foreground"
                >
                  <p className="font-semibold">{match.fullName}</p>
                  <p className="mt-1 text-sm text-muted">{match.displayPhone}</p>
                  <p className="mt-1 text-sm text-muted">{match.reason}</p>
                  <div className="mt-3">
                    <SubmitButton
                      label="Link to this customer"
                      pendingLabel="Saving..."
                      name="customerResolution"
                      value={`link:${match.id}`}
                      variant="secondary"
                    />
                  </div>
                </div>
              ))}

              <SubmitButton
                label="Create new customer"
                pendingLabel="Saving..."
                name="customerResolution"
                value="create_new"
                variant="secondary"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
          <div className="space-y-2">
            <label htmlFor="chargedAmount" className="text-sm font-medium text-foreground">
              Price (€)
            </label>
            <input
              id="chargedAmount"
              name="chargedAmount"
              inputMode="decimal"
              placeholder="e.g. 120"
              className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong sm:w-36"
            />
          </div>

          {isSale ? (
            <div className="space-y-2">
              <label htmlFor="coffeeCount" className="text-sm font-medium text-foreground">
                Coffee count
              </label>
              <input
                id="coffeeCount"
                name="coffeeCount"
                inputMode="numeric"
                placeholder="e.g. 5000"
                className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong sm:w-36"
              />
            </div>
          ) : null}
        </div>

        <SubmitButton
          label={isSale ? "Save sale" : "Save intake"}
          pendingLabel="Saving..."
        />
      </div>
    </form>
  );
}
