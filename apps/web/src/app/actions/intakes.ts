"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  archiveIntake,
  createIntake,
  requeuePrintJob,
  saveChargedAmount,
  saveCoffeeCount,
  updateIntake,
  type CustomerMatchCandidate,
} from "@/lib/intakes";
import { formatStructuredPhone } from "@/lib/phone";
import { safeRedirectUrl } from "@/lib/utils";

export type IntakeActionState = {
  message?: string;
  fieldErrors?: Partial<Record<"fullName" | "phoneNumber" | "brand" | "model" | "issueDescription", string>>;
  values?: {
    fullName: string;
    countryCode: string;
    phoneNumber: string;
    brand: string;
    model: string;
    issueDescription: string;
  };
  matches?: CustomerMatchCandidate[];
};

export type ArchiveIntakeActionState = {
  message?: string;
};

export type SaveChargedAmountActionState = {
  message?: string;
  ok?: boolean;
};

export type SaveCoffeeCountActionState = {
  message?: string;
  ok?: boolean;
};

export type UpdateIntakeActionState = {
  message?: string;
};

const serviceIntakeSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a customer name."),
  countryCode: z.string().trim().regex(/^\+\d{1,4}$/, "Select a valid country code."),
  phoneNumber: z.string().trim().min(6, "Enter a phone number."),
  brand: z.string().trim().min(1, "Enter a brand."),
  model: z.string().trim().min(1, "Enter a model."),
  issueDescription: z.string().trim().min(5, "Describe the problem."),
  submissionToken: z.string().trim().min(12, "Missing submission token."),
  customerResolution: z.string().optional(),
});

// Sales intakes: note (issueDescription) is optional, coffee count accepted at creation
const saleIntakeSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a customer name."),
  countryCode: z.string().trim().regex(/^\+\d{1,4}$/, "Select a valid country code."),
  phoneNumber: z.string().trim().min(6, "Enter a phone number."),
  brand: z.string().trim().min(1, "Enter a brand."),
  model: z.string().trim().min(1, "Enter a model."),
  issueDescription: z.string().trim().default(""),
  submissionToken: z.string().trim().min(12, "Missing submission token."),
  customerResolution: z.string().optional(),
  coffeeCount: z.string().optional(),
});

const updateIntakeSchema = z.object({
  intakeId: z.string().uuid("No valid intake."),
  intakeType: z.enum(["service", "sale"]).default("service"),
  fullName: z.string().trim().min(2, "Enter a customer name."),
  countryCode: z.string().trim().regex(/^\+\d{1,4}$/, "Select a valid country code."),
  phoneNumber: z.string().trim().min(6, "Enter a phone number."),
  brand: z.string().trim().min(1, "Enter a brand."),
  model: z.string().trim().min(1, "Enter a model."),
  issueDescription: z.string().trim().default(""),
  returnTo: z.string().trim().min(1).default("/"),
});

const uuidSchema = z.string().uuid();

function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function getValidUuid(formData: FormData, key: string): string | null {
  const value = getOptionalFormValue(formData, key);
  if (!value) return null;
  return uuidSchema.safeParse(value).success ? value : null;
}

function parseChargedAmount(value: string) {
  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Number(amount.toFixed(2));
}

