"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Archive, BadgeCheck, CalendarDays, CheckCircle2, Eye, Mail, Megaphone, MessageSquare,
  Pencil, Pin, Plus, Search, Send, Star, Trash2, Trophy, UserPlus, XCircle
} from 'lucide-react'

type FeedbackStatus = 'pending' | 'completed' | 'published' | 'rejected' | 'open' | 'resolved' | 'archived'
type UpdateStatus = 'draft' | 'published' | 'archived'
type UpdateType = 'feature' | 'bug_fix' | 'community' | 'improvement' | 'security'

type FeedbackItem = {
  _id: string
  userId?: string
  username?: string
  name?: string
  email?: string
  profileImage?: string
  title: string
  message: string
  type?: string
  category?: string
  priority: 'low' | 'medium' | 'high'
  status: FeedbackStatus
  adminNotes?: string
  assignedTo?: string
  convertedUpdateId?: string
  createdAt?: string
}

type ContributorItem = {
  userId: string
  username: string
  email?: string
  profileImage?: string
  acceptedFeedbackCount: number
}

type UpdateItem = {
  _id: string
  title: string
  body: string
  description?: string
  type: UpdateType | 'feature' | 'update' | 'fix' | 'announcement' | 'maintenance'
  status: UpdateStatus
  priority?: number
  featured?: boolean
  pinned?: boolean
  isActive?: boolean
  credits?: string
  releaseNotes?: string
  featuredImage?: string
  creditedUserId?: string
  creditedUsername?: string
  suggestedByUsername?: string
  publishedAt?: string
  createdAt?: string
}

type UpdateDraft = {
  id?: string
  title: string
  description: string
  type: UpdateType
  status: UpdateStatus
  priority: number
  credits: string
  releaseNotes: string
  featuredImage: string
  publishedAt: string
  featured: boolean
  pinned: boolean
  published: boolean
  creditedUserId?: string
  creditedUsername?: string
}

const blankDraft: UpdateDraft = {
  title: '',
  description: '',
  type: 'improvement',
  status: 'published',
  priority: 0,
  credits: '',
  releaseNotes: '',
  featuredImage: '',
  publishedAt: '',
  featured: false,
  pinned: false,
  published: true
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  open: 'Pending',
  completed: 'Completed',
  resolved: 'Completed',
  published: 'Published',
  rejected: 'Rejected',
  archived: 'Rejected'
}

const updateTypeLabels: Record<UpdateType, string> = {
  feature: 'Feature',
  bug_fix: 'Bug Fix',
  community: 'Community',
  improvement: 'Improvement',
  security: 'Security'
}

function normalizedFeedbackStatus(status?: string) {
  if (status === 'open') return 'pending'
  if (status === 'resolved') return 'completed'
  if (status === 'archived') return 'rejected'
  return status || 'pending'
}

function displayUser(item: Pick<FeedbackItem, 'username' | 'name' | 'email'>) {
  return item.username || item.name || item.email?.split('@')[0] || 'Community'
}

function initials(value?: string) {
  const parts = String(value || 'FitFusion').trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] || 'F') + (parts[1]?.[0] || parts[0]?.[1] || 'F')
}

function UserAvatar({ item, className = 'h-10 w-10' }: { item: Pick<FeedbackItem, 'profileImage' | 'username' | 'name' | 'email'>; className?: string }) {
  const label = displayUser(item)
  return item.profileImage ? (
    <span className={`${className} relative block overflow-hidden rounded-full ring-1 ring-white/10`}>
      <Image src={item.profileImage} alt={label} fill sizes="56px" className="object-cover" />
    </span>
  ) : (
    <div className={`${className} flex items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70 ring-1 ring-white/10`}>
      {initials(label).toUpperCase()}
    </div>
  )
}

