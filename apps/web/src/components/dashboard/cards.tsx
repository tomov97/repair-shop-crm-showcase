"use client";

import { useRouter } from "next/navigation";
import type { IntakeDirectoryItem } from "@/lib/dashboard-data";
import { ArchiveIntakeForm } from "@/components/intakes/archive-intake-form";
import { PricePopout } from "@/components/intakes/price-popout";

function formatCardDate(value: string) {
  // value is already formatted as "DD.MM.YYYY HH:mm" — just strip the time
  return value.split(" ")[0] ?? value;
}

export function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-border bg-white/85 p-5 shadow-[0_18px_48px_rgba(20,30,28,0.06)] backdrop-blur">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </article>
  );
}

export function StatusPill({ label, archived = false }: { label: string; archived?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-[2px] text-[10px] font-semibold leading-none ${
        archived
          ? "border-[#f5c6c2] bg-[#fdf0ef] text-[#922b21]"
          : "border-[#c7d9cd] bg-[#edf5ef] text-surface-strong"
      }`}
    >
      {label}
    </span>
  );
}

export function IntakeListCard({
  items,
  emptyMessage,
  returnTo,
}: {
  items: IntakeDirectoryItem[];
  emptyMessage: string;
  returnTo: string;
}) {
  const router = useRouter();

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          {emptyMessage}
        </div>
      ) : (
        items.map((intake) => (
          <div
            key={intake.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/intakes/${intake.id}`)}
            onKeyDown={(e) => { if (e.key === "Enter") router.push(`/intakes/${intake.id}`); }}
            className="relative cursor-pointer overflow-hidden rounded-2xl border border-[#e8e4d4] bg-[#fbfaf4] px-4 py-3.5 pl-5 text-[#23443f] shadow-[0_2px_10px_rgba(80,60,20,0.08)] transition hover:brightness-[1.02] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#23443f]"
          >
            {/* Mobile layout */}
            <div className="lg:hidden">
              {/* Top row: name + buttons */}
              <div className="flex items-start gap-3">
                {/* Left: name, machine, date */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-lg font-semibold leading-snug text-[#23443f]">{intake.customerName}</p>
                    {intake.isArchived ? <StatusPill label="Архивиран" archived /> : null}
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-[#7b6530]">{intake.brand} {intake.model}</p>
                </div>

                {/* Right: side-by-side buttons */}
                <div
                  className="flex shrink-0 items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!intake.isArchived ? (
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

              {/* Bottom row: date + Повторен left, price right */}
              <div
                className="mt-1.5 flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[#23443f]/50">{formatCardDate(intake.createdAtLabel)}</p>
                  {(intake.customerVisitCount ?? 1) > 1 ? (
                    <span className="inline-flex rounded-full border border-[#e0d1a7] bg-[#fbf3de] px-2 py-[3px] text-[11px] font-medium leading-none text-[#7b6530]">
                      Повторен
                    </span>
                  ) : null}
                </div>
                <PricePopout
                  intakeId={intake.id}
                  returnTo={returnTo}
                  initialValue={intake.chargedAmountValue ?? ""}
                />
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
                <p className="mt-0.5 text-sm text-[#23443f]/50">{formatCardDate(intake.createdAtLabel)}</p>
              </div>

              <div className="text-center">
                <p className="text-base font-semibold text-[#23443f]">{intake.intakeNumber}</p>
                <p className="text-sm text-[#23443f]/60">{formatCardDate(intake.createdAtLabel)}</p>
              </div>

              <div
                className="flex items-center justify-end gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {(intake.customerVisitCount ?? 1) > 1 ? (
                  <span className="inline-flex rounded-full border border-[#e0d1a7] bg-[#fbf3de] px-2.5 py-1 text-xs font-medium leading-none text-[#7b6530]">
                    Повторен
                  </span>
                ) : null}
                <PricePopout
                  intakeId={intake.id}
                  returnTo={returnTo}
                  initialValue={intake.chargedAmountValue ?? ""}
                />
                {!intake.isArchived ? (
                  <ArchiveIntakeForm intakeId={intake.id} returnTo={returnTo} iconOnly />
                ) : null}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
