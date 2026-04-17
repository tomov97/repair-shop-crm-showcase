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
};

export type SaveCoffeeCountActionState = {
  message?: string;
};

export type UpdateIntakeActionState = {
  message?: string;
};

const serviceIntakeSchema = z.object({
  fullName: z.string().trim().min(2, "Въведи име на клиент."),
  countryCode: z.string().trim().regex(/^\+\d{1,4}$/, "Избери валиден код."),
  phoneNumber: z.string().trim().min(6, "Въведи телефонен номер."),
  brand: z.string().trim().min(1, "Въведи марка."),
  model: z.string().trim().min(1, "Въведи модел."),
  issueDescription: z.string().trim().min(5, "Опиши проблема."),
  submissionToken: z.string().trim().min(12, "Липсва токен за изпращане."),
  customerResolution: z.string().optional(),
});

// Sales intakes: note (issueDescription) is optional, coffee count accepted at creation
const saleIntakeSchema = z.object({
  fullName: z.string().trim().min(2, "Въведи ime на клиент."),
  countryCode: z.string().trim().regex(/^\+\d{1,4}$/, "Избери валиден код."),
  phoneNumber: z.string().trim().min(6, "Въведи телефонен номер."),
  brand: z.string().trim().min(1, "Въведи марка."),
  model: z.string().trim().min(1, "Въведи модел."),
  issueDescription: z.string().trim().default(""),
  submissionToken: z.string().trim().min(12, "Липсва токен за изпращане."),
  customerResolution: z.string().optional(),
  coffeeCount: z.string().optional(),
});

const updateIntakeSchema = z.object({
  intakeId: z.string().uuid("Липсва валидно приемане."),
  intakeType: z.enum(["service", "sale"]).default("service"),
  fullName: z.string().trim().min(2, "Въведи ime на клиент."),
  countryCode: z.string().trim().regex(/^\+\d{1,4}$/, "Избери валиден код."),
  phoneNumber: z.string().trim().min(6, "Въведи телефонен номер."),
  brand: z.string().trim().min(1, "Въведи марка."),
  model: z.string().trim().min(1, "Въведи модел."),
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
      message: "Намерихме подобен клиент. Потвърди дали да свържем приемането или да създадем нов запис.",
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
      message: "Липсва приемане за архивиране.",
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
  const returnTo = getOptionalFormValue(formData, "returnTo") ?? "/new-intake";

  if (!intakeId) {
    return {
      message: "Липсва приемане за сумата.",
    };
  }

  if (!chargedAmountValue?.trim()) {
    return {
      message: "Въведи сума за плащане.",
    };
  }

  const chargedAmount = parseChargedAmount(chargedAmountValue);

  if (chargedAmount === null) {
    return {
      message: "Въведи валидна сума по-голяма от нула.",
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

  redirect(safeRedirectUrl(returnTo, "/new-intake"));
}

export async function saveCoffeeCountAction(
  _state: SaveCoffeeCountActionState,
  formData: FormData,
): Promise<SaveCoffeeCountActionState> {
  const user = await requireUser();
  const intakeId = getValidUuid(formData, "intakeId");
  const coffeeCountValue = getOptionalFormValue(formData, "coffeeCount");
  const returnTo = getOptionalFormValue(formData, "returnTo") ?? "/new-intake";

  if (!intakeId) {
    return { message: "Липсва приемане." };
  }

  if (!coffeeCountValue?.trim()) {
    return { message: "Въведи брой кафета." };
  }

  const parsed = parseInt(coffeeCountValue.trim(), 10);

  if (isNaN(parsed) || parsed < 0) {
    return { message: "Въведи валидно цяло число." };
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

  redirect(safeRedirectUrl(returnTo, "/new-intake"));
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
    return { message: "Липсва приемане за печат." };
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
