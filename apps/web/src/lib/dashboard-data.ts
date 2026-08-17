import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";

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
  intakeType: string;
  customerName: string;
  customerPhone: string;
  brand: string;
  model: string;
  createdAt: string;
  createdAtLabel: string;
  archivedAt: string | null;
  archivedAtLabel: string | null;
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
      return "Queued";
    case "printing":
      return "Printing";
    case "printed":
      return "Printed";
    case "failed":
      return "Print error";
    default:
      return "No job";
  }
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
  const dayFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "short" });

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

  const dayLabel = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
  const dayShortLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long" });
  const monthShortLabel = new Intl.DateTimeFormat("en-GB", { month: "short" });

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
      title: "Last 7 days",
      description: "Tracks the daily rhythm of new intakes.",
      total: intakeDates.filter((date) => date >= dailyStarts[0]!).length,
      points: countInRange(dailyStarts, (start) => addDays(start, 1), (start) => ({
        label: dayShortLabel.format(start),
        shortLabel: dayLabel.format(start),
      })),
    },
    weekly: {
      title: "Last 8 weeks",
      description: "A good view of weekly workload.",
      total: intakeDates.filter((date) => date >= weeklyStarts[0]!).length,
      points: countInRange(weeklyStarts, (start) => addDays(start, 7), (start) => ({
        label: formatWeekRange(start),
        shortLabel: `${start.getDate()}`,
      })),
    },
    monthly: {
      title: "Last 6 months",
      description: "Shows whether volume is growing or shrinking month over month.",
      total: intakeDates.filter((date) => date >= monthlyStarts[0]!).length,
      points: countInRange(monthlyStarts, (start) => addMonths(start, 1), (start) => ({
        label: `${monthLabel.format(start)} ${start.getFullYear()}`,
        shortLabel: monthShortLabel.format(start),
      })),
    },
    yearly: {
      title: "Last 5 years",
      description: "Useful for overall seasonality and the long horizon.",
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
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const { data } = await supabase
    .from("intakes")
    .select("created_at")
    .eq("intake_type", "service")
    .gte("created_at", fiveYearsAgo.toISOString())
    .order("created_at", { ascending: true });
  const createdAtValues = ((data as Array<{ created_at: string }> | null) ?? []).map((item) => item.created_at);

  return buildTrendPoints(createdAtValues);
}

type IntakeDirectoryRpcRow = {
  id: string;
  customer_id: string;
  intake_number: string;
  intake_type: string;
  brand: string;
  model: string;
  is_archived: boolean;
  charged_amount: string | null;
  created_at: string;
  archived_at: string | null;
  customer_full_name: string | null;
  customer_display_phone: string | null;
  latest_print_status: string | null;
  customer_visit_count: number;
  total_count: number;
};

export const INTAKE_DIRECTORY_PAGE_SIZE = 50;

export async function getIntakeDirectory(options: {
  intakeType: "service" | "sale";
  includeArchived?: boolean;
  archivedOnly?: boolean;
  page?: number;
}): Promise<{ items: IntakeDirectoryItem[]; totalCount: number }> {
  const page = Math.max(1, options.page ?? 1);
  const offset = (page - 1) * INTAKE_DIRECTORY_PAGE_SIZE;
  const supabase = getSupabaseAdminClient();

  const { data } = await supabase.rpc("get_intake_directory", {
    p_limit: INTAKE_DIRECTORY_PAGE_SIZE,
    p_offset: offset,
    p_archived_only: options.archivedOnly ?? false,
    p_include_archived: options.includeArchived ?? false,
    p_intake_type: options.intakeType,
  });

  const rows = (data as IntakeDirectoryRpcRow[] | null) ?? [];
  const totalCount = rows[0]?.total_count ? Number(rows[0].total_count) : 0;

  return {
    totalCount,
    items: rows.map((row) => ({
      id: row.id,
      intakeNumber: row.intake_number,
      intakeType: row.intake_type,
      customerName: row.customer_full_name ?? "Unknown customer",
      customerPhone: row.customer_display_phone ?? "No phone",
      brand: row.brand,
      model: row.model,
      createdAt: row.created_at,
      createdAtLabel: formatDateTime(row.created_at),
      archivedAt: row.archived_at ?? null,
      archivedAtLabel: row.archived_at ? formatDateTime(row.archived_at) : null,
      isArchived: row.is_archived,
      printStatus: getPrintStatusLabel(row.latest_print_status ?? undefined),
      chargedAmountLabel: row.charged_amount ? String(Math.round(Number(row.charged_amount))) : undefined,
      chargedAmountValue: row.charged_amount ?? undefined,
      customerVisitCount: Number(row.customer_visit_count ?? 1),
    } satisfies IntakeDirectoryItem)),
  };
}

export async function getPrintQueueData(limit = 30) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("print_jobs")
    .select(`
      id, intake_id, label_asset_url, status, attempt_count, last_error, created_at, updated_at, printed_at,
      intakes ( intake_number, customers ( full_name, display_phone ) )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  type PrintJobWithRelations = PrintJobRow & {
    intakes: {
      intake_number: string;
      customers: { full_name: string; display_phone: string } | null;
    } | null;
  };

  const jobs = (data as PrintJobWithRelations[] | null) ?? [];
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

  const items = jobs.map((job) => ({
    id: job.id,
    intakeId: job.intake_id,
    intakeNumber: job.intakes?.intake_number ?? "No number",
    customerName: job.intakes?.customers?.full_name ?? "Unknown customer",
    customerPhone: job.intakes?.customers?.display_phone ?? "No phone",
    status: getPrintStatusLabel(job.status),
    createdAtLabel: formatDateTime(job.created_at),
    updatedAtLabel: formatDateTime(job.updated_at),
    printedAtLabel: job.printed_at ? formatDateTime(job.printed_at) : null,
    attemptCount: job.attempt_count,
    lastError: job.last_error,
    labelAssetUrl: job.label_asset_url,
  }));

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
