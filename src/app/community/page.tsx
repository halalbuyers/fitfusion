import Image from 'next/image'
import { AppFrame } from '../../components/AppFrame'

export default function CommunityPage() {
  return (
    <AppFrame title="Community feed" eyebrow="Share, like, save, follow">
      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((post) => (
          <article key={post} className="glass overflow-hidden rounded-2xl">
            <div className="relative h-80 w-full">
              <Image
                src={`https://images.unsplash.com/photo-${post === 1 ? '1529139574466-a303027c1d8b' : post === 2 ? '1515886657613-9f3515b0c78f' : '1483985988355-763728e1935b'}?auto=format&fit=crop&w=800&q=80`}
                alt="Community outfit"
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <h2 className="font-semibold">Featured outfit #{post}</h2>
              <p className="mt-2 text-sm text-white/50">Minimal layers, premium contrast, saved by 2.4k members.</p>
              <div className="mt-4 flex gap-2 text-xs text-white/50">
                <span className="rounded-full bg-white/8 px-3 py-1">Like</span>
                <span className="rounded-full bg-white/8 px-3 py-1">Comment</span>
                <span className="rounded-full bg-white/8 px-3 py-1">Save</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppFrame>
  )
}
