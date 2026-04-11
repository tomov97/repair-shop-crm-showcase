import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildScanToken,
  formatDate,
  formatDateTime,
  formatMoney,
  getAbsoluteUrl,
  normalizePersonName,
  normalizePhoneNumber,
} from "@/lib/utils";

type CustomerRow = {
  id: string;
  full_name: string;
  normalized_phone: string;
  display_phone: string;
  created_at: string;
  updated_at: string;
};

type IntakeRow = {
  id: string;
  customer_id: string;
  intake_number: string;
  scan_token: string;
  brand: string;
  model: string;
  issue_description: string;
  notes: string | null;
  is_archived: boolean;
  charged_amount: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type AuditEventInsert = {
  entity_type: string;
  entity_id: string;
  event_type: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
};

export type IntakeListItem = {
  id: string;
  intakeNumber: string;
  customerName: string;
  customerPhone: string;
  brand: string;
  model: string;
  createdAtLabel: string;
  isArchived: boolean;
  printStatus: string;
  chargedAmountLabel?: string;
  chargedAmountValue?: string;
  customerVisitCount?: number;
};

export type DashboardData = {
  summary: {
    activeCount: number;
    archivedCount: number;
    queuedCount: number;
    totalCount: number;
  };
  recentIntakes: IntakeListItem[];
  backendMessage: string | null;
};

export type IntakeDetail = {
  id: string;
  intakeNumber: string;
  scanToken: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  archivedAtLabel: string | null;
  isArchived: boolean;
  chargedAmountLabel: string;
  chargedAmountValue: string;
  coffeeCount: number | null;
  brand: string;
  model: string;
  issueDescription: string;
  notes: string | null;
  customerName: string;
  customerPhone: string;
  customerVisitCount: number;
  previousIntakes: Array<{
    id: string;
    intakeNumber: string;
    createdAtLabel: string;
    brand: string;
    model: string;
    isArchived: boolean;
  }>;
  printJobs: Array<{
    id: string;
    status: string;
    createdAtLabel: string;
    updatedAtLabel: string;
    printedAtLabel: string | null;
    lastError: string | null;
  }>;
};

export type CustomerMatchCandidate = {
  id: string;
  fullName: string;
  displayPhone: string;
  reason: string;
};

type CreateIntakeInput = {
  actorId: string;
  fullName: string;
  phoneNumber: string;
  brand: string;
  model: string;
  issueDescription: string;
  notes?: string;
  chargedAmount?: number | null;
  submissionToken: string;
  customerResolution?: string | null;
};

export type CreateIntakeResult =
  | {
      type: "success";
      intakeId: string;
      printJobQueued: boolean;
    }
  | {
      type: "needs_customer_confirmation";
      matches: CustomerMatchCandidate[];
    }
  | {
      type: "error";
      message: string;
    };

export type ArchiveIntakeResult =
  | {
      type: "success";
      alreadyArchived: boolean;
    }
  | {
      type: "error";
      message: string;
    };

export type SaveChargedAmountResult =
  | {
      type: "success";
    }
  | {
      type: "error";
      message: string;
    };

export type UpdateIntakeResult =
  | {
      type: "success";
    }
  | {
      type: "error";
      message: string;
    };

function mapErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  if (!error) {
    return fallback;
  }

  if (error.message?.includes("schema cache")) {
    return "Връзката към базата е готова частично, но схемата още не е приложена или не е обновена.";
  }

  // Log the real error server-side for debugging; return generic message to client
  // to avoid leaking internal schema details (CWE-209).
  console.error("[intakes] DB error:", error.message);
  return fallback;
}

function getPrintStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "queued":
      return "Чака печат";
    case "printing":
      return "Печата се";
    case "printed":
      return "Отпечатан";
    case "failed":
      return "Грешка при печат";
    default:
      return "Няма задача";
  }
}

async function insertAuditEvent(event: AuditEventInsert) {
  const supabase = getSupabaseAdminClient();
  await supabase.from("audit_events").insert(event);
}

