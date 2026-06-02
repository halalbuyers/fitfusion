"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { Heart, Loader2, Palette, Save, Shirt, Sparkles, UserRound } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

export default function ProfilePage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({ wardrobe: 0, outfits: 0 })
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
      const [profileRes, wardrobeRes, outfitsRes] = await Promise.allSettled([
        fetch('/api/profile').then((res) => res.json()),
        fetch('/api/wardrobe').then((res) => res.json()),
        fetch('/api/outfits').then((res) => res.json())
      ])
      const data = profileRes.status === 'fulfilled' ? profileRes.value : null
      const wardrobe = wardrobeRes.status === 'fulfilled' && Array.isArray(wardrobeRes.value) ? wardrobeRes.value : []
      const outfits = outfitsRes.status === 'fulfilled' && Array.isArray(outfitsRes.value) ? outfitsRes.value : []
      setStats({ wardrobe: wardrobe.length, outfits: outfits.length })
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
    <AppFrame title="Profile dashboard" eyebrow="Personalization">
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <section className="glass h-fit rounded-[8px] p-5">
          <div className="flex items-center gap-4">
            <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-[8px] bg-white text-black">
              {user?.imageUrl ? <Image src={user.imageUrl} alt={user.fullName || 'Profile'} fill sizes="64px" className="object-cover" /> : <UserRound className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="font-semibold">{user?.fullName || 'FitFusion user'}</h2>
              <p className="text-sm text-white/45">{user?.primaryEmailAddress?.emailAddress || 'Signed in with Clerk'}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[8px] border border-white/10 bg-black/22 p-3">
              <Shirt className="h-4 w-4 text-[#d7ff55]" />
              <p className="mt-3 text-2xl font-semibold">{stats.wardrobe}</p>
              <p className="text-xs text-white/45">Wardrobe count</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-black/22 p-3">
              <Sparkles className="h-4 w-4 text-[#d7ff55]" />
              <p className="mt-3 text-2xl font-semibold">{stats.outfits}</p>
              <p className="text-xs text-white/45">Outfit count</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-black/22 p-3">
              <Heart className="h-4 w-4 text-[#d7ff55]" />
              <p className="mt-3 truncate text-lg font-semibold">{form.stylePreferences.split(',')[0] || 'Learning'}</p>
              <p className="text-xs text-white/45">Favorite style</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-black/22 p-3">
              <Palette className="h-4 w-4 text-[#d7ff55]" />
              <p className="mt-3 truncate text-lg font-semibold">{form.favoriteColors.split(',')[0] || 'Learning'}</p>
              <p className="text-xs text-white/45">Favorite colors</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-white/50">Profile details tune outfit generation, sizing notes, color bias, and stylist chat answers.</p>
        </section>

        <section className="glass rounded-[8px] p-5">
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
