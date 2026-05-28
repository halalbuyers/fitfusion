"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2, Save, UserRound } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

export default function ProfilePage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    stylePreferences: '',
    favoriteColors: '',
    topSize: '',
    bottomSize: '',
    shoeSize: ''
  })

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/profile')
      const data = await res.json().catch(() => null)
      setForm({
        name: data?.name || user?.fullName || '',
        email: data?.email || user?.primaryEmailAddress?.emailAddress || '',
        age: data?.age ? String(data.age) : '',
        gender: data?.gender || '',
        stylePreferences: (data?.stylePreferences || []).join(', '),
        favoriteColors: (data?.favoriteColors || []).join(', '),
        topSize: data?.sizes?.top || '',
        bottomSize: data?.sizes?.bottom || '',
        shoeSize: data?.sizes?.shoe || ''
      })
      setLoading(false)
    }
    if (user) load()
  }, [user])

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Could not save profile')
      setMessage('Profile saved')
    } catch (error: any) {
      setMessage(error.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppFrame title="Profile setup" eyebrow="Personalization">
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <section className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-white text-black">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">{user?.fullName || 'FitFusion user'}</h2>
              <p className="text-sm text-white/45">{user?.primaryEmailAddress?.emailAddress || 'Signed in with Clerk'}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-white/50">Profile details tune outfit generation, sizing notes, color bias, and stylist chat answers.</p>
        </section>

        <section className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          {loading ? (
            <div className="h-72 animate-pulse rounded-[8px] bg-white/7" />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="name" />
                <input className="field" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email" />
                <input className="field" value={form.age} onChange={(e) => update('age', e.target.value)} placeholder="age" />
                <input className="field" value={form.gender} onChange={(e) => update('gender', e.target.value)} placeholder="gender" />
                <input className="field" value={form.stylePreferences} onChange={(e) => update('stylePreferences', e.target.value)} placeholder="minimal, streetwear, formal" />
                <input className="field" value={form.favoriteColors} onChange={(e) => update('favoriteColors', e.target.value)} placeholder="black, white, olive" />
                <input className="field" value={form.topSize} onChange={(e) => update('topSize', e.target.value)} placeholder="top size" />
                <input className="field" value={form.bottomSize} onChange={(e) => update('bottomSize', e.target.value)} placeholder="bottom size" />
                <input className="field" value={form.shoeSize} onChange={(e) => update('shoeSize', e.target.value)} placeholder="shoe size" />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save profile
                </button>
                {message && <span className="text-sm text-white/50">{message}</span>}
              </div>
            </>
          )}
        </section>
      </div>
    </AppFrame>
  )
}
