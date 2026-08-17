import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="max-w-lg rounded-[2rem] border border-border bg-white px-6 py-8 text-center shadow-[0_18px_48px_rgba(20,30,28,0.06)]">
        <p className="text-sm font-medium text-muted">Record not found</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">No such intake</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Check that the link is correct, or open the dashboard to find the machine in the list.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-surface-strong px-4 py-3 text-sm font-semibold text-white"
        >
          To dashboard
        </Link>
      </div>
    </main>
  );
}
