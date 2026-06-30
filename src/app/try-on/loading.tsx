export default function TryOnLoading() {
  return (
    <div className="premium-grid min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="h-10 w-72 animate-pulse rounded-[8px] bg-white/8" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="h-[620px] animate-pulse rounded-[8px] bg-white/7" />
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-[8px] bg-white/7" />)}
          </div>
        </div>
      </div>
    </div>
  )
}
