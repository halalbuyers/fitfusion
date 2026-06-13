export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-[26px] bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-96 animate-pulse rounded-[20px] bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}
