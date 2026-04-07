import { AppShell } from "@/components/dashboard/app-shell";
import { IntakeDirectoryView } from "@/components/dashboard/intake-directory-view";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getIntakeDirectory } from "@/lib/dashboard-data";

export default async function ArchivePage() {
  await requireUser();
  const user = await getCurrentUser();
  const items = await getIntakeDirectory({ includeArchived: true, limit: 40 });
  const archivedItems = items.filter((item) => item.isArchived);

  return (
    <AppShell activePath="/archive" userEmail={user?.email}>
      <section>
        <article className="rounded-[1.75rem] bg-surface-strong px-5 py-4 text-white shadow-[0_24px_80px_rgba(35,68,63,0.16)] sm:px-6">
          <div className="flex flex-row items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight leading-tight">Архив</h1>
            <div className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm">
              {archivedItems.length}
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6">
        <IntakeDirectoryView
          items={archivedItems}
          emptyMessage="Все още няма архивирани приемания."
          returnTo="/archive"
        />
      </section>
    </AppShell>
  );
}
