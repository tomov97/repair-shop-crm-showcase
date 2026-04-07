import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupForm } from "@/components/auth/setup-form";
import { getCurrentUser } from "@/lib/auth";
import { getSetupStatus } from "@/lib/intakes";

export default async function SetupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const setupStatus = await getSetupStatus();

  if (setupStatus.hasUsers) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#eef4f0_0%,_#e6f0ea_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-white/90 px-6 py-8 shadow-[0_24px_80px_rgba(20,30,28,0.08)] backdrop-blur sm:px-8">
        <div className="inline-flex rounded-full bg-[#e7efe8] px-3 py-1 text-sm font-medium text-surface-strong">
          Първоначална настройка
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Създай първия достъп за сервиза</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Това се използва само веднъж. След създаването на първия потребител достъпът минава през
          нормалния вход.
        </p>

        <div className="mt-8">
          <SetupForm redirectTo="/dashboard" />
        </div>

        <p className="mt-6 text-sm text-muted">
          Вече имаш достъп?{" "}
          <Link href="/login" className="font-semibold text-surface-strong underline underline-offset-4">
            Към вход
          </Link>
        </p>
      </div>
    </main>
  );
}
