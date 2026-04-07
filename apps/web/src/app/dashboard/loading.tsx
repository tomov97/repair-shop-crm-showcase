export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(35,68,63,0.10),_transparent_35%),linear-gradient(180deg,_#f8f6eb_0%,_#f4f1e5_100%)]">
      <div className="bg-surface-strong h-14 lg:hidden" />
      <div className="mx-auto max-w-[1100px] px-4 py-6 lg:py-10 animate-pulse">
        {/* Trend card placeholder */}
        <div className="h-48 rounded-[1.75rem] bg-surface-strong/20" />
        {/* List card placeholder */}
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-[1.5rem] bg-surface-strong/10" />
          ))}
        </div>
      </div>
    </main>
  );
}
