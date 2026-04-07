import { AppShell } from "@/components/dashboard/app-shell";
import { IntakeListCard } from "@/components/dashboard/cards";
import { IntakeTrendCard } from "@/components/dashboard/intake-trend-card";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getIntakeTrendSeries } from "@/lib/dashboard-data";
import { getDashboardData } from "@/lib/intakes";

export default async function DashboardPage() {
  await requireUser();
  const user = await getCurrentUser();
  const [dashboard, trendSeries] = await Promise.all([getDashboardData(), getIntakeTrendSeries()]);

  return (
    <AppShell activePath="/dashboard" userEmail={user?.email}>
      {dashboard.backendMessage ? (
        <div className="rounded-[1.5rem] border border-[#d6c6b4] bg-[#fff6ed] px-5 py-4 text-sm leading-6 text-[#7a4e21]">
          {dashboard.backendMessage}
        </div>
      ) : null}

      <section>
        <IntakeTrendCard series={trendSeries} />
      </section>

      <section className="mt-6">
        <IntakeListCard
          items={dashboard.recentIntakes as never}
          emptyMessage="Все още няма запазени приемания."
          returnTo="/dashboard"
        />
      </section>
    </AppShell>
  );
}