async function getNextIntakeNumber(supabase = getSupabaseAdminClient(), now = new Date()) {
  const year = now.getFullYear().toString().slice(-2);
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  const prefix = `SC-${day}/${month}/${year}-`;

  const { data } = await supabase
    .from("intakes")
    .select("intake_number")
    .like("intake_number", `${prefix}%`)
    .order("intake_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastValue = data?.intake_number as string | undefined;
  const lastSequence = lastValue ? Number(lastValue.slice(prefix.length)) : 0;
  const nextSequence = `${lastSequence + 1}`.padStart(6, "0");

  return `${prefix}${nextSequence}`;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseAdminClient();

  const [recentIntakesResult, activeCountResult, archivedCountResult, queuedCountResult] = await Promise.all([
    supabase
      .from("intakes")
      .select(`
        id, customer_id, intake_number, brand, model, is_archived, charged_amount, created_at,
        customers ( full_name, display_phone ),
        print_jobs ( status, created_at )
      `)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("intakes").select("id", { count: "exact", head: true }).eq("is_archived", false),
    supabase.from("intakes").select("id", { count: "exact", head: true }).eq("is_archived", true),
    supabase.from("print_jobs").select("id", { count: "exact", head: true }).in("status", ["queued", "failed"]),
  ]);

  const errors = [
    recentIntakesResult.error,
    activeCountResult.error,
    archivedCountResult.error,
    queuedCountResult.error,
  ].filter(Boolean);

  if (errors.length > 0 || !recentIntakesResult.data) {
    return {
      summary: {
        activeCount: 0,
        archivedCount: 0,
        queuedCount: 0,
        totalCount: 0,
      },
      recentIntakes: [],
      backendMessage: mapErrorMessage(errors[0], "Не успяхме да заредим данните от Supabase."),
    };
  }

  type RecentIntakeRow = IntakeRow & {
    customers: { full_name: string; display_phone: string } | null;
    print_jobs: Array<{ status: string; created_at: string }>;
  };

  const recentIntakes = recentIntakesResult.data as unknown as RecentIntakeRow[];

  const uniqueCustomerIds = [...new Set(recentIntakes.map((i) => i.customer_id))];
  const { data: visitCountRows } = await supabase
    .from("intakes")
    .select("customer_id")
    .in("customer_id", uniqueCustomerIds);

  const customerVisitCounts = new Map<string, number>();
  for (const row of (visitCountRows as Array<{ customer_id: string }> | null) ?? []) {
    customerVisitCounts.set(row.customer_id, (customerVisitCounts.get(row.customer_id) ?? 0) + 1);
  }

  return {
    summary: {
      activeCount: activeCountResult.count ?? 0,
      archivedCount: archivedCountResult.count ?? 0,
      queuedCount: queuedCountResult.count ?? 0,
      totalCount: (activeCountResult.count ?? 0) + (archivedCountResult.count ?? 0),
    },
    recentIntakes: recentIntakes.map((intake) => {
      const latestPrintJob = intake.print_jobs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

      return {
        id: intake.id,
        intakeNumber: intake.intake_number,
        customerName: intake.customers?.full_name ?? "Неизвестен клиент",
        customerPhone: intake.customers?.display_phone ?? "Няма телефон",
        brand: intake.brand,
        model: intake.model,
        createdAtLabel: formatDateTime(intake.created_at),
        isArchived: intake.is_archived,
        printStatus: getPrintStatusLabel(latestPrintJob?.status),
        chargedAmountValue: intake.charged_amount ?? undefined,
        customerVisitCount: customerVisitCounts.get(intake.customer_id) ?? 1,
      };
    }),
    backendMessage: null,
  };
}

export async function getIntakeDetail(intakeId: string): Promise<IntakeDetail | null> {
  const supabase = getSupabaseAdminClient();

  const [intakeResult, printJobsResult] = await Promise.all([
    supabase
      .from("intakes")
      .select(`
        id, customer_id, intake_number, scan_token, brand, model, issue_description, notes,
        is_archived, charged_amount, coffee_count, created_at, updated_at, archived_at,
        customers ( full_name, display_phone )
      `)
      .eq("id", intakeId)
      .maybeSingle(),
    supabase
      .from("print_jobs")
      .select("id, status, last_error, created_at, updated_at, printed_at")
      .eq("intake_id", intakeId)
      .order("created_at", { ascending: false }),
  ]);

  const intake = intakeResult.data as (IntakeRow & {
    coffee_count: number | null;
    customers: { full_name: string; display_phone: string } | null;
  }) | null;

  if (intakeResult.error || !intake) {
    return null;
  }

  const relatedIntakesResult = await supabase
    .from("intakes")
    .select("id, intake_number, brand, model, is_archived, created_at")
    .eq("customer_id", intake.customer_id)
    .neq("id", intakeId)
    .order("created_at", { ascending: false })
    .limit(6);

  const previousIntakes = (relatedIntakesResult.data as Array<{
    id: string;
    intake_number: string;
    brand: string;
    model: string;
    is_archived: boolean;
    created_at: string;
  }> | null) ?? [];

  const printJobs = (printJobsResult.data as Array<{
    id: string;
    status: string;
    last_error: string | null;
    created_at: string;
    updated_at: string;
    printed_at: string | null;
  }> | null) ?? [];

  return {
    id: intake.id,
    intakeNumber: intake.intake_number,
    scanToken: intake.scan_token,
    createdAtLabel: formatDate(intake.created_at),
    updatedAtLabel: formatDateTime(intake.updated_at),
    archivedAtLabel: intake.archived_at ? formatDateTime(intake.archived_at) : null,
    isArchived: intake.is_archived,
    chargedAmountLabel: formatMoney(intake.charged_amount),
    chargedAmountValue: intake.charged_amount ?? "",
    coffeeCount: intake.coffee_count ?? null,
    brand: intake.brand,
    model: intake.model,
    issueDescription: intake.issue_description,
    notes: intake.notes,
    customerName: intake.customers?.full_name ?? "Неизвестен клиент",
    customerPhone: intake.customers?.display_phone ?? "Няма телефон",
    customerVisitCount: previousIntakes.length + 1,
    previousIntakes: previousIntakes.map((item) => ({
      id: item.id,
      intakeNumber: item.intake_number,
      createdAtLabel: formatDateTime(item.created_at),
      brand: item.brand,
      model: item.model,
      isArchived: item.is_archived,
    })),
    printJobs: printJobs.map((job) => ({
      id: job.id,
      status: getPrintStatusLabel(job.status),
      createdAtLabel: formatDateTime(job.created_at),
      updatedAtLabel: formatDateTime(job.updated_at),
      printedAtLabel: job.printed_at ? formatDateTime(job.printed_at) : null,
      lastError: job.last_error,
    })),
  };
}

export async function getIntakeForLabel(scanToken: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("intakes")
    .select("intake_number, scan_token, created_at")
    .eq("scan_token", scanToken)
    .maybeSingle();

  return data as { intake_number: string; scan_token: string; created_at: string } | null;
}

export async function getIntakeIdByScanToken(scanToken: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("intakes")
    .select("id")
    .eq("scan_token", scanToken)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id as string;
}

export async function getSetupStatus() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  if (error) {
    return {
      hasUsers: true,
      setupAvailable: false,
    };
  }

  return {
    hasUsers: data.users.length > 0,
    setupAvailable: true,
  };
}

