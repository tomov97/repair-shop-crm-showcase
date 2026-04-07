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
  email: z.email("Въведи валиден имейл адрес.").trim(),
  password: z.string().min(8, "Паролата трябва да е поне 8 символа."),
  redirectTo: z.string().trim().optional(),
});

const bootstrapSchema = signInSchema.extend({
  confirmPassword: z.string().min(8, "Повтори паролата."),
});

export async function signInAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!checkRateLimit(`login:${rawEmail}`, 10, 15 * 60 * 1000)) {
    return {
      message: "Твърде много опити за вход. Опитай отново след 15 минути.",
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
      message: "Имейлът или паролата не съвпадат.",
      email: validatedFields.data.email,
    };
  }

  redirect(safeRedirectUrl(validatedFields.data.redirectTo, "/dashboard"));
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
      message: "Двете пароли трябва да съвпадат.",
      email: validatedFields.data.email,
    };
  }

  const setupStatus = await getSetupStatus();

  if (setupStatus.hasUsers) {
    return {
      message: "Първоначалният достъп вече е създаден. Използвай вход.",
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
      message: "Не успяхме да създадем първия потребител.",
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
      message: "Потребителят е създаден, но автоматичният вход не успя.",
      email: validatedFields.data.email,
    };
  }

  redirect(safeRedirectUrl(validatedFields.data.redirectTo, "/dashboard"));
}
