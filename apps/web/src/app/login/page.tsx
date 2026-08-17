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
    redirect("/intakes");
  }

  const { next } = await searchParams;
  const setupStatus = await getSetupStatus();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(35,68,63,0.12),_transparent_45%),linear-gradient(180deg,_#eef4f0_0%,_#e6f0ea_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <section className="rounded-[2rem] border border-border bg-white/85 px-6 py-8 shadow-[0_24px_80px_rgba(20,30,28,0.08)] backdrop-blur sm:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Sign in with your email and password to open the intake form and the records.
            </p>
          </div>

          <LoginForm redirectTo={next || "/intakes"} />

          {!setupStatus.hasUsers && setupStatus.setupAvailable ? (
            <p className="mt-6 rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted">
              No user has been created yet. Use{" "}
              <Link href="/setup" className="font-semibold text-surface-strong underline underline-offset-4">
                initial setup
              </Link>
              .
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