export async function createIntakeAction(
  _state: IntakeActionState,
  formData: FormData,
): Promise<IntakeActionState> {
  const user = await requireUser();

  const intakeType = formData.get("intakeType") === "sale" ? "sale" : "service";

  const rawValues = {
    fullName: String(formData.get("fullName") ?? ""),
    countryCode: String(formData.get("countryCode") ?? "+359"),
    phoneNumber: String(formData.get("phoneNumber") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    model: String(formData.get("model") ?? ""),
    issueDescription: String(formData.get("issueDescription") ?? ""),
  };

  const schema = intakeType === "sale" ? saleIntakeSchema : serviceIntakeSchema;

  const validatedFields = schema.safeParse({
    ...rawValues,
    submissionToken: getOptionalFormValue(formData, "submissionToken"),
    customerResolution: getOptionalFormValue(formData, "customerResolution"),
    ...(intakeType === "sale" ? { coffeeCount: getOptionalFormValue(formData, "coffeeCount") } : {}),
  });

  if (!validatedFields.success) {
    const fieldErrors: IntakeActionState["fieldErrors"] = {};

    for (const issue of validatedFields.error.issues) {
      const key = issue.path[0];

      if (
        key === "fullName" ||
        key === "phoneNumber" ||
        key === "brand" ||
        key === "model" ||
        key === "issueDescription"
      ) {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      message: validatedFields.error.issues[0]?.message,
      fieldErrors,
      values: rawValues,
    };
  }

  const displayPhone = formatStructuredPhone(validatedFields.data.countryCode, validatedFields.data.phoneNumber);

  const chargedAmountRaw = getOptionalFormValue(formData, "chargedAmount");
  const chargedAmount = chargedAmountRaw?.trim() ? parseChargedAmount(chargedAmountRaw) : null;

  let coffeeCount: number | null = null;
  if (intakeType === "sale") {
    const coffeeCountRaw = getOptionalFormValue(formData, "coffeeCount");
    if (coffeeCountRaw?.trim()) {
      const parsed = parseInt(coffeeCountRaw.trim(), 10);
      if (!isNaN(parsed) && parsed >= 0) {
        coffeeCount = parsed;
      }
    }
  }

  const result = await createIntake({
    actorId: user.id,
    intakeType,
    fullName: validatedFields.data.fullName,
    phoneNumber: displayPhone,
    brand: validatedFields.data.brand,
    model: validatedFields.data.model,
    issueDescription: validatedFields.data.issueDescription,
    submissionToken: validatedFields.data.submissionToken,
    customerResolution: validatedFields.data.customerResolution ?? null,
    chargedAmount,
    coffeeCount,
  });

  if (result.type === "needs_customer_confirmation") {
    return {
      message: "We found a similar customer. Confirm whether to link this intake or create a new record.",
      values: rawValues,
      matches: result.matches,
    };
  }

  if (result.type === "error") {
    return {
      message: result.message,
      values: rawValues,
    };
  }


  revalidatePath(`/intakes/${result.intakeId}`);
  if (intakeType === "sale") {
    revalidatePath("/sales");
  }

  redirect(`/intakes/${result.intakeId}`);
}

export async function archiveIntakeAction(
  _state: ArchiveIntakeActionState,
  formData: FormData,
): Promise<ArchiveIntakeActionState> {
  const user = await requireUser();
  const intakeId = getValidUuid(formData, "intakeId");
  const returnTo = getOptionalFormValue(formData, "returnTo") ?? "/new-intake";

  if (!intakeId) {
    return {
      message: "No intake to archive.",
    };
  }

  const result = await archiveIntake({
    actorId: user.id,
    intakeId,
  });

  if (result.type === "error") {
    return {
      message: result.message,
    };
  }


  revalidatePath("/intakes");
  revalidatePath(`/intakes/${intakeId}`);

  redirect(safeRedirectUrl(returnTo, "/new-intake"));
}

export async function saveChargedAmountAction(
  _state: SaveChargedAmountActionState,
  formData: FormData,
): Promise<SaveChargedAmountActionState> {
  const user = await requireUser();
  const intakeId = getValidUuid(formData, "intakeId");
  const chargedAmountValue = getOptionalFormValue(formData, "chargedAmount");

  if (!intakeId) {
    return {
      message: "No intake for the amount.",
    };
  }

  if (!chargedAmountValue?.trim()) {
    return {
      message: "Enter the amount charged.",
    };
  }

  const chargedAmount = parseChargedAmount(chargedAmountValue);

  if (chargedAmount === null) {
    return {
      message: "Enter a valid amount greater than zero.",
    };
  }

  const result = await saveChargedAmount({
    actorId: user.id,
    intakeId,
    chargedAmount,
  });

  if (result.type === "error") {
    return {
      message: result.message,
    };
  }


  revalidatePath("/intakes");
  revalidatePath(`/intakes/${intakeId}`);

  return { ok: true };
}

export async function saveCoffeeCountAction(
  _state: SaveCoffeeCountActionState,
  formData: FormData,
): Promise<SaveCoffeeCountActionState> {
  const user = await requireUser();
  const intakeId = getValidUuid(formData, "intakeId");
  const coffeeCountValue = getOptionalFormValue(formData, "coffeeCount");

  if (!intakeId) {
    return { message: "No intake." };
  }

  if (!coffeeCountValue?.trim()) {
    return { message: "Enter the coffee count." };
  }

  const parsed = parseInt(coffeeCountValue.trim(), 10);

  if (isNaN(parsed) || parsed < 0) {
    return { message: "Enter a valid whole number." };
  }

  const result = await saveCoffeeCount({
    actorId: user.id,
    intakeId,
    coffeeCount: parsed,
  });

  if (result.type === "error") {
    return { message: result.message };
  }


  revalidatePath("/intakes");
  revalidatePath(`/intakes/${intakeId}`);

  return { ok: true };
}

export type ReprintIntakeActionState = {
  message?: string;
};

export async function reprintIntakeAction(
  _state: ReprintIntakeActionState,
  formData: FormData,
): Promise<ReprintIntakeActionState> {
  const user = await requireUser();
  const intakeId = getValidUuid(formData, "intakeId");
  const returnTo = getOptionalFormValue(formData, "returnTo") ?? "/";

  if (!intakeId) {
    return { message: "No intake to print." };
  }

  const result = await requeuePrintJob({ actorId: user.id, intakeId });

  if (result.type === "error") {
    return { message: result.message };
  }

  revalidatePath(`/intakes/${intakeId}`);
  revalidatePath("/print");

  redirect(safeRedirectUrl(returnTo, "/"));
}

export async function updateIntakeAction(
  _state: UpdateIntakeActionState,
  formData: FormData,
): Promise<UpdateIntakeActionState> {
  const user = await requireUser();
  const validatedFields = updateIntakeSchema.safeParse({
    intakeId: formData.get("intakeId"),
    intakeType: formData.get("intakeType"),
    fullName: formData.get("fullName"),
    countryCode: formData.get("countryCode"),
    phoneNumber: formData.get("phoneNumber"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    issueDescription: formData.get("issueDescription") ?? "",
    returnTo: formData.get("returnTo"),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.issues[0]?.message,
    };
  }

  const result = await updateIntake({
    actorId: user.id,
    intakeId: validatedFields.data.intakeId,
    fullName: validatedFields.data.fullName,
    phoneNumber: formatStructuredPhone(validatedFields.data.countryCode, validatedFields.data.phoneNumber),
    brand: validatedFields.data.brand,
    model: validatedFields.data.model,
    issueDescription: validatedFields.data.issueDescription,
  });

  if (result.type === "error") {
    return {
      message: result.message,
    };
  }


  revalidatePath("/intakes");
  revalidatePath("/sales");
  revalidatePath(`/intakes/${validatedFields.data.intakeId}`);

  redirect(safeRedirectUrl(validatedFields.data.returnTo, "/"));
}
