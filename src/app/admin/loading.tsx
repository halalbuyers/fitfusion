export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="h-16 animate-pulse rounded-[24px] bg-white/5" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-[20px] bg-white/5" />
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-20 animate-pulse rounded-[26px] bg-white/5" />
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-[20px] bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
