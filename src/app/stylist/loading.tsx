export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-[26px] bg-white/5" />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="h-[520px] animate-pulse rounded-[20px] bg-white/5" />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-[20px] bg-white/5" />
            <div className="h-40 animate-pulse rounded-[20px] bg-white/5" />
            <div className="h-40 animate-pulse rounded-[20px] bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  )
}
