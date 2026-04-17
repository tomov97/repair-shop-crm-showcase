"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { IntakeDirectoryItem } from "@/lib/dashboard-data";
import { ArchiveIntakeForm } from "@/components/intakes/archive-intake-form";
import { PricePopout } from "@/components/intakes/price-popout";
import { StatusPill } from "@/components/dashboard/cards";

// ── Date helpers ──────────────────────────────────────────────────────────────

function toLocalDateKey(iso: string) {
  const d = new Date(iso);
  // "YYYY-MM-DD" in local time
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayHeading(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year!, month! - 1, day!);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  const todayKey = toLocalDateKey(today.toISOString());
  const yesterdayKey = toLocalDateKey(yesterday.toISOString());

  if (dateKey === todayKey) return "Днес";
  if (dateKey === yesterdayKey) return "Вчера";

  return new Intl.DateTimeFormat("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d).replace(/\s*г\.$/, "");
}

function formatCardDate(value: string) {
  // value is already formatted as "DD.MM.YYYY HH:mm" — just strip the time
  return value.split(" ")[0] ?? value;
}

// ── Controls ──────────────────────────────────────────────────────────────────

type SortOrder = "newest" | "oldest";

function SortControls({
  sort,
  onSort,
}: {
  sort: SortOrder;
  onSort: (s: SortOrder) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-[#e8e4d4] bg-white p-1 shadow-sm">
      {(["newest", "oldest"] as SortOrder[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSort(option)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            sort === option
              ? "bg-[#23443f] text-white shadow-sm"
              : "text-[#23443f]/70 hover:bg-[#f4f1e5]"
          }`}
        >
          {option === "newest" ? "Най-нови" : "Най-стари"}
        </button>
      ))}
    </div>
  );
}

function DateFilter({
  dateFrom,
  dateTo,
  onDateFrom,
  onDateTo,
  onClear,
}: {
  dateFrom: string;
  dateTo: string;
  onDateFrom: (v: string) => void;
  onDateTo: (v: string) => void;
  onClear: () => void;
}) {
  const hasFilter = dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-[#60726d] font-medium whitespace-nowrap">От:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFrom(e.target.value)}
          className="rounded-xl border border-[#e8e4d4] bg-white px-3 py-1.5 text-sm text-[#23443f] outline-none focus:ring-1 focus:ring-[#23443f]/30 [color-scheme:light]"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-[#60726d] font-medium whitespace-nowrap">До:</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateTo(e.target.value)}
          className="rounded-xl border border-[#e8e4d4] bg-white px-3 py-1.5 text-sm text-[#23443f] outline-none focus:ring-1 focus:ring-[#23443f]/30 [color-scheme:light]"
        />
      </div>
      {hasFilter ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-[#e8e4d4] bg-white px-3 py-1.5 text-sm text-[#922b21] transition hover:bg-[#fdf0ef]"
        >
          Изчисти
        </button>
      ) : null}
    </div>
  );
}

// ── Intake card ───────────────────────────────────────────────────────────────

function IntakeCard({
  intake,
  returnTo,
  displayDateLabel,
}: {
  intake: IntakeDirectoryItem;
  returnTo: string;
  displayDateLabel: string;
}) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/intakes/${intake.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/intakes/${intake.id}`); }}
      className="relative cursor-pointer overflow-hidden rounded-2xl border border-[#e8e4d4] bg-[#fbfaf4] px-4 py-3.5 pl-5 text-[#23443f] shadow-[0_2px_10px_rgba(80,60,20,0.08)] transition hover:brightness-[1.02] active:scale-[0.985] active:brightness-95 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#23443f]"
    >
      {/* Mobile layout */}
      <div className="lg:hidden">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-lg font-semibold leading-snug text-[#23443f]">{intake.customerName}</p>
              {intake.isArchived ? <StatusPill label="Архивиран" archived /> : null}
            </div>
            <p className="mt-0.5 text-sm font-medium text-[#7b6530]">{intake.brand} {intake.model}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {!intake.isArchived && intake.intakeType !== "sale" ? (
              <ArchiveIntakeForm intakeId={intake.id} returnTo={returnTo} iconOnly />
            ) : null}
            <a
              href={`tel:${intake.customerPhone.replace(/\s+/g, "")}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2f8f61]/15 text-[#2f8f61] transition hover:bg-[#2f8f61]/25 active:scale-95"
              title={intake.customerPhone}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <p className="text-sm text-[#23443f]/50">{formatCardDate(displayDateLabel)}</p>
            {(intake.customerVisitCount ?? 1) > 1 ? (
              <span className="inline-flex rounded-full border border-[#e0d1a7] bg-[#fbf3de] px-2 py-[3px] text-[11px] font-medium leading-none text-[#7b6530]">
                Повторен
              </span>
            ) : null}
          </div>
          <PricePopout intakeId={intake.id} returnTo={returnTo} initialValue={intake.chargedAmountValue ?? ""} />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-lg font-semibold text-[#23443f]">{intake.customerName}</p>
            {intake.isArchived ? <StatusPill label="Архивиран" archived /> : null}
          </div>
          <p className="mt-0.5 text-sm font-medium text-[#7b6530]">{intake.brand} {intake.model}</p>
          <p className="mt-0.5 text-sm text-[#23443f]/50">{formatCardDate(displayDateLabel)}</p>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-[#23443f]">{intake.intakeNumber}</p>
          <p className="text-sm text-[#23443f]/60">{formatCardDate(displayDateLabel)}</p>
        </div>
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {(intake.customerVisitCount ?? 1) > 1 ? (
            <span className="inline-flex rounded-full border border-[#e0d1a7] bg-[#fbf3de] px-2.5 py-1 text-xs font-medium leading-none text-[#7b6530]">
              Повторен
            </span>
          ) : null}
          <PricePopout intakeId={intake.id} returnTo={returnTo} initialValue={intake.chargedAmountValue ?? ""} />
          {!intake.isArchived && intake.intakeType !== "sale" ? (
            <ArchiveIntakeForm intakeId={intake.id} returnTo={returnTo} iconOnly />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function IntakeDirectoryView({
  items,
  emptyMessage,
  returnTo,
}: {
  items: IntakeDirectoryItem[];
  emptyMessage: string;
  returnTo: string;
}) {
  const [sort, setSort] = useState<SortOrder>("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // When all items are archived, group/sort/filter by archived date; otherwise use created date.
  const allArchived = items.length > 0 && items.every((item) => item.isArchived);

  const getSortKey = (item: IntakeDirectoryItem) =>
    allArchived && item.archivedAt ? item.archivedAt : item.createdAt;

  const filtered = useMemo(() => {
    let result = [...items];

    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00");
      result = result.filter((item) => new Date(getSortKey(item)) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      result = result.filter((item) => new Date(getSortKey(item)) <= to);
    }

    result.sort((a, b) => {
      const diff = new Date(getSortKey(b)).getTime() - new Date(getSortKey(a)).getTime();
      return sort === "newest" ? diff : -diff;
    });

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sort, dateFrom, dateTo, allArchived]);

  // Group by local calendar day (using archive date for archived views)
  const grouped = useMemo(() => {
    const groups: Array<{ dateKey: string; items: IntakeDirectoryItem[] }> = [];
    for (const item of filtered) {
      const key = toLocalDateKey(getSortKey(item));
      const last = groups[groups.length - 1];
      if (last && last.dateKey === key) {
        last.items.push(item);
      } else {
        groups.push({ dateKey: key, items: [item] });
      }
    }
    return groups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, allArchived]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SortControls sort={sort} onSort={setSort} />
        <DateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFrom={setDateFrom}
          onDateTo={setDateTo}
          onClear={() => { setDateFrom(""); setDateTo(""); }}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          {dateFrom || dateTo ? "Няма приемания за избрания период." : emptyMessage}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.dateKey}>
              {/* Day separator */}
              <div className="mb-3 flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#60726d]">
                  {formatDayHeading(group.dateKey)}
                </p>
                <div className="h-px flex-1 bg-[#e8e4d4]" />
                <span className="rounded-full bg-[#e8e4d4] px-2 py-0.5 text-[11px] font-medium text-[#60726d]">
                  {group.items.length}
                </span>
              </div>
              <div className="space-y-3">
                {group.items.map((intake) => (
                  <IntakeCard
                    key={intake.id}
                    intake={intake}
                    returnTo={returnTo}
                    displayDateLabel={allArchived && intake.archivedAtLabel ? intake.archivedAtLabel : intake.createdAtLabel}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
