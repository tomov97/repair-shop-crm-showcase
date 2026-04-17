import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { IntakeDirectoryView } from "@/components/dashboard/intake-directory-view";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getIntakeDirectory } from "@/lib/dashboard-data";

async function SalesIntakesSection() {
  const salesItems = await getIntakeDirectory({ intakeType: "sale", limit: 60 });

  return (
    <>
      <section>
        <article className="rounded-[1.75rem] bg-surface-strong px-5 py-4 text-white shadow-[0_24px_80px_rgba(35,68,63,0.16)] sm:px-6">
          <div className="flex flex-row items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight leading-tight">Продажби</h1>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm">
                {salesItems.length}
              </div>
              <Link
                href="/new-intake?type=sale"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/25"
              >
                + Нова продажба
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6">
        <IntakeDirectoryView
          items={salesItems}
          emptyMessage="Все още няма записани продажби."
          returnTo="/sales"
        />
      </section>
    </>
  );
}

function SalesIntakesSkeleton() {
  return (
    <>
      <section>
        <div className="h-[68px] animate-pulse rounded-[1.75rem] bg-surface-strong/20" />
      </section>
      <section className="mt-6 animate-pulse space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-[1.5rem] bg-surface-strong/10" />
        ))}
      </section>
    </>
  );
}

export default async function SalesPage() {
  await requireUser();
  const user = await getCurrentUser();

  return (
    <AppShell activePath="/sales" userEmail={user?.email}>
      <Suspense fallback={<SalesIntakesSkeleton />}>
        <SalesIntakesSection />
      </Suspense>
    </AppShell>
  );
}