export async function createIntake(input: CreateIntakeInput): Promise<CreateIntakeResult> {
  const supabase = getSupabaseAdminClient();
  const normalizedName = normalizePersonName(input.fullName);
  const normalizedPhone = normalizePhoneNumber(input.phoneNumber);
  const scanToken = buildScanToken(input.submissionToken);

  if (!normalizedPhone) {
    return {
      type: "error",
      message: "Въведи валиден телефонен номер (само цифри).",
    };
  }

  const { data: existingIntake, error: existingIntakeError } = await supabase
    .from("intakes")
    .select("id")
    .eq("scan_token", scanToken)
    .maybeSingle();

  if (existingIntake?.id) {
    return {
      type: "success",
      intakeId: existingIntake.id,
      printJobQueued: true,
    };
  }

  if (existingIntakeError && !existingIntakeError.message.includes("0 rows")) {
    return {
      type: "error",
      message: mapErrorMessage(existingIntakeError, "Не успяхме да проверим за дублирано изпращане."),
    };
  }

  const phoneMatchesResult = await supabase
    .from("customers")
    .select("id, full_name, normalized_phone, display_phone, created_at, updated_at")
    .eq("normalized_phone", normalizedPhone)
    .limit(5);

  if (phoneMatchesResult.error) {
    return {
      type: "error",
      message: mapErrorMessage(phoneMatchesResult.error, "Не успяхме да проверим съществуващите клиенти."),
    };
  }

  const phoneMatches = (phoneMatchesResult.data ?? []) as CustomerRow[];
  const exactMatch = phoneMatches[0] ?? null;

  let customerId = exactMatch?.id ?? null;
  let auditEventType = exactMatch ? "customer_auto_linked" : "customer_created";

  if (!customerId) {
    if (phoneMatches.length > 1 && !input.customerResolution) {
      return {
        type: "needs_customer_confirmation",
        matches: phoneMatches.map((customer) => ({
          id: customer.id,
          fullName: customer.full_name,
          displayPhone: customer.display_phone,
          reason: "Съвпада телефонът",
        })),
      };
    }

    if (input.customerResolution?.startsWith("link:")) {
      customerId = input.customerResolution.replace("link:", "");
      auditEventType = "customer_manually_linked";
    }

    if (!customerId) {
      const { data: createdCustomer, error: createCustomerError } = await supabase
        .from("customers")
        .insert({
          full_name: input.fullName.trim(),
          normalized_phone: normalizedPhone,
          display_phone: input.phoneNumber.trim(),
        })
        .select("id")
        .single();

      if (createCustomerError || !createdCustomer) {
        return {
          type: "error",
          message: mapErrorMessage(createCustomerError, "Не успяхме да създадем клиент."),
        };
      }

      customerId = createdCustomer.id;
    }
  }

  if (!customerId) {
    return {
      type: "error",
      message: "Не успяхме да определим клиент за приемането.",
    };
  }

  let intakeId: string | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const intakeNumber = await getNextIntakeNumber(supabase);
    const { data: createdIntake, error: createIntakeError } = await supabase
      .from("intakes")
      .insert({
        customer_id: customerId,
        intake_number: intakeNumber,
        scan_token: scanToken,
        brand: input.brand.trim(),
        model: input.model.trim(),
        issue_description: input.issueDescription.trim(),
        notes: input.notes?.trim() || null,
        is_archived: false,
        charged_amount: input.chargedAmount ?? null,
      })
      .select("id")
      .single();

    if (!createIntakeError && createdIntake) {
      intakeId = createdIntake.id;
      break;
    }

    if (createIntakeError?.code === "23505" && createIntakeError.message.includes("scan_token")) {
      const { data: duplicateIntake } = await supabase
        .from("intakes")
        .select("id")
        .eq("scan_token", scanToken)
        .maybeSingle();

      if (duplicateIntake?.id) {
        return {
          type: "success",
          intakeId: duplicateIntake.id,
          printJobQueued: true,
        };
      }
    }

    if (createIntakeError?.code === "23505" && createIntakeError.message.includes("intake_number")) {
      continue;
    }

    return {
      type: "error",
      message: mapErrorMessage(createIntakeError, "Не успяхме да запазим приемането."),
    };
  }

  if (!intakeId) {
    return {
      type: "error",
      message: "Не успяхме да генерираме уникален номер за приемане.",
    };
  }

  const { error: printJobError } = await supabase.from("print_jobs").insert({
    intake_id: intakeId,
    label_asset_url: getAbsoluteUrl(`/api/labels/${scanToken}`),
    status: "queued",
    attempt_count: 0,
  });

  await insertAuditEvent({
    entity_type: "intake",
    entity_id: intakeId,
    event_type: "intake_created",
    actor_id: input.actorId,
    payload: {
      customer_id: customerId,
      scan_token: scanToken,
    },
  });

  await insertAuditEvent({
    entity_type: "customer",
    entity_id: customerId,
    event_type: auditEventType,
    actor_id: input.actorId,
    payload: {
      intake_id: intakeId,
    },
  });

  if (printJobError) {
    await insertAuditEvent({
      entity_type: "intake",
      entity_id: intakeId,
      event_type: "print_job_create_failed",
      actor_id: input.actorId,
      payload: {
        message: printJobError.message,
      },
    });
  }

  return {
    type: "success",
    intakeId,
    printJobQueued: !printJobError,
  };
}

