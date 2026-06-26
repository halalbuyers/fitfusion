import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Bug, ShieldCheck, Sparkles, Zap, Lightbulb } from 'lucide-react'
import { connectToDatabase } from '../../lib/mongodb'
import AdminAnnouncement from '../../models/AdminAnnouncement'
import { AppFrame } from '../../components/AppFrame'
import { JsonLd } from '../../components/JsonLd'
import { breadcrumbJsonLd, pageMetadata } from '../../lib/seo'

export const metadata: Metadata = pageMetadata('Product Updates', 'Read the latest Noir Closet product updates, release notes, bug fixes, and community-powered improvements.', '/updates')

type UpdateItem = {
  _id: string
  title: string
  body: string
  description?: string
  type: 'announcement' | 'maintenance' | 'feature' | 'update' | 'fix' | 'community' | 'security'
  featured: boolean
  suggestedByUsername?: string
  creditedUsername?: string
  publishedAt: string
}

const typeMeta: Record<UpdateItem['type'], { label: string; icon: typeof Zap; accent: string; bg: string }> = {
  feature: { label: 'Feature', icon: Zap, accent: 'text-[#d9ff5a]', bg: 'bg-[#d9ff5a]/10' },
  update: { label: 'Update', icon: Sparkles, accent: 'text-[#8dd3ff]', bg: 'bg-[#8dd3ff]/10' },
  fix: { label: 'Bug fix', icon: Bug, accent: 'text-[#ff7aa6]', bg: 'bg-[#ff7aa6]/10' },
  announcement: { label: 'Community', icon: Lightbulb, accent: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10' },
  maintenance: { label: 'Security', icon: ShieldCheck, accent: 'text-[#7dd3fc]', bg: 'bg-[#7dd3fc]/10' },
  community: { label: 'Community', icon: Lightbulb, accent: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10' },
  security: { label: 'Security', icon: ShieldCheck, accent: 'text-[#7dd3fc]', bg: 'bg-[#7dd3fc]/10' }
}

function formatMonth(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function toReleaseLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function safeDate(dateString: string) {
  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export default async function UpdatesPage() {
  let updates: UpdateItem[] = []

  try {
    await connectToDatabase()
    const announcements = await AdminAnnouncement.find({
      status: 'published',
      isActive: true,
      audience: { $in: ['all', 'users'] }
    })
      .sort({ featured: -1, displayOrder: 1, priority: -1, createdAt: -1 })
      .lean()

    updates = announcements.map((announcement: any) => ({
      ...announcement,
      _id: announcement._id?.toString ? announcement._id.toString() : String(announcement._id),
      description: announcement.description || announcement.body,
      publishedAt: announcement.createdAt ? new Date(announcement.createdAt).toISOString() : new Date().toISOString(),
      featured: Boolean(announcement.featured),
      suggestedByUsername: announcement.suggestedByUsername || announcement.creditedUsername || undefined,
      creditedUsername: announcement.creditedUsername || announcement.suggestedByUsername || undefined
    }))
  } catch (error) {
    updates = []
  }

  const featured = updates.find((item) => item.featured) ?? updates[0] ?? null
  const topCredits = Array.from(new Set(updates.map((item) => item.creditedUsername || item.suggestedByUsername).filter(Boolean))).slice(0, 5)

  const groups = updates.reduce<Record<string, { label: string; items: UpdateItem[] }>>((acc, update) => {
    const date = safeDate(update.publishedAt || update.description || update.body)
    const groupKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`
    if (!acc[groupKey]) {
      acc[groupKey] = { label: formatMonth(update.publishedAt), items: [] }
    }
    acc[groupKey].items.push(update)
    return acc
  }, {})

  const sortedGroupKeys = Object.keys(groups).sort((a, b) => (a > b ? -1 : 1))

  return (
    <AppFrame title="Product updates" eyebrow="Release notes">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Updates', path: '/updates' }])} />
      <div className="space-y-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9ff5a]/20 bg-[#d9ff5a]/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-[#d9ff5a] shadow-[0_0_24px_rgba(217,255,90,0.12)]">
                <Sparkles className="h-4 w-4" /> Community Powered Updates
              </div>
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">What&apos;s new</p>
                <h1 className="text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">Product updates for Noir Closet</h1>
                <p className="max-w-2xl text-base leading-8 text-white/70">Latest product improvements, bug fixes, and community-powered updates delivered in a modern changelog experience.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="#featured" className="inline-flex items-center gap-2 rounded-full bg-[#d9ff5a] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e7ff5f]">
                  Explore featured update
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10">
                  Return to dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#0f1219]/95 p-6 shadow-[0_0_80px_rgba(0,0,0,0.35)]">
              <p className="text-sm uppercase tracking-[0.26em] text-white/50">Latest release</p>
              <p className="mt-4 text-3xl font-semibold text-white">{featured ? featured.title : 'No updates yet'}</p>
              <div className="mt-5 grid gap-3 text-sm text-white/70">
                <p>{featured ? featured.description || featured.body : 'Check back soon for product and community updates.'}</p>
                {featured?.suggestedByUsername ? <p>Suggested by <span className="font-semibold text-white">@{featured.suggestedByUsername}</span></p> : null}
                {featured ? <p>Released <span className="font-semibold text-white">{toReleaseLabel(featured.publishedAt)}</span></p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-8">
            <div id="featured" className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl space-y-5">
                  <div className="inline-flex items-center gap-3 rounded-full border border-[#d9ff5a]/20 bg-[#d9ff5a]/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-[#d9ff5a]">
                    <Zap className="h-4 w-4" /> Featured update
                  </div>
                  {featured ? (
                    <>
                      <h2 className="text-4xl font-semibold text-white">{featured.title}</h2>
                      <p className="text-lg leading-8 text-white/70">{featured.description || featured.body}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[24px] bg-[#0f1219]/80 p-5 text-sm text-white/70">
                          <p className="text-xs uppercase tracking-[0.26em] text-white/40">Suggested by</p>
                          <p className="mt-2 text-base text-white">@{featured.suggestedByUsername || featured.creditedUsername || 'Noir Closet team'}</p>
                        </div>
                        <div className="rounded-[24px] bg-[#0f1219]/80 p-5 text-sm text-white/70">
                          <p className="text-xs uppercase tracking-[0.26em] text-white/40">Released</p>
                          <p className="mt-2 text-base text-white">{toReleaseLabel(featured.publishedAt)}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-white/70">No featured update is available. Publish your first product update from the admin dashboard.</p>
                  )}
                </div>
                <div className="rounded-[24px] border border-white/10 bg-[#0f1219]/80 p-6 text-sm text-white/70 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
                  <p className="text-xs uppercase tracking-[0.26em] text-white/40">What’s inside</p>
                  <ul className="mt-5 space-y-3">
                    <li className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#d9ff5a]/10 text-[#d9ff5a]">🚀</span>
                      Feature launches, performance improvements, and community credit.
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#8dd3ff]/10 text-[#8dd3ff]">✨</span>
                      Clean changelog organization by month and release.
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7aa6]/10 text-[#ff7aa6]">🐞</span>
                      Bug fixes and reliability updates with public trust.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {sortedGroupKeys.length ? (
                sortedGroupKeys.map((groupKey) => {
                  const group = groups[groupKey]
                  return (
                    <div key={groupKey} className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.25)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-white/50">{group.label}</p>
                          <h3 className="mt-3 text-2xl font-semibold text-white">Release timeline</h3>
                        </div>
                        <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/60">{group.items.length} update{group.items.length === 1 ? '' : 's'}</div>
                      </div>
                      <div className="mt-6 space-y-5">
                        {group.items.map((update) => {
                          const meta = typeMeta[update.type] || typeMeta.update
                          return (
                            <article key={update._id} id={update._id} className="rounded-[24px] border border-white/10 bg-[#0f1219]/80 p-6 transition hover:border-[#d9ff5a]/40">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${meta.bg} ${meta.accent}`}>
                                    <meta.icon className="h-4 w-4" />
                                    {meta.label}
                                  </div>
                                  <h4 className="mt-4 text-2xl font-semibold text-white">{update.title}</h4>
                                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{update.description || update.body}</p>
                                </div>
                                <div className="space-y-2 text-right text-sm text-white/50">
                                  <p>Suggested by</p>
                                  <p className="text-white">@{update.suggestedByUsername || update.creditedUsername || 'Noir Closet'}</p>
                                </div>
                              </div>
                              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/60">
                                <span>{toReleaseLabel(update.publishedAt)}</span>
                                <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                                <Link href={`#${update._id}`} className="text-sm font-semibold text-[#d9ff5a] transition hover:text-[#f5ff9f]">View details</Link>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-white/60">
                  No public updates are available yet. Create a featured announcement in the admin panel to publish the first update.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">Community credits</p>
              <h3 className="mt-4 text-xl font-semibold text-white">This feature was built thanks to feedback from</h3>
              <p className="mt-4 text-sm leading-7 text-white/70">Community contributors help shape Noir Closet every day. Thank you for helping improve the product.</p>
              <div className="mt-6 grid gap-3 text-sm leading-7 text-white/70">
                {topCredits.length ? topCredits.map((name) => (
                  <div key={name} className="rounded-[24px] bg-[#0f1219]/90 p-5">
                    <p className="font-semibold text-white">@{name}</p>
                    <p className="mt-2">Thank you for helping improve Noir Closet.</p>
                  </div>
                )) : (
                  <div className="rounded-[24px] bg-[#0f1219]/90 p-5">
                    <p className="font-semibold text-white">@Noir Closet</p>
                    <p className="mt-2">Community suggestions will appear here after credited updates are published.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#0f1219]/90 p-6 text-sm text-white/70">
              <p className="text-sm uppercase tracking-[0.26em] text-white/40">Public product changelog</p>
              <p className="mt-4">Release updates are now separate from admin announcement management. View the latest product news without leaving the app.</p>
            </div>
          </aside>
        </div>
      </div>
    </AppFrame>
  )
}
