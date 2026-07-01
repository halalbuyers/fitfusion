"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Bookmark,
  Eye,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Share2,
  Tag,
  Video,
  Users
} from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'
import { readApiJson } from '../../lib/api'

type Post = {
  _id: string
  caption?: string
  title?: string
  type?: string
  images?: string[]
  videoUrl?: string
  videoThumbnail?: string
  likes?: string[]
  saves?: string[]
  hashtags?: string[]
  location?: string
  occasion?: string
  style?: string
  season?: string
  createdAt?: string
  pinned?: boolean
  metrics?: { views?: number; shares?: number; comments?: number }
  author?: {
    name?: string
    handle?: string
    avatar?: string
  }
  outfit?: {
    title?: string
    occasion?: string
    score?: number
    items?: Array<{ clothing?: { image?: string; category?: string } }>
  }
}

const feedOptions = [
  { key: 'home', label: 'Home' },
  { key: 'following', label: 'Following' },
  { key: 'trending', label: 'Trending' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'recommended', label: 'Recommended' }
]

const typeLabels: Record<string, string> = {
  image: 'Image',
  carousel: 'Carousel',
  video: 'Video',
  outfit: 'Outfit',
  wardrobe: 'Wardrobe',
  'style-tip': 'Style Tip',
  discussion: 'Discussion',
  poll: 'Poll',
  'before-after': 'Before & After'
}