export async function saveChargedAmount(input: {
  actorId: string;
  intakeId: string;
  chargedAmount: number;
}): Promise<SaveChargedAmountResult> {
  const supabase = getSupabaseAdminClient();
  const { data: existingIntake, error: existingIntakeError } = await supabase
    .from("intakes")
    .select("id, charged_amount")
    .eq("id", input.intakeId)
    .maybeSingle();

  if (existingIntakeError || !existingIntake) {
    return {
      type: "error",
      message: mapErrorMessage(existingIntakeError, "Не успяхме да намерим приемането."),
    };
  }

  const { error: updateError } = await supabase
    .from("intakes")
    .update({
      charged_amount: input.chargedAmount,
    })
    .eq("id", input.intakeId);

  if (updateError) {
    return {
      type: "error",
      message: mapErrorMessage(updateError, "Не успяхме да запазим сумата."),
    };
  }

  await insertAuditEvent({
    entity_type: "intake",
    entity_id: input.intakeId,
    event_type: "charged_amount_saved",
    actor_id: input.actorId,
    payload: {
      previous_amount: existingIntake.charged_amount,
      charged_amount: input.chargedAmount,
    },
  });

  return {
    type: "success",
  };
}

export type SaveCoffeeCountResult =
  | { type: "success" }
  | { type: "error"; message: string };

