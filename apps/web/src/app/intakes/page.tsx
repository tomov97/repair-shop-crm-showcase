import { AppShell } from "@/components/dashboard/app-shell";
import { IntakeDirectoryView } from "@/components/dashboard/intake-directory-view";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getIntakeDirectory } from "@/lib/dashboard-data";

export default async function IntakesPage() {
  await requireUser();
  const user = await getCurrentUser();
  const items = await getIntakeDirectory({ includeArchived: false, limit: 40 });

  return (
    <AppShell activePath="/intakes" userEmail={user?.email}>
      <section>
        <article className="rounded-[1.75rem] bg-surface-strong px-5 py-4 text-white shadow-[0_24px_80px_rgba(35,68,63,0.16)] sm:px-6">
          <div className="flex flex-row items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight leading-tight">Активни записи</h1>
            <div className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm">
              {items.length}
            </div>
          </div>
        </article>
      </section>
      <section className="mt-6">
        <IntakeDirectoryView
          items={items}
          emptyMessage="Няма текущи приемания."
          returnTo="/intakes"
        />
      </section>
    </AppShell>
  );
}
