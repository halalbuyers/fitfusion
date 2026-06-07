'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Edit3, Plus, Save, Star, Trash2, Upload, X } from 'lucide-react'
import { AppFrame } from '../../../components/AppFrame'

type Announcement = {
  _id: string
  title: string
  body: string
  description?: string
  type: 'update' | 'feature' | 'fix' | 'announcement' | 'maintenance'
  isActive: boolean
  featured: boolean
  priority: number
  displayOrder: number
  suggestedByUsername?: string
  createdAt: string
}

const blankDraft = {
  title: '',
  description: '',
  type: 'update' as Announcement['type'],
  suggestedByUsername: '',
  isActive: true,
  featured: false,
  priority: 0,
  displayOrder: 0
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [draft, setDraft] = useState(blankDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState(blankDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadAnnouncements() {
    try {
      const res = await fetch('/api/admin/announcements')
      const data = await res.json()
      setAnnouncements(Array.isArray(data.announcements) ? data.announcements : [])
    } catch {
      setAnnouncements([])
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  async function createAnnouncement(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          body: draft.description,
          priority: Number(draft.priority),
          displayOrder: Number(draft.displayOrder),
          status: 'published'
        })
      })
      if (!res.ok) throw new Error('Save failed')
      setDraft(blankDraft)
      await loadAnnouncements()
    } catch (error: any) {
      setError(error?.message || 'Unable to save announcement')
    } finally {
      setSaving(false)
    }
  }

  async function updateAnnouncement(id: string, update: Partial<Announcement>) {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'Update failed')
    const updated = data.announcement || update
    setAnnouncements((current) => current.map((item) => item._id === id ? { ...item, ...updated } as Announcement : item))
  }

  function startEditing(announcement: Announcement) {
    setEditingId(announcement._id)
    setEditDraft({
      title: announcement.title,
      description: announcement.description || announcement.body,
      type: announcement.type,
      suggestedByUsername: announcement.suggestedByUsername || '',
      isActive: announcement.isActive,
      featured: announcement.featured,
      priority: Number(announcement.priority || 0),
      displayOrder: Number(announcement.displayOrder || 0)
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError('')
    try {
      await updateAnnouncement(id, {
        ...editDraft,
        body: editDraft.description,
        priority: Number(editDraft.priority),
        displayOrder: Number(editDraft.displayOrder)
      } as Partial<Announcement>)
      setEditingId(null)
    } catch (error: any) {
      setError(error?.message || 'Unable to update announcement')
    } finally {
      setSaving(false)
    }
  }

  async function deleteAnnouncement(id: string) {
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
    setAnnouncements((current) => current.filter((item) => item._id !== id))
  }

  return (
    <AppFrame title="Announcements" eyebrow="Admin" action={<Link href="/admin" className="hidden rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 md:inline-flex">Admin home</Link>}>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_380px]">
        <section className="glass rounded-[8px] border border-white/10 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-white/40">Announcement feed</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Manage active updates</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Star className="h-5 w-5 text-[#d9ff5a]" />
              Featured announcements appear first in the top bar.
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {announcements.map((announcement) => (
              <div id={announcement._id} key={announcement._id} className="rounded-[8px] border border-white/10 bg-[#0a0c11]/80 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/40">
                      <span className="rounded-full bg-white/5 px-2.5 py-1">{announcement.type}</span>
                      <span className="rounded-full bg-white/5 px-2.5 py-1">Order {announcement.displayOrder || 0}</span>
                      <span className="rounded-full bg-white/5 px-2.5 py-1">Priority {announcement.priority}</span>
                      {announcement.featured ? <span className="rounded-full bg-[#d9ff5a]/10 px-2.5 py-1 text-[#d9ff5a]">Featured</span> : null}
                      {!announcement.isActive ? <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/60">Inactive</span> : null}
                    </div>

                    {editingId === announcement._id ? (
                      <div className="grid gap-3">
                        <input className="field" value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} />
                        <textarea className="field min-h-[96px]" value={editDraft.description} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} />
                        <div className="grid gap-3 md:grid-cols-4">
                          <select className="field" value={editDraft.type} onChange={(event) => setEditDraft({ ...editDraft, type: event.target.value as Announcement['type'] })}>
                            <option value="update">Update</option>
                            <option value="feature">Feature</option>
                            <option value="fix">Fix</option>
                            <option value="announcement">News</option>
                            <option value="maintenance">Notice</option>
                          </select>
                          <input className="field" value={editDraft.suggestedByUsername} onChange={(event) => setEditDraft({ ...editDraft, suggestedByUsername: event.target.value })} placeholder="Username" />
                          <input className="field" type="number" value={editDraft.displayOrder} onChange={(event) => setEditDraft({ ...editDraft, displayOrder: Number(event.target.value) })} placeholder="Order" />
                          <input className="field" type="number" value={editDraft.priority} onChange={(event) => setEditDraft({ ...editDraft, priority: Number(event.target.value) })} placeholder="Priority" />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-white/70">
                          <label className="flex items-center gap-2"><input type="checkbox" checked={editDraft.isActive} onChange={(event) => setEditDraft({ ...editDraft, isActive: event.target.checked })} className="h-4 w-4 accent-[#d9ff5a]" /> Active</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={editDraft.featured} onChange={(event) => setEditDraft({ ...editDraft, featured: event.target.checked })} className="h-4 w-4 accent-[#d9ff5a]" /> Featured</label>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                        <p className="text-sm leading-6 text-white/70">{announcement.description || announcement.body}</p>
                        {announcement.suggestedByUsername ? <p className="text-sm text-white/50">Suggested by @{announcement.suggestedByUsername}</p> : null}
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {editingId === announcement._id ? (
                      <>
                        <button type="button" onClick={() => saveEdit(announcement._id)} disabled={saving} className="icon-button h-10 rounded-full px-3 text-sm text-[#d9ff5a]"><Save className="mr-2 h-4 w-4" />Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="icon-button h-10 rounded-full px-3 text-sm"><X className="mr-2 h-4 w-4" />Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => startEditing(announcement)} className="icon-button h-10 rounded-full px-3 text-sm"><Edit3 className="mr-2 h-4 w-4" />Edit</button>
                        <button type="button" onClick={() => updateAnnouncement(announcement._id, { isActive: !announcement.isActive })} className="icon-button h-10 rounded-full px-3 text-sm">{announcement.isActive ? 'Deactivate' : 'Activate'}</button>
                        <button type="button" onClick={() => updateAnnouncement(announcement._id, { featured: !announcement.featured })} className={`icon-button h-10 rounded-full px-3 text-sm ${announcement.featured ? 'bg-[#d9ff55] text-black' : ''}`}>{announcement.featured ? 'Unfeature' : 'Feature'}</button>
                      </>
                    )}
                    <button type="button" onClick={() => deleteAnnouncement(announcement._id)} className="icon-button h-10 rounded-full px-3 text-sm text-red-300">
                      <Trash2 className="mr-2 h-4 w-4" />Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!announcements.length ? (
              <div className="rounded-[8px] border border-dashed border-white/10 bg-black/20 p-8 text-center text-white/60">No announcements available yet.</div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="glass rounded-[8px] border border-white/10 p-6">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <Upload className="h-5 w-5 text-[#d9ff5a]" />
              <div>
                <p className="font-semibold text-white">Publish new announcement</p>
                <p className="text-sm text-white/50">Create announcements for the premium top bar.</p>
              </div>
            </div>
            {error ? <p className="mt-4 rounded-[8px] bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
            <form onSubmit={createAnnouncement} className="mt-5 space-y-3">
              <input className="field" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" required />
              <textarea className="field min-h-[120px]" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Description" required />
              <select className="field" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as Announcement['type'] })}>
                <option value="update">Update</option>
                <option value="feature">Feature</option>
                <option value="fix">Fix</option>
                <option value="announcement">News</option>
                <option value="maintenance">Notice</option>
              </select>
              <input className="field" value={draft.suggestedByUsername} onChange={(event) => setDraft({ ...draft, suggestedByUsername: event.target.value })} placeholder="Suggested by username" />
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-2 text-sm text-white/70">
                  Order
                  <input className="field" type="number" min="0" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: Number(event.target.value) })} />
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  Priority
                  <input className="field" type="number" min="0" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: Number(event.target.value) })} />
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  Featured
                  <select className="field" value={draft.featured ? 'yes' : 'no'} onChange={(event) => setDraft({ ...draft, featured: event.target.value === 'yes' })}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-3 text-sm text-white/70">
                <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} className="h-4 w-4 accent-[#d9ff5a]" />
                Active now
              </label>
              <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#d9ff5a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e7ff8f] disabled:opacity-60">
                <Plus className="h-4 w-4" />
                {saving ? 'Publishing...' : 'Publish announcement'}
              </button>
            </form>
          </div>
          <div className="rounded-[8px] border border-white/10 bg-[#0b0d13]/80 p-6 text-sm text-white/70">
            <p className="font-semibold text-white">How this works</p>
            <ul className="mt-4 space-y-2">
              <li>- Featured items appear first when featured is enabled.</li>
              <li>- Display order controls sequence after featured sorting.</li>
              <li>- Dismissed users see the bar again when the feed changes.</li>
              <li>- Clicking announcements routes to the public updates page.</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppFrame>
  )
}
