export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-[26px] bg-white/5" />
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[520px] animate-pulse rounded-[20px] bg-white/5" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-[20px] bg-white/5" />
            <div className="h-40 animate-pulse rounded-[20px] bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  )
}
