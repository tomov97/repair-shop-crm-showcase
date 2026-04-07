import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatMoney } from "@/lib/utils";

type CustomerRow = {
  id: string;
  full_name: string;
  display_phone: string;
};

type IntakeRow = {
  id: string;
  customer_id: string;
  intake_number: string;
  brand: string;
  model: string;
  is_archived: boolean;
  charged_amount: string | null;
  created_at: string;
};

type PrintJobRow = {
  id: string;
  intake_id: string;
  label_asset_url: string;
  status: "queued" | "printing" | "printed" | "failed";
  attempt_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  printed_at: string | null;
};

export type IntakeTrendRange = "daily" | "weekly" | "monthly" | "yearly";

export type IntakeTrendPoint = {
  label: string;
  shortLabel: string;
  value: number;
};

export type IntakeTrendSeries = Record<
  IntakeTrendRange,
  {
    title: string;
    description: string;
    total: number;
    points: IntakeTrendPoint[];
  }
>;

export type IntakeDirectoryItem = {
  id: string;
  intakeNumber: string;
  customerName: string;
  customerPhone: string;
  brand: string;
  model: string;
  createdAt: string;
  createdAtLabel: string;
  isArchived: boolean;
  printStatus: string;
  chargedAmountLabel?: string;
  chargedAmountValue?: string;
  customerVisitCount?: number;
};

export type PrintQueueSummary = {
  queued: number;
  failed: number;
  printed: number;
  total: number;
};

export type PrintQueueItem = {
  id: string;
  intakeId: string;
  intakeNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  printedAtLabel: string | null;
  attemptCount: number;
  lastError: string | null;
  labelAssetUrl: string;
};

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

async function getCustomersByIds(customerIds: string[]) {
  if (customerIds.length === 0) {
    return new Map<string, CustomerRow>();
  }

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("customers")
    .select("id, full_name, display_phone")
    .in("id", customerIds);

  return new Map<string, CustomerRow>((data as CustomerRow[] | null)?.map((customer) => [customer.id, customer]) ?? []);
}

async function getLatestPrintJobs(intakeIds: string[]) {
  if (intakeIds.length === 0) {
    return new Map<string, PrintJobRow>();
  }

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("print_jobs")
    .select("id, intake_id, label_asset_url, status, attempt_count, last_error, created_at, updated_at, printed_at")
    .in("intake_id", intakeIds)
    .order("created_at", { ascending: false });

  const latestByIntake = new Map<string, PrintJobRow>();

  for (const job of (data as PrintJobRow[] | null) ?? []) {
    if (!latestByIntake.has(job.intake_id)) {
      latestByIntake.set(job.intake_id, job);
    }
  }

  return latestByIntake;
}

async function getCustomerIntakeCounts(customerIds: string[]) {
  if (customerIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.from("intakes").select("customer_id").in("customer_id", customerIds);
  const counts = new Map<string, number>();

  for (const item of (data as Array<{ customer_id: string }> | null) ?? []) {
    counts.set(item.customer_id, (counts.get(item.customer_id) ?? 0) + 1);
  }

  return counts;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff));
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addYears(date: Date, amount: number) {
  return new Date(date.getFullYear() + amount, 0, 1);
}

function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const dayFormatter = new Intl.DateTimeFormat("bg-BG", { day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat("bg-BG", { month: "short" });

  if (sameMonth) {
    return `${dayFormatter.format(start)}-${dayFormatter.format(end)} ${monthFormatter.format(start)}`;
  }

  return `${dayFormatter.format(start)} ${monthFormatter.format(start)}-${dayFormatter.format(end)} ${monthFormatter.format(end)}`;
}

function buildTrendPoints(createdAtValues: string[]) {
  const now = new Date();
  const intakeDates = createdAtValues.map((value) => new Date(value));

  const dailyStarts = Array.from({ length: 7 }, (_, index) => addDays(startOfDay(now), index - 6));
  const weeklyStarts = Array.from({ length: 8 }, (_, index) => addDays(startOfWeek(now), (index - 7) * 7));
  const monthlyStarts = Array.from({ length: 6 }, (_, index) => addMonths(startOfMonth(now), index - 5));
  const yearlyStarts = Array.from({ length: 5 }, (_, index) => addYears(startOfYear(now), index - 4));

  const dayLabel = new Intl.DateTimeFormat("bg-BG", { weekday: "short" });
  const dayShortLabel = new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "short" });
  const monthLabel = new Intl.DateTimeFormat("bg-BG", { month: "long" });
  const monthShortLabel = new Intl.DateTimeFormat("bg-BG", { month: "short" });

  const countInRange = (
    starts: Date[],
    getNextStart: (start: Date) => Date,
    label: (start: Date) => Omit<IntakeTrendPoint, "value">,
  ) =>
    starts.map((start) => {
      const end = getNextStart(start);
      const value = intakeDates.filter((date) => date >= start && date < end).length;
      return {
        ...label(start),
        value,
      };
    });

  return {
    daily: {
      title: "Последните 7 дни",
      description: "Проследяване на дневния ритъм на новите приемания.",
      total: intakeDates.filter((date) => date >= dailyStarts[0]!).length,
      points: countInRange(dailyStarts, (start) => addDays(start, 1), (start) => ({
        label: dayShortLabel.format(start),
        shortLabel: dayLabel.format(start),
      })),
    },
    weekly: {
      title: "Последните 8 седмици",
      description: "Добър изглед за натоварването по седмици.",
      total: intakeDates.filter((date) => date >= weeklyStarts[0]!).length,
      points: countInRange(weeklyStarts, (start) => addDays(start, 7), (start) => ({
        label: formatWeekRange(start),
        shortLabel: `${start.getDate()}`,
      })),
    },
    monthly: {
      title: "Последните 6 месеца",
      description: "Показва дали потокът расте или спада по месеци.",
      total: intakeDates.filter((date) => date >= monthlyStarts[0]!).length,
      points: countInRange(monthlyStarts, (start) => addMonths(start, 1), (start) => ({
        label: `${monthLabel.format(start)} ${start.getFullYear()}`,
        shortLabel: monthShortLabel.format(start),
      })),
    },
    yearly: {
      title: "Последните 5 години",
      description: "Полезно за обща сезонност и дълъг хоризонт.",
      total: intakeDates.filter((date) => date >= yearlyStarts[0]!).length,
      points: countInRange(yearlyStarts, (start) => addYears(start, 1), (start) => ({
        label: `${start.getFullYear()}`,
        shortLabel: `${start.getFullYear()}`,
      })),
    },
  } satisfies IntakeTrendSeries;
}

