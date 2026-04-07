import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";
import { getSetupStatus } from "@/lib/intakes";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const { next } = await searchParams;
  const setupStatus = await getSetupStatus();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(35,68,63,0.12),_transparent_45%),linear-gradient(180deg,_#eef4f0_0%,_#e6f0ea_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] bg-surface-strong px-6 py-8 text-white shadow-[0_24px_80px_rgba(35,68,63,0.18)] sm:px-8 sm:py-10">
          <div className="inline-flex rounded-full border border-white/15 px-3 py-1 text-sm text-white/80">
            Вход за сервиза
          </div>
          <h1 className="mt-6 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
            CRM за приемане, печат и бързо отваряне на сервизни записи
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
            Табло за приемания, изградено първо за мобилен екран. Един и същ основен поток работи на
            телефон и лаптоп, а печатът остава отделен и надежден.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <article className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/65">Стъпка 1</p>
              <p className="mt-2 font-medium">Запази приемането</p>
            </article>
            <article className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/65">Стъпка 2</p>
              <p className="mt-2 font-medium">Създай задача за печат</p>
            </article>
            <article className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/65">Стъпка 3</p>
              <p className="mt-2 font-medium">Отвори записа по QR или търсене</p>
            </article>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-white/85 px-6 py-8 shadow-[0_24px_80px_rgba(20,30,28,0.08)] backdrop-blur sm:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Вход</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Влез с имейл и парола, за да отвориш приемащата форма и останалите записи.
            </p>
          </div>

          <LoginForm redirectTo={next || "/dashboard"} />

          {!setupStatus.hasUsers && setupStatus.setupAvailable ? (
            <p className="mt-6 rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted">
              Все още няма създаден потребител. Използвай{" "}
              <Link href="/setup" className="font-semibold text-surface-strong underline underline-offset-4">
                първоначална настройка
              </Link>
              .
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
