import { AppShell } from "@/components/dashboard/app-shell";
import { IntakeForm } from "@/components/intakes/intake-form";
import { getCurrentUser, requireUser } from "@/lib/auth";

export default async function NewIntakePage() {
  await requireUser();
  const user = await getCurrentUser();

  return (
    <AppShell activePath="/new-intake" userEmail={user?.email}>
      <section>
        <article className="rounded-[2rem] border border-border bg-white/88 px-5 py-5 shadow-[0_18px_48px_rgba(20,30,28,0.06)] backdrop-blur sm:px-6">
          <div>
            <IntakeForm />
          </div>
        </article>
      </section>
    </AppShell>
  );
}
