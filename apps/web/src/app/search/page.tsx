import { AppShell } from "@/components/dashboard/app-shell";
import { IntakeDirectoryView } from "@/components/dashboard/intake-directory-view";
import { SearchBar } from "@/components/dashboard/search-bar";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, normalizePhoneNumber } from "@/lib/utils";
import type { IntakeDirectoryItem } from "@/lib/dashboard-data";

function escapeIlike(value: string) {
  return value.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function parseDateQuery(q: string): { from: string; to: string } | null {
  const match = q.trim().match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/);
  if (!match) return null;

  const day = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10) - 1;
  let year: number;

  if (match[3]) {
    const raw = parseInt(match[3], 10);
    year = raw < 100 ? 2000 + raw : raw;
  } else {
    const now = new Date();
    year = now.getFullYear();
    if (new Date(year, month, day) > now) year -= 1;
  }

  if (day < 1 || day > 31 || month < 0 || month > 11) return null;

  const from = new Date(year, month, day, 0, 0, 0, 0);
  const to = new Date(year, month, day, 23, 59, 59, 999);

  if (Number.isNaN(from.getTime())) return null;
  return { from: from.toISOString(), to: to.toISOString() };
}

async function searchIntakes(q: string): Promise<IntakeDirectoryItem[]> {
  const adminClient = getSupabaseAdminClient();
  const escaped = escapeIlike(q);
  const digits = digitsOnly(q);

  let intakeRows: Array<{
    id: string;
    customer_id: string;
    intake_number: string;
    brand: string;
    model: string;
    is_archived: boolean;
    created_at: string;
  }> = [];

  const dateRange = parseDateQuery(q);

  if (dateRange) {
    const { data } = await adminClient
      .from("intakes")
      .select("id, customer_id, intake_number, brand, model, is_archived, created_at, archived_at")
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to)
      .order("created_at", { ascending: false })
      .limit(100);
    intakeRows = data ?? [];
  } else {
    const customerOrParts = [
      `full_name.ilike.%${escaped}%`,
      `display_phone.ilike.%${escaped}%`,
    ];
    if (digits.length >= 2) {
      customerOrParts.push(`normalized_phone.ilike.%${escapeIlike(digits)}%`);
    }

    const [customerResult, intakeFieldResult] = await Promise.all([
      adminClient.from("customers").select("id").or(customerOrParts.join(",")),
      adminClient
        .from("intakes")
        .select("id, customer_id, intake_number, brand, model, is_archived, created_at, archived_at")
        .or(
          `intake_number.ilike.%${escaped}%,brand.ilike.%${escaped}%,model.ilike.%${escaped}%,issue_description.ilike.%${escaped}%,notes.ilike.%${escaped}%`
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const customerIds = (customerResult.data ?? []).map((c) => c.id);
    let customerIntakes: typeof intakeRows = [];
    if (customerIds.length > 0) {
      const { data } = await adminClient
        .from("intakes")
        .select("id, customer_id, intake_number, brand, model, is_archived, created_at, archived_at")
        .in("customer_id", customerIds)
        .order("created_at", { ascending: false })
        .limit(100);
      customerIntakes = data ?? [];
    }

    const seen = new Set<string>();
    for (const row of [...(intakeFieldResult.data ?? []), ...customerIntakes]) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        intakeRows.push(row);
      }
    }
    intakeRows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (intakeRows.length === 0) return [];

  const uniqueCustomerIds = [...new Set(intakeRows.map((i) => i.customer_id))];
  const { data: customers } = await adminClient
    .from("customers")
    .select("id, full_name, display_phone")
    .in("id", uniqueCustomerIds);
  const customerMap = new Map((customers ?? []).map((c) => [c.id, c]));

  return intakeRows.map((intake) => {
    const customer = customerMap.get(intake.customer_id);
    return {
      id: intake.id,
      intakeNumber: intake.intake_number,
      customerName: customer?.full_name ?? "Неизвестен клиент",
      customerPhone: customer?.display_phone ?? "Няма телефон",
      brand: intake.brand,
      model: intake.model,
      createdAt: intake.created_at,
      createdAtLabel: formatDate(intake.created_at),
      archivedAt: (intake as { archived_at?: string | null }).archived_at ?? null,
      archivedAtLabel: (intake as { archived_at?: string | null }).archived_at
        ? formatDateTime((intake as { archived_at?: string | null }).archived_at!)
        : null,
      isArchived: intake.is_archived,
      printStatus: "",
      customerVisitCount: 1,
    } satisfies IntakeDirectoryItem;
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const user = await getCurrentUser();
  const { q = "" } = await searchParams;
  const trimmed = q.trim();

  const items = trimmed.length >= 2 ? await searchIntakes(trimmed) : [];

  return (
    <AppShell activePath="" userEmail={user?.email}>
      <section>
        <article className="rounded-[1.75rem] bg-surface-strong px-5 py-4 text-white shadow-[0_24px_80px_rgba(35,68,63,0.16)] sm:px-6">
          <div className="flex flex-row items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight leading-tight">Резултати от търсене</h1>
            </div>
            <div className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm shrink-0">
              {items.length}
            </div>
          </div>
          <div className="mt-3">
            <SearchBar variant="page" initialQuery={trimmed} />
          </div>
        </article>
      </section>

      <section className="mt-6">
        {trimmed.length < 2 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Въведете поне 2 символа за търсене.
          </div>
        ) : (
          <IntakeDirectoryView
            items={items}
            emptyMessage={`Няма резултати за „${trimmed}".`}
            returnTo={`/search?q=${encodeURIComponent(trimmed)}`}
          />
        )}
      </section>
    </AppShell>
  );
}