function formatDate(value?: string) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function toDateInput(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass rounded-[8px] p-4 ${className}`}>{children}</section>
}

function IconButton({ title, onClick, children, active = false, danger = false }: { title: string; onClick: () => void; children: React.ReactNode; active?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`icon-button h-9 w-9 ${active ? 'bg-[#d7ff55] text-black' : ''} ${danger ? 'text-red-300' : ''}`}
    >
      {children}
    </button>
  )
}

export function CommunityUpdatesAdmin() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [allFeedback, setAllFeedback] = useState<FeedbackItem[]>([])
  const [contributors, setContributors] = useState<ContributorItem[]>([])
  const [updates, setUpdates] = useState<UpdateItem[]>([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [detailFeedback, setDetailFeedback] = useState<FeedbackItem | null>(null)
  const [conversionFeedback, setConversionFeedback] = useState<FeedbackItem | null>(null)
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null)
  const [feedbackEdit, setFeedbackEdit] = useState({ title: '', message: '', category: '', priority: 'medium', adminNotes: '', assignedTo: '' })
  const [draft, setDraft] = useState<UpdateDraft>(blankDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadFeedback = useCallback(async () => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    if (sort) params.set('sort', sort)
    const res = await fetch(`/api/admin/feedback?${params.toString()}`).catch(() => null)
    const data = await res?.json().catch(() => ({}))
    setFeedback(Array.isArray(data?.feedback) ? data.feedback : [])
  }, [search, sort, status])

  const loadMetricsFeedback = useCallback(async () => {
    const res = await fetch('/api/admin/feedback?sort=newest').catch(() => null)
    const data = await res?.json().catch(() => ({}))
    setAllFeedback(Array.isArray(data?.feedback) ? data.feedback : [])
    setContributors(Array.isArray(data?.contributors) ? data.contributors : [])
  }, [])

  const loadUpdates = useCallback(async () => {
    const res = await fetch('/api/admin/announcements').catch(() => null)
    const data = await res?.json().catch(() => ({}))
    setUpdates(Array.isArray(data?.announcements) ? data.announcements : [])
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => loadFeedback(), 250)
    return () => window.clearTimeout(timeout)
  }, [loadFeedback])

  useEffect(() => {
    loadUpdates()
    loadMetricsFeedback()
  }, [loadMetricsFeedback, loadUpdates])

  const metrics = useMemo(() => {
    const normalized = allFeedback.map((item) => normalizedFeedbackStatus(item.status))
    return [
      { label: 'Total Feedback', value: allFeedback.length, icon: Megaphone },
      { label: 'Pending Feedback', value: normalized.filter((item) => item === 'pending').length, icon: Search },
      { label: 'Completed Feedback', value: normalized.filter((item) => item === 'completed').length, icon: CheckCircle2 },
      { label: 'Published Updates', value: updates.filter((item) => item.status === 'published' && item.isActive !== false).length, icon: BadgeCheck }
    ]
  }, [allFeedback, updates])

  function startFeedbackEdit(item: FeedbackItem) {
    setEditingFeedbackId(item._id)
    setFeedbackEdit({
      title: item.title || '',
      message: item.message || '',
      category: item.category || item.type || '',
      priority: item.priority || 'medium',
      adminNotes: item.adminNotes || '',
      assignedTo: item.assignedTo || ''
    })
  }

  async function patchFeedback(id: string, patch: Record<string, unknown>) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Could not update feedback')
      const updated = data.feedback || { _id: id, ...patch }
      setFeedback((current) => current.map((item) => item._id === id ? { ...item, ...updated } : item))
      setAllFeedback((current) => current.map((item) => item._id === id ? { ...item, ...updated } : item))
      if (detailFeedback?._id === id) setDetailFeedback((current) => current ? { ...current, ...updated } : current)
      if (conversionFeedback?._id === id) setConversionFeedback((current) => current ? { ...current, ...updated } : current)
    } catch (err: any) {
      setError(err?.message || 'Could not update feedback')
    } finally {
      setSaving(false)
    }
  }

  async function deleteFeedback(id: string) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error('Could not delete feedback')
      setFeedback((current) => current.filter((item) => item._id !== id))
      setAllFeedback((current) => current.filter((item) => item._id !== id))
      if (detailFeedback?._id === id) setDetailFeedback(null)
      if (conversionFeedback?._id === id) setConversionFeedback(null)
    } catch (err: any) {
      setError(err?.message || 'Could not delete feedback')
    } finally {
      setSaving(false)
    }
  }

  async function saveFeedbackEdit(id: string) {
    await patchFeedback(id, feedbackEdit)
    setEditingFeedbackId(null)
  }

  function prepareConversion(item: FeedbackItem) {
    const title = item.type === 'bug' ? `${item.title} Fixed` : `${item.title} Released`
    setConversionFeedback(item)
    setDraft({
      ...blankDraft,
      title,
      description: item.message,
      type: item.type === 'bug' ? 'bug_fix' : 'community',
      priority: item.priority === 'high' ? 10 : item.priority === 'medium' ? 5 : 1,
      credits: displayUser(item),
      creditedUserId: item.userId,
      creditedUsername: displayUser(item),
      releaseNotes: item.adminNotes || ''
    })
  }

  function editUpdate(item: UpdateItem) {
    setDraft({
      id: item._id,
      title: item.title || '',
      description: item.description || item.body || '',
      type: (item.type === 'fix' ? 'bug_fix' : item.type === 'update' || item.type === 'announcement' || item.type === 'maintenance' ? 'improvement' : item.type) as UpdateType,
      status: item.status || 'draft',
      priority: Number(item.priority || 0),
      credits: item.credits || item.creditedUsername || item.suggestedByUsername || '',
      releaseNotes: item.releaseNotes || '',
      featuredImage: item.featuredImage || '',
      publishedAt: toDateInput(item.publishedAt || item.createdAt),
      featured: Boolean(item.featured),
      pinned: Boolean(item.pinned),
      published: item.status === 'published' && item.isActive !== false,
      creditedUserId: item.creditedUserId,
      creditedUsername: item.creditedUsername || item.suggestedByUsername
    })
  }

  async function submitUpdate(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      title: draft.title,
      description: draft.description,
      body: draft.description,
      type: draft.type,
      status: draft.status,
      published: draft.published,
      isActive: draft.published,
      featured: draft.featured,
      pinned: draft.pinned,
      priority: Number(draft.priority || 0),
      credits: draft.credits,
      releaseNotes: draft.releaseNotes,
      featuredImage: draft.featuredImage,
      creditedUserId: draft.creditedUserId,
      creditedUsername: draft.creditedUsername || draft.credits,
      suggestedByUsername: draft.creditedUsername || draft.credits,
      publishedAt: draft.publishedAt ? new Date(draft.publishedAt).toISOString() : undefined
    }

    try {
      if (conversionFeedback && !draft.id) {
        const res = await fetch('/api/admin/feedback', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: conversionFeedback._id, action: 'convert', updatePayload: payload })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Could not convert feedback')
      } else {
        const res = await fetch(draft.id ? `/api/admin/announcements/${draft.id}` : '/api/admin/announcements', {
          method: draft.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Could not save update')
      }
      setDraft(blankDraft)
      setConversionFeedback(null)
      await Promise.all([loadFeedback(), loadMetricsFeedback(), loadUpdates()])
    } catch (err: any) {
      setError(err?.message || 'Could not save update')
    } finally {
      setSaving(false)
    }
  }

  async function patchUpdate(id: string, patch: Record<string, unknown>) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Could not update release')
      const updated = data.announcement || { _id: id, ...patch }
      setUpdates((current) => current.map((item) => item._id === id ? { ...item, ...updated } : item))
    } catch (err: any) {
      setError(err?.message || 'Could not update release')
    } finally {
      setSaving(false)
    }
  }

  async function deleteUpdate(id: string) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Could not delete release')
      setUpdates((current) => current.filter((item) => item._id !== id))
    } catch (err: any) {
      setError(err?.message || 'Could not delete release')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/48">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white/8">
                <Icon className="h-5 w-5 text-[#d7ff55]" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {error ? <div className="rounded-[8px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/8 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_160px_150px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input className="field pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user, feature, or category" />
              </div>
              <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
              <select className="field" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-white/6 text-xs uppercase tracking-[0.18em] text-white/40">
                <tr>
                  <th className="px-4 py-3">Avatar</th>
                  <th>Username</th>
                  <th>Feedback</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((item) => {
                  const rowStatus = normalizedFeedbackStatus(item.status)
                  const isEditing = editingFeedbackId === item._id
                  return (
                    <tr key={item._id} className="border-t border-white/8 align-top">
                      <td className="px-4 py-4">
                        <UserAvatar item={item} />
                      </td>
                      <td className="py-4">
                        {item.userId ? (
                          <Link href={`/admin/users/${item.userId}`} className="font-medium text-white transition hover:text-[#d7ff55]">@{displayUser(item)}</Link>
                        ) : (
                          <p className="font-medium">@{displayUser(item)}</p>
                        )}
                        <p className="mt-1 max-w-[210px] truncate text-xs text-white/42">{item.email || item.userId || 'App user'}</p>
                        <p className="mt-2 inline-flex rounded-full bg-white/8 px-2 py-1 text-[11px] capitalize text-white/52">{item.category || item.type || 'feedback'} / {item.priority}</p>
                      </td>
                      <td className="max-w-[460px] py-4">
                        {isEditing ? (
                          <div className="grid gap-2">
                            <input className="field min-w-64" value={feedbackEdit.title} onChange={(event) => setFeedbackEdit({ ...feedbackEdit, title: event.target.value })} />
                            <textarea className="field min-h-20 min-w-64" value={feedbackEdit.message} onChange={(event) => setFeedbackEdit({ ...feedbackEdit, message: event.target.value })} />
                            <div className="grid gap-2 sm:grid-cols-2">
                              <input className="field min-w-36" value={feedbackEdit.category} onChange={(event) => setFeedbackEdit({ ...feedbackEdit, category: event.target.value })} />
                              <select className="field min-w-28" value={feedbackEdit.priority} onChange={(event) => setFeedbackEdit({ ...feedbackEdit, priority: event.target.value })}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">Title:</p>
                            <p className="mt-1 text-white/82">{item.title}</p>
                            <p className="mt-3 font-medium">Message:</p>
                            <p className="mt-1 line-clamp-3 text-white/58">{item.message}</p>
                          </div>
                        )}
                      </td>
                      <td className="py-4"><span className="rounded-full bg-white/8 px-2 py-1 text-xs text-white/65">{statusLabels[rowStatus]}</span></td>
                      <td className="py-4 text-white/45">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <IconButton title="Save feedback" onClick={() => saveFeedbackEdit(item._id)}><CheckCircle2 className="h-4 w-4" /></IconButton>
                              <IconButton title="Cancel edit" onClick={() => setEditingFeedbackId(null)}><XCircle className="h-4 w-4" /></IconButton>
                            </>
                          ) : (
                            <>
                              <IconButton title="View feedback" onClick={() => setDetailFeedback(item)}><Eye className="h-4 w-4" /></IconButton>
                              <IconButton title="Edit feedback" onClick={() => startFeedbackEdit(item)}><Pencil className="h-4 w-4" /></IconButton>
                              <IconButton title="Assign feedback" onClick={() => patchFeedback(item._id, { action: 'assign', assignedTo: 'admin' })}><UserPlus className="h-4 w-4" /></IconButton>
                              <IconButton title="Complete feedback" onClick={() => patchFeedback(item._id, { action: 'complete' })}><CheckCircle2 className="h-4 w-4" /></IconButton>
                              <IconButton title="Reject feedback" onClick={() => patchFeedback(item._id, { action: 'reject' })}><XCircle className="h-4 w-4" /></IconButton>
                              <IconButton title="Convert to update" onClick={() => prepareConversion(item)} active={conversionFeedback?._id === item._id}><Send className="h-4 w-4" /></IconButton>
                              <IconButton title="Delete feedback" onClick={() => deleteFeedback(item._id)} danger><Trash2 className="h-4 w-4" /></IconButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!feedback.length ? <div className="p-6 text-center text-sm text-white/42">No feedback matches the current filters.</div> : null}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">{conversionFeedback ? 'Convert Feedback' : draft.id ? 'Edit Update' : 'Update Creator'}</p>
              <h2 className="mt-2 text-xl font-semibold">{conversionFeedback ? conversionFeedback.title : draft.id ? draft.title : 'Create Update'}</h2>
            </div>
            <button type="button" className="icon-button h-9 px-3 text-xs" onClick={() => { setDraft(blankDraft); setConversionFeedback(null) }}>Reset</button>
          </div>
          {conversionFeedback ? <p className="mt-3 rounded-[8px] bg-[#d7ff55]/10 p-3 text-sm text-[#e7ff91]">Suggested by @{displayUser(conversionFeedback)}</p> : null}
          <form onSubmit={submitUpdate} className="mt-4 grid gap-3">
            <input className="field" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" required />
            <textarea className="field min-h-28" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Description" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="field" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as UpdateType })}>
                {Object.entries(updateTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select className="field" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as UpdateStatus, published: event.target.value === 'published' })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" type="number" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: Number(event.target.value) })} placeholder="Priority" />
              <input className="field" type="date" value={draft.publishedAt} onChange={(event) => setDraft({ ...draft, publishedAt: event.target.value })} />
            </div>
            <input className="field" value={draft.credits} onChange={(event) => setDraft({ ...draft, credits: event.target.value, creditedUsername: event.target.value })} placeholder="Credits / suggested by" />
            <textarea className="field min-h-20" value={draft.releaseNotes} onChange={(event) => setDraft({ ...draft, releaseNotes: event.target.value })} placeholder="Release notes" />
            <input className="field" value={draft.featuredImage} onChange={(event) => setDraft({ ...draft, featuredImage: event.target.value })} placeholder="Featured image URL" />
            <div className="grid gap-2 text-sm text-white/70 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-[8px] border border-white/8 bg-black/20 p-3"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked, status: event.target.checked ? 'published' : 'draft' })} className="h-4 w-4 accent-[#d7ff55]" /> Published</label>
              <label className="flex items-center gap-2 rounded-[8px] border border-white/8 bg-black/20 p-3"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} className="h-4 w-4 accent-[#d7ff55]" /> Feature</label>
              <label className="flex items-center gap-2 rounded-[8px] border border-white/8 bg-black/20 p-3"><input type="checkbox" checked={draft.pinned} onChange={(event) => setDraft({ ...draft, pinned: event.target.checked })} className="h-4 w-4 accent-[#d7ff55]" /> Pin</label>
            </div>
            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] px-4 py-3 text-sm font-semibold text-black disabled:opacity-60">
              <Plus className="h-4 w-4" />
              {saving ? 'Saving...' : conversionFeedback ? 'Convert To Update' : draft.id ? 'Save Update' : 'Create Update'}
            </button>
          </form>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">Top Contributors</p>
            <h2 className="mt-2 text-xl font-semibold">Accepted feedback leaderboard</h2>
          </div>
          <Trophy className="h-5 w-5 text-[#d7ff55]" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {contributors.map((item, index) => (
            <Link key={item.userId} href={`/admin/users/${item.userId}`} className="flex items-center gap-3 rounded-[8px] border border-white/8 bg-black/20 p-3 transition hover:border-[#d7ff55]/35">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#d7ff55] text-sm font-semibold text-black">#{index + 1}</div>
              <UserAvatar item={item} className="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate font-medium">{item.username}</p>
                <p className="text-xs text-white/45">{item.acceptedFeedbackCount} accepted suggestion{item.acceptedFeedbackCount === 1 ? '' : 's'}</p>
              </div>
            </Link>
          ))}
          {!contributors.length ? <div className="rounded-[8px] border border-dashed border-white/12 p-4 text-sm text-white/42 md:col-span-3">No accepted feedback yet.</div> : null}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-white/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">Update Management</p>
            <h2 className="mt-2 text-xl font-semibold">Published announcements and product updates</h2>
          </div>
          <span className="rounded-full bg-white/8 px-3 py-2 text-sm text-white/60">{updates.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-white/6 text-xs uppercase tracking-[0.18em] text-white/40">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Credits</th>
                <th>Published Date</th>
                <th className="px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((item) => (
                <tr key={item._id} className="border-t border-white/8">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 line-clamp-1 max-w-md text-xs text-white/45">{item.description || item.body}</p>
                  </td>
                  <td className="capitalize text-white/62">{String(item.type || 'update').replace('_', ' ')}</td>
                  <td><span className="rounded-full bg-white/8 px-2 py-1 text-xs capitalize text-white/64">{item.status}{item.isActive === false ? ' / inactive' : ''}</span></td>
                  <td>{Number(item.priority || 0)}</td>
                  <td className="text-white/58">@{item.creditedUsername || item.suggestedByUsername || item.credits || 'FitFusion'}</td>
                  <td className="text-white/45">{formatDate(item.publishedAt || item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <IconButton title="Edit update" onClick={() => editUpdate(item)}><Pencil className="h-4 w-4" /></IconButton>
                      <IconButton title={item.featured ? 'Unfeature update' : 'Feature update'} onClick={() => patchUpdate(item._id, { featured: !item.featured })} active={Boolean(item.featured)}><Star className="h-4 w-4" /></IconButton>
                      <IconButton title={item.pinned ? 'Unpin update' : 'Pin update'} onClick={() => patchUpdate(item._id, { pinned: !item.pinned })} active={Boolean(item.pinned)}><Pin className="h-4 w-4" /></IconButton>
                      <IconButton title="Archive update" onClick={() => patchUpdate(item._id, { status: 'archived', isActive: false })}><Archive className="h-4 w-4" /></IconButton>
                      <IconButton title={item.isActive === false ? 'Publish update' : 'Unpublish update'} onClick={() => patchUpdate(item._id, item.isActive === false ? { status: 'published', isActive: true, published: true } : { status: 'draft', isActive: false, published: false })}>
                        {item.isActive === false ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </IconButton>
                      <IconButton title="Delete update" onClick={() => deleteUpdate(item._id)} danger><Trash2 className="h-4 w-4" /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!updates.length ? <div className="p-6 text-center text-sm text-white/42">No updates have been created yet.</div> : null}
        </div>
      </Card>

      {detailFeedback ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl overflow-hidden rounded-[8px] border border-white/10 bg-[#101010] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/8 p-5">
              <div className="flex min-w-0 items-center gap-4">
                <UserAvatar item={detailFeedback} className="h-14 w-14" />
                <div className="min-w-0">
                  {detailFeedback.userId ? (
                    <Link href={`/admin/users/${detailFeedback.userId}`} className="text-xl font-semibold text-white transition hover:text-[#d7ff55]">@{displayUser(detailFeedback)}</Link>
                  ) : (
                    <p className="text-xl font-semibold">@{displayUser(detailFeedback)}</p>
                  )}
                  <p className="mt-1 truncate text-sm text-white/45">{detailFeedback.email || detailFeedback.userId || 'No email stored'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setDetailFeedback(null)} className="icon-button h-9 w-9" title="Close feedback detail"><XCircle className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[8px] bg-black/25 p-3">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/35"><CalendarDays className="h-3.5 w-3.5" /> Submitted</p>
                  <p className="mt-2 text-sm">{formatDate(detailFeedback.createdAt)}</p>
                </div>
                <div className="rounded-[8px] bg-black/25 p-3">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/35"><MessageSquare className="h-3.5 w-3.5" /> Category</p>
                  <p className="mt-2 text-sm capitalize">{detailFeedback.category || detailFeedback.type || 'feedback'}</p>
                </div>
                <div className="rounded-[8px] bg-black/25 p-3">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/35"><BadgeCheck className="h-3.5 w-3.5" /> Status</p>
                  <p className="mt-2 text-sm">{statusLabels[normalizedFeedbackStatus(detailFeedback.status)]}</p>
                </div>
              </div>
              <div className="rounded-[8px] bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">Feedback Message</p>
                <h3 className="mt-3 text-xl font-semibold">{detailFeedback.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/68">{detailFeedback.message}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[8px] bg-black/25 p-3">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/35"><Mail className="h-3.5 w-3.5" /> Email</p>
                  <p className="mt-2 truncate text-sm">{detailFeedback.email || 'Not provided'}</p>
                </div>
                <div className="rounded-[8px] bg-black/25 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">User ID</p>
                  <p className="mt-2 truncate text-sm">{detailFeedback.userId || 'Not stored'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
