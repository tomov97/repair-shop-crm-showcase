"use client";

import { useActionState } from "react";
import { signInAction, type AuthActionState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: AuthActionState = {};

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
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
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="min-h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-surface-strong"
          placeholder="At least 8 characters"
        />
      </div>

      {state.message ? (
        <p className="rounded-2xl border border-[#d6c6b4] bg-[#fff6ed] px-4 py-3 text-sm text-[#7a4e21]">
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Sign in" pendingLabel="Signing in..." />
    </form>
  );
}