function blendImages(images: string[] = []) {
  if (!images.length) return []
  return images.slice(0, 4)
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [activeFeed, setActiveFeed] = useState('home')
  const [search, setSearch] = useState('')

  const feedLabel = useMemo(() => feedOptions.find((item) => item.key === activeFeed)?.label || 'Community', [activeFeed])

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const query = new URLSearchParams()
      query.set('feed', activeFeed)
      if (search.trim()) query.set('search', search.trim())
      const res = await fetch(`/api/posts?${query.toString()}`)
      const data = await readApiJson<Post[]>(res, 'Could not load posts')
      setPosts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Could not load the community feed right now.')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [activeFeed, search])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  async function togglePost(post: Post, action: 'like' | 'save') {
    if (post._id.startsWith('sample-')) {
      setNotice('Save an outfit to share a real community post.')
      return
    }
    setBusyId(post._id)
    setNotice('')
    setError('')
    try {
      const res = await fetch(`/api/posts/${post._id}/${action}`, { method: 'POST' })
      const data = await readApiJson<Post>(res, `${action} failed`)
      setPosts((current) => current.map((item) => item._id === post._id ? data : item))
    } catch (e: any) {
      setError(e.message || `${action} failed`)
    } finally {
      setBusyId('')
    }
  }

  return (
    <AppFrame title="Community" eyebrow="Fashion feed" action={<Link href="/outfits" className="rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-black">Create post</Link>}>
      <section className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-white/45">{feedLabel}</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Discover the latest street fits, runway edits, and wearable inspiration.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Browse curated feeds, trending looks, and fresh community content across fashion, outfits, and creative styling.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={loadPosts} className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-white/10 bg-white/5 px-4 text-sm text-white/80 transition hover:bg-white/10">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <div className="mb-5 grid gap-3 rounded-[8px] bg-white/[0.04] p-4 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap gap-2">
          {feedOptions.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveFeed(item.key)}
              className={`rounded-full px-4 py-2 text-sm transition ${activeFeed === item.key ? 'bg-[#d7ff55] text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            id="community-search"
            name="communitySearch"
            type="search"
            autoComplete="off"
            aria-label="Search community"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search hashtags, brands, or styles"
            className="field min-w-0 bg-black/30 text-sm placeholder:text-white/35"
            onKeyDown={(event) => {
              if (event.key === 'Enter') loadPosts()
            }}
          />
          <button onClick={loadPosts} className="rounded-[8px] bg-white px-4 py-2 text-sm font-semibold text-black">Search</button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-[8px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
      {notice && <p className="mb-4 rounded-[8px] border border-[#d7ff55]/25 bg-[#d7ff55]/10 p-3 text-sm text-[#efffbd]">{notice}</p>}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[520px] animate-pulse rounded-[20px] bg-white/7" />
          ))}
        </div>
      ) : posts.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const images = blendImages(post.images)
            const hashtags = post.hashtags || []
            const meta = [
              { key: 'occasion', value: post.occasion },
              { key: 'style', value: post.style },
              { key: 'season', value: post.season }
            ].filter((item) => Boolean(item.value))
            const createdAt = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''

            return (
              <article key={post._id} className="glass overflow-hidden rounded-[20px] border border-white/10 shadow-lg shadow-black/10">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/10">
                        {post.author?.avatar ? (
                          <Image src={post.author.avatar} alt={post.author.name || 'Avatar'} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-white/60">{post.author?.name?.charAt(0) || 'F'}</div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{post.author?.name || 'Noir Closet Creator'}</p>
                        <p className="text-xs text-white/45">@{post.author?.handle || 'styledrop'} · {createdAt}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.pinned && <span className="rounded-full bg-[#d7ff55]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7ff55]">Pinned</span>}
                      <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/55">{typeLabels[post.type || 'outfit']}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
                    {post.location && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                        <MapPin className="h-3.5 w-3.5" /> {post.location}
                      </span>
                    )}
                    {meta.map((item) => (
                      <span key={`${item.key}-${item.value}`} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                        <Tag className="h-3.5 w-3.5" /> {item.value}
                      </span>
                    ))}
                    {!!post.metrics?.views && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                        <Eye className="h-3.5 w-3.5" /> {post.metrics.views}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    <h3 className="text-xl font-semibold text-white">{post.title || post.caption?.slice(0, 50) || 'Style moment'}</h3>
                    <p className="text-sm leading-6 text-white/65">{post.caption || 'A polished post from the Noir Closet community.'}</p>
                  </div>
                </div>

                {post.videoUrl ? (
                  <div className="relative aspect-[4/3] bg-black/20">
                    <Video className="absolute left-4 top-4 h-5 w-5 text-white/80" />
                    <Image
                      src={post.videoThumbnail || post.images?.[0] || '/images/hero-fashion.webp'}
                      alt={post.title || 'Community video'}
                      fill
                      sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : images.length ? (
                  <div className={`grid ${images.length > 1 ? 'grid-cols-2 gap-px' : ''} bg-white/10`}>
                    {images.map((image, index) => (
                      <div key={`${post._id}-${index}`} className={`relative aspect-square bg-black/25 ${index === 0 && images.length === 1 ? 'col-span-2 row-span-2' : ''}`}>
                        <Image src={image} alt={post.title || `Post image ${index + 1}`} fill sizes={images.length > 1 ? '(min-width: 1280px) 15vw, (min-width: 640px) 22vw, 50vw' : '(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw'} className="object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-white/5" />
                )}

                <div className="border-t border-white/10 p-4">
                  <div className="flex flex-wrap gap-2">
                    {hashtags.slice(0, 6).map((tag, index) => (
                      <span key={`${post._id}-tag-${tag}-${index}`} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">#{tag}</span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <button onClick={() => togglePost(post, 'like')} disabled={busyId === post._id} className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-white/5 px-4 text-white/80 transition hover:bg-white/10 disabled:cursor-progress">
                      {busyId === post._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                      <span>{post.likes?.length || 0}</span>
                    </button>
                    <button className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-white/5 px-4 text-white/80 transition hover:bg-white/10">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.metrics?.comments || 0}</span>
                    </button>
                    <button className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-white/5 px-4 text-white/80 transition hover:bg-white/10">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </button>
                    <button onClick={() => togglePost(post, 'save')} disabled={busyId === post._id} className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-white/5 px-4 text-white/80 transition hover:bg-white/10 disabled:cursor-progress">
                      <Bookmark className="h-4 w-4" />
                      <span>{post.saves?.length || 0}</span>
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/60">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold">No posts found</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/55">Try another feed, search tag, or create your first professional fashion post.</p>
          <Link href="/outfits" className="mt-5 inline-flex rounded-[8px] bg-[#d7ff55] px-5 py-3 text-sm font-semibold text-black">Create a post</Link>
        </div>
      )}
    </AppFrame>
  )
}
