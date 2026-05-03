import { Suspense } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { IntakeDirectoryView } from "@/components/dashboard/intake-directory-view";
import { Pagination } from "@/components/dashboard/pagination";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getIntakeDirectory, INTAKE_DIRECTORY_PAGE_SIZE } from "@/lib/dashboard-data";

async function ArchivedIntakesSection({ page }: { page: number }) {
  const { items: archivedItems, totalCount } = await getIntakeDirectory({ intakeType: "service", archivedOnly: true, page });
  const totalPages = Math.ceil(totalCount / INTAKE_DIRECTORY_PAGE_SIZE);

  return (
    <>
      <section>
        <article className="rounded-[1.75rem] bg-surface-strong px-5 py-4 text-white shadow-[0_24px_80px_rgba(35,68,63,0.16)] sm:px-6">
          <div className="flex flex-row items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight leading-tight">Архив</h1>
            <div className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm">
              {totalCount}
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
        <Pagination currentPage={page} totalPages={totalPages} basePath="/archive" />
      </section>
    </>
  );
}

function ArchivedIntakesSkeleton() {
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

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireUser();
  const user = await getCurrentUser();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  return (
    <AppShell activePath="/archive" userEmail={user?.email}>
      <Suspense fallback={<ArchivedIntakesSkeleton />}>
        <ArchivedIntakesSection page={page} />
      </Suspense>
    </AppShell>
  );
}
