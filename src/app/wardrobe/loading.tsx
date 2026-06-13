export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-[26px] bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-[20px] bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}