export async function saveCoffeeCount(input: {
  actorId: string;
  intakeId: string;
  coffeeCount: number;
}): Promise<SaveCoffeeCountResult> {
  const supabase = getSupabaseAdminClient();
  const { data: existingIntake, error: existingIntakeError } = await supabase
    .from("intakes")
    .select("id, coffee_count")
    .eq("id", input.intakeId)
    .maybeSingle();

  if (existingIntakeError || !existingIntake) {
    return {
      type: "error",
      message: mapErrorMessage(existingIntakeError, "Не успяхме да намерим приемането."),
    };
  }

  const { error: updateError } = await supabase
    .from("intakes")
    .update({
      coffee_count: input.coffeeCount,
    })
    .eq("id", input.intakeId);

  if (updateError) {
    return {
      type: "error",
      message: mapErrorMessage(updateError, "Не успяхме да запазим броя кафета."),
    };
  }

  await insertAuditEvent({
    entity_type: "intake",
    entity_id: input.intakeId,
    event_type: "coffee_count_saved",
    actor_id: input.actorId,
    payload: {
      previous_coffee_count: existingIntake.coffee_count,
      coffee_count: input.coffeeCount,
    },
  });

  return {
    type: "success",
  };
}

export async function updateIntake(input: {
  actorId: string;
  intakeId: string;
  fullName: string;
  phoneNumber: string;
  brand: string;
  model: string;
  issueDescription: string;
}): Promise<UpdateIntakeResult> {
  const supabase = getSupabaseAdminClient();
  const normalizedPhone = normalizePhoneNumber(input.phoneNumber);

  if (!normalizedPhone) {
    return {
      type: "error",
      message: "Въведи валиден телефонен номер (само цифри).",
    };
  }

  const { data: existingIntake, error: existingIntakeError } = await supabase
    .from("intakes")
    .select("id, customer_id, brand, model, issue_description")
    .eq("id", input.intakeId)
    .maybeSingle();

  if (existingIntakeError || !existingIntake) {
    return {
      type: "error",
      message: mapErrorMessage(existingIntakeError, "Не успяхме да намерим приемането."),
    };
  }

  const { data: existingCustomer, error: existingCustomerError } = await supabase
    .from("customers")
    .select("id, full_name, display_phone, normalized_phone")
    .eq("id", existingIntake.customer_id)
    .maybeSingle();

  if (existingCustomerError || !existingCustomer) {
    return {
      type: "error",
      message: mapErrorMessage(existingCustomerError, "Не успяхме да намерим клиента."),
    };
  }

  const { error: customerUpdateError } = await supabase
    .from("customers")
    .update({
      full_name: input.fullName.trim(),
      display_phone: input.phoneNumber.trim(),
      normalized_phone: normalizedPhone,
    })
    .eq("id", existingCustomer.id);

  if (customerUpdateError) {
    return {
      type: "error",
      message: mapErrorMessage(customerUpdateError, "Не успяхме да обновим клиента."),
    };
  }

  const { error: intakeUpdateError } = await supabase
    .from("intakes")
    .update({
      brand: input.brand.trim(),
      model: input.model.trim(),
      issue_description: input.issueDescription.trim(),
    })
    .eq("id", input.intakeId);

  if (intakeUpdateError) {
    return {
      type: "error",
      message: mapErrorMessage(intakeUpdateError, "Не успяхме да обновим приемането."),
    };
  }

  await insertAuditEvent({
    entity_type: "intake",
    entity_id: input.intakeId,
    event_type: "intake_edited",
    actor_id: input.actorId,
    payload: {
      previous_brand: existingIntake.brand,
      previous_model: existingIntake.model,
      previous_issue_description: existingIntake.issue_description,
      brand: input.brand,
      model: input.model,
      issue_description: input.issueDescription,
    },
  });

  await insertAuditEvent({
    entity_type: "customer",
    entity_id: existingCustomer.id,
    event_type: "customer_identity_updated",
    actor_id: input.actorId,
    payload: {
      previous_full_name: existingCustomer.full_name,
      previous_display_phone: existingCustomer.display_phone,
      full_name: input.fullName,
      display_phone: input.phoneNumber,
    },
  });

  return {
    type: "success",
  };
}

