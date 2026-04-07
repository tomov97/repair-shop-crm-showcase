export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

export type SearchResult = {
  id: string;
  intakeNumber: string;
  customerName: string;
  customerPhone: string;
  brand: string;
  model: string;
  createdAtLabel: string;
  isArchived: boolean;
};

/** Escape PostgREST ilike wildcards to prevent unintended matches. */
function escapeIlike(value: string) {
  return value.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Strip all non-digit characters from a string for loose phone matching.
 * "087 661 75 61" → "0876617561", "+359 876 617 561" → "359876617561"
 */
function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * Try to parse a Bulgarian-style date query into a UTC date range.
 * Accepts:  "23.03"  → year = current year (or previous if future)
 *           "23.03.25" / "23.03.2025" → explicit year
 * Returns { from: ISO string, to: ISO string } for a [startOfDay, endOfDay] range,
 * or null if the input doesn't look like a date.
 */
function parseDateQuery(q: string): { from: string; to: string } | null {
  // Match DD.MM, DD.MM.YY, DD.MM.YYYY
  const match = q.trim().match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/);
  if (!match) return null;

  const day = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10) - 1; // 0-indexed
  let year: number;

  if (match[3]) {
    const raw = parseInt(match[3], 10);
    year = raw < 100 ? 2000 + raw : raw;
  } else {
    // No year given — use current year; if the date is in the future, roll back one year
    const now = new Date();
    year = now.getFullYear();
    const candidate = new Date(year, month, day);
    if (candidate > now) {
      year -= 1;
    }
  }

  if (day < 1 || day > 31 || month < 0 || month > 11) return null;

  const from = new Date(year, month, day, 0, 0, 0, 0);
  const to = new Date(year, month, day, 23, 59, 59, 999);

  if (Number.isNaN(from.getTime())) return null;

  return { from: from.toISOString(), to: to.toISOString() };
}

export async function GET(request: Request) {
  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!checkRateLimit(`search:${user.id}`, 60, 60 * 1000)) {
    return new Response("Too many requests", { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q") ?? "";
  const q = raw.trim();

  if (q.length < 2) {
    return Response.json([], { headers: { "Cache-Control": "no-store" } });
  }

  const adminClient = getSupabaseAdminClient();
  const escaped = escapeIlike(q);
  const digits = digitsOnly(q);

  // ── Date query path ────────────────────────────────────────────────────────
  const dateRange = parseDateQuery(q);
  if (dateRange) {
    const { data: dateIntakes } = await adminClient
      .from("intakes")
      .select("id, customer_id, intake_number, brand, model, is_archived, created_at")
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to)
      .order("created_at", { ascending: false })
      .limit(8);

    const intakes = dateIntakes ?? [];
    if (intakes.length === 0) {
      return Response.json([], { headers: { "Cache-Control": "no-store" } });
    }

    const uniqueCustomerIds = [...new Set(intakes.map((i) => i.customer_id))];
    const { data: customers } = await adminClient
      .from("customers")
      .select("id, full_name, display_phone")
      .in("id", uniqueCustomerIds);
    const customerMap = new Map((customers ?? []).map((c) => [c.id, c]));

    const results: SearchResult[] = intakes.map((intake) => {
      const customer = customerMap.get(intake.customer_id);
      return {
        id: intake.id,
        intakeNumber: intake.intake_number,
        customerName: customer?.full_name ?? "—",
        customerPhone: customer?.display_phone ?? "—",
        brand: intake.brand,
        model: intake.model,
        createdAtLabel: formatDate(intake.created_at),
        isArchived: intake.is_archived,
      };
    });

    return Response.json(results, { headers: { "Cache-Control": "no-store" } });
  }

  // ── General text + phone search path ──────────────────────────────────────

  // Customer search: name (ilike) + phone as substring on both display_phone and normalized_phone.
  // We do NOT call normalizePhoneNumber() here — that produces a full E.164 number which won't
  // match mid-sequence. Instead we use digitsOnly() to strip formatting and search the raw digits
  // as a substring in normalized_phone, and search q directly in display_phone.
  const customerOrParts = [`full_name.ilike.%${escaped}%`, `display_phone.ilike.%${escaped}%`];
  if (digits.length >= 2) {
    customerOrParts.push(`normalized_phone.ilike.%${escapeIlike(digits)}%`);
  }

  const [customerMatchResult, intakeFieldResult] = await Promise.all([
    adminClient.from("customers").select("id").or(customerOrParts.join(",")),
    // Intake field search: intake_number, brand, model, description, notes
    adminClient
      .from("intakes")
      .select("id, customer_id, intake_number, brand, model, is_archived, created_at")
      .or(
        `intake_number.ilike.%${escaped}%,brand.ilike.%${escaped}%,model.ilike.%${escaped}%,issue_description.ilike.%${escaped}%,notes.ilike.%${escaped}%`
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const customerIds = (customerMatchResult.data ?? []).map((c) => c.id);

  // Intakes belonging to matched customers
  let customerIntakeRows: Array<{
    id: string;
    customer_id: string;
    intake_number: string;
    brand: string;
    model: string;
    is_archived: boolean;
    created_at: string;
  }> = [];

  if (customerIds.length > 0) {
    const { data } = await adminClient
      .from("intakes")
      .select("id, customer_id, intake_number, brand, model, is_archived, created_at")
      .in("customer_id", customerIds)
      .order("created_at", { ascending: false })
      .limit(8);
    customerIntakeRows = data ?? [];
  }

  // Merge, deduplicate, sort, cap at 8
  const seen = new Set<string>();
  const merged: typeof customerIntakeRows = [];
  for (const row of [...(intakeFieldResult.data ?? []), ...customerIntakeRows]) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      merged.push(row);
    }
  }
  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const intakes = merged.slice(0, 8);

  if (intakes.length === 0) {
    return Response.json([], { headers: { "Cache-Control": "no-store" } });
  }

  const uniqueCustomerIds = [...new Set(intakes.map((i) => i.customer_id))];
  const { data: customers } = await adminClient
    .from("customers")
    .select("id, full_name, display_phone")
    .in("id", uniqueCustomerIds);
  const customerMap = new Map((customers ?? []).map((c) => [c.id, c]));

  const results: SearchResult[] = intakes.map((intake) => {
    const customer = customerMap.get(intake.customer_id);
    return {
      id: intake.id,
      intakeNumber: intake.intake_number,
      customerName: customer?.full_name ?? "—",
      customerPhone: customer?.display_phone ?? "—",
      brand: intake.brand,
      model: intake.model,
      createdAtLabel: formatDate(intake.created_at),
      isArchived: intake.is_archived,
    };
  });

  return Response.json(results, { headers: { "Cache-Control": "no-store" } });
}
