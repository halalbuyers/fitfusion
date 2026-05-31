"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, Heart, Loader2, MessageCircle, RefreshCw, Sparkles } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

type Post = {
  _id: string
  caption?: string
  images?: string[]
  likes?: string[]
  saves?: string[]
  tags?: string[]
  createdAt?: string
  outfit?: {
    title?: string
    occasion?: string
    score?: number
    items?: Array<{ clothing?: { image?: string; category?: string } }>
  }
}

const fallbackPosts: Post[] = [
  {
    _id: 'sample-1',
    caption: 'Light layers, clean contrast, and an easy everyday silhouette.',
    images: ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80'],
    likes: Array.from({ length: 42 }),
    saves: Array.from({ length: 12 }),
    tags: ['minimal', 'summer']
  },
  {
    _id: 'sample-2',
    caption: 'Streetwear proportions with a sharper color story.',
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'],
    likes: Array.from({ length: 31 }),
    saves: Array.from({ length: 9 }),
    tags: ['streetwear', 'casual']
  },
  {
    _id: 'sample-3',
    caption: 'A polished saved look for dinner plans and weekend photos.',
    images: ['https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80'],
    likes: Array.from({ length: 28 }),
    saves: Array.from({ length: 7 }),
    tags: ['date', 'formal']
  }
]

function postImages(post: Post) {
  const outfitImages = post.outfit?.items?.map((item) => item.clothing?.image).filter(Boolean) as string[] | undefined
  return (post.images?.length ? post.images : outfitImages?.length ? outfitImages : fallbackPosts[0].images || []).slice(0, 4)
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadPosts() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/posts')
      const data = await res.json()
      setPosts(Array.isArray(data) && data.length ? data : fallbackPosts)
    } catch {
      setPosts(fallbackPosts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  async function togglePost(post: Post, action: 'like' | 'save') {
    if (post._id.startsWith('sample-')) {
      setNotice('Save one of your outfits to share real posts.')
      return
    }
    setBusyId(post._id)
    setNotice('')
    setError('')
    try {
      const res = await fetch(`/api/posts/${post._id}/${action}`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `${action} failed`)
      setPosts((current) => current.map((item) => item._id === post._id ? data : item))
    } catch (e: any) {
      setError(e.message || `${action} failed`)
    } finally {
      setBusyId('')
    }
  }

  return (
    <AppFrame title="Community feed" eyebrow="Share, like, save" action={<Link href="/outfits" className="rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-black">Share outfit</Link>}>
      <div className="mb-5 flex flex-col justify-between gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold">FitFusion looks</h2>
          <p className="mt-1 text-sm text-white/45">Community posts come from outfits shared on the Saved outfits page.</p>
        </div>
        <button onClick={loadPosts} className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 px-4 text-sm text-white/70 hover:bg-white/8">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <p className="mb-4 rounded-[8px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
      {notice && <p className="mb-4 rounded-[8px] border border-[#d7ff55]/25 bg-[#d7ff55]/10 p-3 text-sm text-[#efffbd]">{notice}</p>}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[460px] animate-pulse rounded-[8px] bg-white/7" />)}
        </div>
      ) : posts.length ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {posts.map((post) => {
            const images = postImages(post)
            return (
              <article key={post._id} className="glass overflow-hidden rounded-[8px]">
                <div className="grid grid-cols-2 gap-px bg-white/10">
                  {images.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative aspect-square bg-black/35">
                      <Image
                        src={image}
                        alt={post.outfit?.items?.[index]?.clothing?.category || 'Community outfit'}
                        fill
                        sizes="(min-width: 1024px) 16vw, 45vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/35">{post.outfit?.occasion || 'community'}</p>
                      <h2 className="mt-2 font-semibold">{post.outfit?.title || 'Featured outfit'}</h2>
                    </div>
                    {typeof post.outfit?.score === 'number' && <span className="rounded-[8px] bg-white px-2.5 py-1 text-sm font-bold text-black">{post.outfit.score}</span>}
                  </div>
                  <p className="mt-3 min-h-[48px] text-sm leading-6 text-white/50">{post.caption || 'Shared from a FitFusion wardrobe.'}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(post.tags || []).slice(0, 4).map((tag) => <span key={tag} className="rounded-[8px] bg-white/8 px-2.5 py-1 text-xs capitalize text-white/55">{tag}</span>)}
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                    <button onClick={() => togglePost(post, 'like')} disabled={busyId === post._id} className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-white/8 text-white/70 hover:bg-white/14">
                      {busyId === post._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                      {post.likes?.length || 0}
                    </button>
                    <button className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-white/8 text-white/70">
                      <MessageCircle className="h-4 w-4" />
                      0
                    </button>
                    <button onClick={() => togglePost(post, 'save')} disabled={busyId === post._id} className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-white/8 text-white/70 hover:bg-white/14">
                      <Bookmark className="h-4 w-4" />
                      {post.saves?.length || 0}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-white/45" />
          <h2 className="mt-4 text-xl font-semibold">No community posts yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">Share a saved outfit to publish the first look.</p>
          <Link href="/outfits" className="mt-5 inline-flex rounded-[8px] bg-[#d7ff55] px-5 py-3 text-sm font-semibold text-black">Open saved outfits</Link>
        </div>
      )}
    </AppFrame>
  )
}