export type ReprintResult =
  | { type: "success"; printJobId: string }
  | { type: "error"; message: string };

export async function requeuePrintJob(input: {
  actorId: string;
  intakeId: string;
}): Promise<ReprintResult> {
  const supabase = getSupabaseAdminClient();

  const { data: intake, error: intakeError } = await supabase
    .from("intakes")
    .select("id, scan_token")
    .eq("id", input.intakeId)
    .maybeSingle();

  if (intakeError || !intake) {
    return {
      type: "error",
      message: mapErrorMessage(intakeError, "Не успяхме да намерим приемането."),
    };
  }

  const { data: newJob, error: insertError } = await supabase
    .from("print_jobs")
    .insert({
      intake_id: input.intakeId,
      label_asset_url: getAbsoluteUrl(`/api/labels/${intake.scan_token}`),
      status: "queued",
      attempt_count: 0,
    })
    .select("id")
    .single();

  if (insertError || !newJob) {
    return {
      type: "error",
      message: mapErrorMessage(insertError, "Не успяхме да добавим задача за печат."),
    };
  }

  await insertAuditEvent({
    entity_type: "intake",
    entity_id: input.intakeId,
    event_type: "print_job_requeued",
    actor_id: input.actorId,
    payload: { print_job_id: newJob.id },
  });

  return { type: "success", printJobId: newJob.id };
}

export async function archiveIntake(input: {
  actorId: string;
  intakeId: string;
  chargedAmount?: number;
}): Promise<ArchiveIntakeResult> {
  const supabase = getSupabaseAdminClient();
  const { data: existingIntake, error: existingIntakeError } = await supabase
    .from("intakes")
    .select("id, is_archived, charged_amount")
    .eq("id", input.intakeId)
    .maybeSingle();

  if (existingIntakeError || !existingIntake) {
    return {
      type: "error",
      message: mapErrorMessage(existingIntakeError, "Не успяхме да намерим приемането."),
    };
  }

  if (existingIntake.is_archived) {
    return {
      type: "success",
      alreadyArchived: true,
    };
  }

  const chargedAmount = input.chargedAmount ?? (existingIntake.charged_amount ? Number(existingIntake.charged_amount) : null);

  const archivedAt = new Date().toISOString();
  const { error: archiveError } = await supabase
    .from("intakes")
    .update({
      is_archived: true,
      ...(chargedAmount !== null && Number.isFinite(chargedAmount) ? { charged_amount: chargedAmount } : {}),
      archived_at: archivedAt,
    })
    .eq("id", input.intakeId)
    .eq("is_archived", false);

  if (archiveError) {
    return {
      type: "error",
      message: mapErrorMessage(archiveError, "Не успяхме да архивираме приемането."),
    };
  }

  await insertAuditEvent({
    entity_type: "intake",
    entity_id: input.intakeId,
    event_type: "intake_archived",
    actor_id: input.actorId,
    payload: {
      charged_amount: chargedAmount,
      archived_at: archivedAt,
    },
  });

  return {
    type: "success",
    alreadyArchived: false,
  };
}
