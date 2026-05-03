import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveIntakeForm } from "@/components/intakes/archive-intake-form";
import { ReprintButton } from "@/components/intakes/reprint-button";
import { AppShell } from "@/components/dashboard/app-shell";
import { EditIntakeForm } from "@/components/intakes/edit-intake-form";
import { PricePopout } from "@/components/intakes/price-popout";
import { CoffeeCountPopout } from "@/components/intakes/coffee-count-popout";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getIntakeDetail } from "@/lib/intakes";
import { splitStructuredPhone } from "@/lib/phone";

function DetailCard({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  return (
    <article className="rounded-[1.5rem] border border-border bg-white/90 p-4 shadow-[0_14px_36px_rgba(20,30,28,0.05)] backdrop-blur sm:p-5">
      <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-6 text-foreground">{children}</div>
    </article>
  );
}

export default async function IntakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [intake, user] = await Promise.all([getIntakeDetail(id), getCurrentUser()]);

  if (!intake) {
    notFound();
  }

  const phoneParts = splitStructuredPhone(intake.customerPhone);
  const copyHref = `/new-intake?${new URLSearchParams({
    type: intake.intakeType,
    fullName: intake.customerName,
    countryCode: phoneParts.countryCode,
    phoneNumber: phoneParts.phoneNumber,
    brand: intake.brand,
    model: intake.model,
  }).toString()}`;

  return (
    <AppShell activePath={`/intakes/${id}`} userEmail={user?.email}>
      <div>

        <section className="mt-4 rounded-[1.75rem] bg-surface-strong px-5 py-4 text-white shadow-[0_24px_80px_rgba(35,68,63,0.16)] sm:px-6">
          <div className="flex flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs text-white/55">{intake.intakeNumber}</p>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight leading-tight">{intake.customerName}</h1>
              <p className="mt-0.5 text-base text-white/75">{intake.brand} {intake.model}</p>
            </div>

            <div className="grid gap-2 rounded-[1.25rem] bg-white/10 px-4 py-3 text-sm text-white/85 backdrop-blur-sm">
              <div>
                <p className="font-semibold">Създадено</p>
                <p>{intake.createdAtLabel}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 grid gap-5">
          {/* Status card — first on mobile and desktop */}
          <div>
            <DetailCard title="Статус и действия">
              <div className="flex items-center justify-between gap-3">
                {intake.isArchived ? (
                  <div className="inline-flex flex-col rounded-xl border border-[#f5c6c2] bg-[#fdf0ef] px-3 py-1.5 text-sm">
                    <span className="font-semibold text-[#922b21]">Архивиран</span>
                    {intake.archivedAtLabel ? (
                      <span className="text-xs text-[#922b21]/70">{intake.archivedAtLabel}</span>
                    ) : null}
                  </div>
                ) : (
                  <div className="inline-flex rounded-xl border border-[#c7d9cd] bg-[#edf5ef] px-3 py-1.5 text-sm font-semibold text-[#23443f]">
                    Активен
                  </div>
                )}
                <p className="text-sm text-muted">
                  {(intake.customerVisitCount ?? 1) > 1
                    ? `${intake.customerVisitCount} приемания`
                    : "Първо приемане"}
                </p>
              </div>

              {intake.chargedAmountValue ? (
                <p className="text-sm">
                  <span className="font-semibold">Записана сума:</span> {intake.chargedAmountLabel}
                </p>
              ) : null}

              {intake.coffeeCount !== null ? (
                <p className="text-sm">
                  <span className="font-semibold">Брой кафета:</span> {intake.coffeeCount}
                </p>
              ) : null}

              {intake.intakeType === "sale" ? (
                <div className="inline-flex rounded-xl border border-[#c7d4e8] bg-[#edf2f9] px-3 py-1.5 text-sm font-semibold text-[#2b4a7a]">
                  Продажба
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                {/* Action icon buttons */}
                <ReprintButton intakeId={intake.id} returnTo={`/intakes/${intake.id}`} />
                {!intake.isArchived && intake.intakeType !== "sale" ? (
                  <ArchiveIntakeForm intakeId={intake.id} returnTo={`/intakes/${intake.id}`} iconOnly />
                ) : null}
                <a
                  href={`tel:${intake.customerPhone.replace(/\s+/g, "")}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f8f61]/15 text-[#2f8f61] transition hover:bg-[#2f8f61]/25 active:scale-95"
                  title={intake.customerPhone}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </a>
                {/* Separator */}
                <div className="h-6 w-px bg-border" />
                {/* Value pills */}
                <PricePopout
                  intakeId={intake.id}
                  returnTo={`/intakes/${intake.id}`}
                  initialValue={intake.chargedAmountValue ?? ""}
                />
                <CoffeeCountPopout
                  intakeId={intake.id}
                  returnTo={`/intakes/${intake.id}`}
                  initialValue={intake.coffeeCount}
                />
              </div>

              <Link
                href={copyHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#23443f]/20 bg-[#23443f]/8 px-4 py-2.5 text-sm font-semibold text-[#23443f] transition hover:bg-[#23443f]/15 active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Копирай
              </Link>
            </DetailCard>
          </div>

          {/* Client detail cards */}
          <div className="grid gap-5">
            {(intake.customerVisitCount ?? 1) > 1 ? (
              <DetailCard title="Предишни приемания">
                {intake.previousIntakes.map((item) => (
                  <Link
                    key={item.id}
                    href={`/intakes/${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition hover:border-surface-strong/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.intakeNumber}</span>
                      {item.intakeType === "sale" ? (
                        <span className="rounded-md bg-[#edf2f9] px-1.5 py-0.5 text-xs font-medium text-[#2b4a7a]">
                          Продажба
                        </span>
                      ) : null}
                    </div>
                    <span className="text-muted">{item.createdAtLabel}</span>
                  </Link>
                ))}
              </DetailCard>
            ) : null}

            <DetailCard title="Данни за приема">
              <EditIntakeForm
                intakeId={intake.id}
                intakeType={intake.intakeType}
                returnTo={`/intakes/${intake.id}`}
                fullName={intake.customerName}
                customerPhone={intake.customerPhone}
                brand={intake.brand}
                model={intake.model}
                issueDescription={intake.issueDescription}
              />
            </DetailCard>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
