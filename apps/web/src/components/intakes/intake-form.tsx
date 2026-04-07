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

export function IntakeForm() {
  const [state, formAction] = useActionState(createIntakeAction, initialState);
  const [submissionToken] = useState(buildSubmissionToken);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="submissionToken" value={submissionToken} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Име на клиент
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            defaultValue={state.values?.fullName ?? ""}
            className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
            placeholder="Например Мария Иванова"
          />
          <FieldError message={state.fieldErrors?.fullName} />
        </div>

        <div className="space-y-2">
          <label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
            Телефон
          </label>
          <div className="grid grid-cols-[116px_minmax(0,1fr)] gap-2">
            <select
              id="countryCode"
              name="countryCode"
              defaultValue={state.values?.countryCode ?? "+359"}
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
              defaultValue={state.values?.phoneNumber ?? ""}
              className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
              placeholder="876 123 456"
            />
          </div>
          <FieldError message={state.fieldErrors?.phoneNumber} />
        </div>

        <div className="space-y-2">
          <label htmlFor="brand" className="text-sm font-medium text-foreground">
            Марка
          </label>
          <input
            id="brand"
            name="brand"
            required
            defaultValue={state.values?.brand ?? ""}
            className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
            placeholder="Delonghi"
          />
          <FieldError message={state.fieldErrors?.brand} />
        </div>

        <div className="space-y-2">
          <label htmlFor="model" className="text-sm font-medium text-foreground">
            Модел
          </label>
          <input
            id="model"
            name="model"
            required
            defaultValue={state.values?.model ?? ""}
            className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
            placeholder="Magnifica S"
          />
          <FieldError message={state.fieldErrors?.model} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="issueDescription" className="text-sm font-medium text-foreground">
            Описание на проблема
          </label>
          <textarea
            id="issueDescription"
            name="issueDescription"
            required
            rows={4}
            defaultValue={state.values?.issueDescription ?? ""}
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
            placeholder="Не пуска вода, тече отдолу, прави шум..."
          />
          <FieldError message={state.fieldErrors?.issueDescription} />
        </div>

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
                      label="Свържи с този клиент"
                      pendingLabel="Запазване..."
                      name="customerResolution"
                      value={`link:${match.id}`}
                      variant="secondary"
                    />
                  </div>
                </div>
              ))}

              <SubmitButton
                label="Създай нов клиент"
                pendingLabel="Запазване..."
                name="customerResolution"
                value="create_new"
                variant="secondary"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <label htmlFor="chargedAmount" className="text-sm font-medium text-foreground">
            Цена (€)
          </label>
          <input
            id="chargedAmount"
            name="chargedAmount"
            inputMode="decimal"
            placeholder="Напр. 120"
            className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong sm:w-40"
          />
        </div>
        <SubmitButton label="Запази приемането" pendingLabel="Запазване..." />
      </div>
    </form>
  );
}
