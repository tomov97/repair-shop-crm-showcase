"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSetupStatus } from "@/lib/intakes";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeRedirectUrl } from "@/lib/utils";

export type AuthActionState = {
  message?: string;
  email?: string;
};

const signInSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  redirectTo: z.string().trim().optional(),
});

const bootstrapSchema = signInSchema.extend({
  confirmPassword: z.string().min(8, "Repeat the password."),
});

export async function signInAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!checkRateLimit(`login:${rawEmail}`, 10, 15 * 60 * 1000)) {
    return {
      message: "Too many sign-in attempts. Try again in 15 minutes.",
      email: rawEmail,
    };
  }

  const validatedFields = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.issues[0]?.message,
      email: String(formData.get("email") ?? ""),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  });

  if (error) {
    return {
      message: "Email or password is incorrect.",
      email: validatedFields.data.email,
    };
  }

  redirect(safeRedirectUrl(validatedFields.data.redirectTo, "/intakes"));
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function bootstrapOwnerAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validatedFields = bootstrapSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.issues[0]?.message,
      email: String(formData.get("email") ?? ""),
    };
  }

  if (validatedFields.data.password !== validatedFields.data.confirmPassword) {
    return {
      message: "The two passwords must match.",
      email: validatedFields.data.email,
    };
  }

  const setupStatus = await getSetupStatus();

  if (setupStatus.hasUsers) {
    return {
      message: "The first account already exists. Use sign in.",
      email: validatedFields.data.email,
    };
  }

  const adminSupabase = getSupabaseAdminClient();
  const { error: createUserError } = await adminSupabase.auth.admin.createUser({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
    email_confirm: true,
  });

  if (createUserError) {
    return {
      message: "Could not create the first user.",
      email: validatedFields.data.email,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  });

  if (signInError) {
    return {
      message: "The user was created but automatic sign-in failed.",
      email: validatedFields.data.email,
    };
  }

  redirect(safeRedirectUrl(validatedFields.data.redirectTo, "/intakes"));
}
