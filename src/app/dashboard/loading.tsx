export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-[26px] bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]" />
        <div className="grid gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[20px] bg-white/5" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="h-[420px] animate-pulse rounded-[20px] bg-white/5" />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-[20px] bg-white/5" />
            <div className="h-40 animate-pulse rounded-[20px] bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  )
}
