export default function IntakeDetailLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(35,68,63,0.10),_transparent_35%),linear-gradient(180deg,_#f8f6eb_0%,_#f4f1e5_100%)]">
      <div className="bg-surface-strong h-14 lg:hidden" />
      <div className="mx-auto max-w-[1100px] px-4 py-6 lg:py-10 animate-pulse">
        {/* Header card placeholder */}
        <div className="h-28 rounded-[1.75rem] bg-surface-strong/60" />
        {/* Detail cards */}
        <div className="mt-3 space-y-5">
          <div className="h-36 rounded-[1.5rem] bg-surface-strong/10" />
          <div className="h-48 rounded-[1.5rem] bg-surface-strong/10" />
        </div>
      </div>
    </main>
  );
}
