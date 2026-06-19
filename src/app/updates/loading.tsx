export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="h-[320px] animate-pulse rounded-[8px] bg-white/5" />
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-[8px] bg-white/5" />
            ))}
          </div>
          <div className="space-y-6">
            <div className="h-72 animate-pulse rounded-[8px] bg-white/5" />
            <div className="h-44 animate-pulse rounded-[8px] bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  )
}
