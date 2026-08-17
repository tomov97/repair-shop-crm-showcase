import Link from "next/link";
import { AppShell } from "@/components/dashboard/app-shell";
import { SummaryCard } from "@/components/dashboard/cards";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getPrintQueueData } from "@/lib/dashboard-data";

export default async function PrintPage() {
  await requireUser();
  const user = await getCurrentUser();
  const { summary, items } = await getPrintQueueData(30);

  return (
    <AppShell activePath="/print" userEmail={user?.email}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Queued or printing" value={summary.queued} hint="Active jobs" />
        <SummaryCard label="Errors" value={summary.failed} hint="Need a retry" />
        <SummaryCard label="Printed" value={summary.printed} hint="Recent successful jobs" />
        <SummaryCard label="Total jobs" value={summary.total} hint="Last 30 print jobs" />
      </section>

      <section className="mt-6">
        <article className="rounded-[2rem] border border-border bg-white/88 px-5 py-5 shadow-[0_18px_48px_rgba(20,30,28,0.06)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Print queue</h1>
            <div className="inline-flex rounded-full bg-[#efe9d7] px-4 py-2 text-sm font-semibold text-[#6c5a2d]">
              {items.length} jobs
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6">
        <article className="rounded-[2rem] border border-[#1a3530] bg-[#23443f] p-2 shadow-[0_18px_48px_rgba(20,30,28,0.18)] backdrop-blur sm:p-3">
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[#2e5a54] bg-[#1e3c37] px-4 py-8 text-center text-sm text-white/50">
                No print jobs yet.
              </div>
            ) : (
              items.map((job) => (
                <div
                  key={job.id}
                  className="rounded-[1.35rem] border border-white/70 bg-white px-3 py-3 text-[#23443f] shadow-[0_8px_0_rgba(15,38,34,0.65),0_12px_36px_rgba(15,38,34,0.32)] sm:rounded-[1.5rem] sm:px-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold">{job.customerName}</p>
                        <span className="inline-flex rounded-full border border-[#c7d9cd] bg-[#edf5ef] px-2.5 py-[3px] text-[11px] font-semibold leading-none text-surface-strong">
                          {job.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-[#23443f]/60">{job.customerPhone}</p>
                      <p className="mt-1 text-sm text-[#23443f]">Intake: {job.intakeNumber}</p>
                      <p className="mt-0.5 text-sm text-[#23443f]/60">Attempts: {job.attemptCount}</p>
                      {job.lastError ? (
                        <p className="mt-2 rounded-2xl border border-[#ead7c2] bg-[#fff6ed] px-3 py-2 text-sm text-[#7a4e21]">
                          {job.lastError}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-1 text-sm text-[#23443f]/60 lg:items-end lg:text-right">
                      <p>{job.createdAtLabel}</p>
                      <p>{job.updatedAtLabel}</p>
                      <p>{job.printedAtLabel ?? "No successful print yet"}</p>
                      <Link
                        href={`/intakes/${job.intakeId}`}
                        className="mt-1 inline-flex min-h-9 items-center justify-center rounded-2xl border border-[#23443f]/20 px-4 py-2 text-sm font-semibold text-[#23443f] transition hover:bg-[#23443f]/5"
                      >
                        Open intake
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
