export default function TripsLoading() {
  return (
    <div className="premium-grid min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="h-10 w-56 animate-pulse rounded-[8px] bg-white/8" />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-[8px] bg-white/7" />)}
        </div>
      </div>
    </div>
  )
}

