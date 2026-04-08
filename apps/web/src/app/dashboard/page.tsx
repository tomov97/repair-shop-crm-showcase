import { Suspense } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { IntakeListCard } from "@/components/dashboard/cards";
import { IntakeTrendCard } from "@/components/dashboard/intake-trend-card";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getIntakeTrendSeries } from "@/lib/dashboard-data";
import { getDashboardData } from "@/lib/intakes";

async function DashboardTrendSection() {
  const trendSeries = await getIntakeTrendSeries();
  return <IntakeTrendCard series={trendSeries} />;
}

async function DashboardRecentSection() {
  const dashboard = await getDashboardData();
  return (
    <>
      {dashboard.backendMessage ? (
        <div className="mb-6 rounded-[1.5rem] border border-[#d6c6b4] bg-[#fff6ed] px-5 py-4 text-sm leading-6 text-[#7a4e21]">
          {dashboard.backendMessage}
        </div>
      ) : null}
      <IntakeListCard
        items={dashboard.recentIntakes as never}
        emptyMessage="Все още няма запазени приемания."
        returnTo="/dashboard"
      />
    </>
  );
}

function TrendSkeleton() {
  return <div className="h-48 animate-pulse rounded-[1.75rem] bg-surface-strong/20" />;
}

function RecentSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 rounded-[1.5rem] bg-surface-strong/10" />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  await requireUser();
  const user = await getCurrentUser();

  return (
    <AppShell activePath="/dashboard" userEmail={user?.email}>
      <section>
        <Suspense fallback={<TrendSkeleton />}>
          <DashboardTrendSection />
        </Suspense>
      </section>

      <section className="mt-6">
        <Suspense fallback={<RecentSkeleton />}>
          <DashboardRecentSection />
        </Suspense>
      </section>
    </AppShell>
  );
}