export async function getIntakeTrendSeries() {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.from("intakes").select("created_at").order("created_at", { ascending: true });
  const createdAtValues = ((data as Array<{ created_at: string }> | null) ?? []).map((item) => item.created_at);

  return buildTrendPoints(createdAtValues);
}

export async function getIntakeDirectory(options?: { includeArchived?: boolean; limit?: number }) {
  const includeArchived = options?.includeArchived ?? true;
  const limit = options?.limit ?? 30;
  const supabase = getSupabaseAdminClient();

  let query = supabase
    .from("intakes")
    .select("id, customer_id, intake_number, brand, model, is_archived, charged_amount, created_at")
    .order("is_archived", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data } = await query;
  const intakes = (data as IntakeRow[] | null) ?? [];
  const customers = await getCustomersByIds(intakes.map((intake) => intake.customer_id));
  const latestPrintJobs = await getLatestPrintJobs(intakes.map((intake) => intake.id));
  const customerIntakeCounts = await getCustomerIntakeCounts(intakes.map((intake) => intake.customer_id));

  return intakes.map((intake) => {
    const customer = customers.get(intake.customer_id);
    const latestPrintJob = latestPrintJobs.get(intake.id);

    return {
      id: intake.id,
      intakeNumber: intake.intake_number,
      customerName: customer?.full_name ?? "Неизвестен клиент",
      customerPhone: customer?.display_phone ?? "Няма телефон",
      brand: intake.brand,
      model: intake.model,
      createdAt: intake.created_at,
      createdAtLabel: formatDateTime(intake.created_at),
      isArchived: intake.is_archived,
      printStatus: getPrintStatusLabel(latestPrintJob?.status),
      chargedAmountLabel: intake.charged_amount ? String(Math.round(Number(intake.charged_amount))) : undefined,
      chargedAmountValue: intake.charged_amount ?? undefined,
      customerVisitCount: customerIntakeCounts.get(intake.customer_id) ?? 1,
    } satisfies IntakeDirectoryItem;
  });
}

export async function getPrintQueueData(limit = 30) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("print_jobs")
    .select("id, intake_id, label_asset_url, status, attempt_count, last_error, created_at, updated_at, printed_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  const jobs = (data as PrintJobRow[] | null) ?? [];
  if (jobs.length === 0) {
    return {
      summary: {
        queued: 0,
        failed: 0,
        printed: 0,
        total: 0,
      },
      items: [] satisfies PrintQueueItem[],
    };
  }

  const intakeIds = Array.from(new Set(jobs.map((job) => job.intake_id)));
  const { data: intakesData } = await supabase
    .from("intakes")
    .select("id, customer_id, intake_number")
    .in("id", intakeIds);

  const intakeById = new Map<
    string,
    {
      id: string;
      customer_id: string;
      intake_number: string;
    }
  >(((intakesData as Array<{ id: string; customer_id: string; intake_number: string }> | null) ?? []).map((intake) => [intake.id, intake]));

  const customers = await getCustomersByIds(
    Array.from(new Set(((intakesData as Array<{ customer_id: string }> | null) ?? []).map((intake) => intake.customer_id))),
  );

  const summary = jobs.reduce<PrintQueueSummary>(
    (accumulator, job) => {
      accumulator.total += 1;

      if (job.status === "queued" || job.status === "printing") {
        accumulator.queued += 1;
      } else if (job.status === "failed") {
        accumulator.failed += 1;
      } else if (job.status === "printed") {
        accumulator.printed += 1;
      }

      return accumulator;
    },
    {
      queued: 0,
      failed: 0,
      printed: 0,
      total: 0,
    },
  );

  const items = jobs.map((job) => {
    const intake = intakeById.get(job.intake_id);
    const customer = intake ? customers.get(intake.customer_id) : null;

    return {
      id: job.id,
      intakeId: job.intake_id,
      intakeNumber: intake?.intake_number ?? "Няма номер",
      customerName: customer?.full_name ?? "Неизвестен клиент",
      customerPhone: customer?.display_phone ?? "Няма телефон",
      status: getPrintStatusLabel(job.status),
      createdAtLabel: formatDateTime(job.created_at),
      updatedAtLabel: formatDateTime(job.updated_at),
      printedAtLabel: job.printed_at ? formatDateTime(job.printed_at) : null,
      attemptCount: job.attempt_count,
      lastError: job.last_error,
      labelAssetUrl: job.label_asset_url,
    } satisfies PrintQueueItem;
  });

  return { summary, items };
}

export async function getPrintAttentionCount() {
  const supabase = getSupabaseAdminClient();
  const { count } = await supabase
    .from("print_jobs")
    .select("id", { count: "exact", head: true })
    .in("status", ["queued", "printing", "failed"]);

  return count ?? 0;
}
