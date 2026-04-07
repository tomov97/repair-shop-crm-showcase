"use client";

import { useActionState } from "react";
import { bootstrapOwnerAction, type AuthActionState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: AuthActionState = {};

export function SetupForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction] = useActionState(bootstrapOwnerAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Имейл за вход
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={state.email ?? ""}
          className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
          placeholder="shop@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Парола
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
          placeholder="Поне 8 символа"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Повтори паролата
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
          placeholder="Повтори паролата"
        />
      </div>

      {state.message ? (
        <p className="rounded-2xl border border-[#d6c6b4] bg-[#fff6ed] px-4 py-3 text-sm text-[#7a4e21]">
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Създай първи достъп" pendingLabel="Създаване..." />
    </form>
  );
}
