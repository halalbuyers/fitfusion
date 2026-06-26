"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { Heart, Loader2, Palette, Save, Settings, Shirt, Sparkles, UserRound } from 'lucide-react'
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
    profilePhoto: '',
    coverPhoto: '',
    bio: '',
    website: '',
    styleType: '',
    favoriteBrands: '',
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
        profilePhoto: data?.profilePhoto || user?.imageUrl || '',
        coverPhoto: data?.coverPhoto || '',
        bio: data?.bio || '',
        website: data?.website || '',
        styleType: data?.styleType || '',
        favoriteBrands: (data?.favoriteBrands || []).join(', '),
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
    <AppFrame title="Profile dashboard" eyebrow="Noir Closet Fashion OS" action={<Link href="/settings/fashion-profile" className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/20"><Settings className="h-4 w-4" /> Fashion Preferences</Link>}>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass h-fit rounded-[8px] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-[18px] bg-white text-black">
              {form.profilePhoto ? <Image src={form.profilePhoto} alt={form.name || 'Profile'} fill sizes="80px" className="object-cover" /> : <UserRound className="h-8 w-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{form.name || user?.fullName || 'Noir Closet user'}</h2>
              <p className="mt-1 text-sm text-white/45">{form.bio || 'Build your professional fashion profile.'}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[8px] border border-white/10 bg-black/22 p-4">
              <Shirt className="h-4 w-4 text-[#d7ff55]" />
              <p className="mt-3 text-3xl font-semibold">{stats.wardrobe}</p>
              <p className="text-xs text-white/45">Wardrobe items</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-black/22 p-4">
              <Sparkles className="h-4 w-4 text-[#d7ff55]" />
              <p className="mt-3 text-3xl font-semibold">{stats.outfits}</p>
              <p className="text-xs text-white/45">Saved looks</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-black/22 p-4">
              <Heart className="h-4 w-4 text-[#d7ff55]" />
              <p className="mt-3 truncate text-xl font-semibold">{form.styleType || 'Style type'}</p>
              <p className="text-xs text-white/45">Primary aesthetic</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-black/22 p-4">
              <Palette className="h-4 w-4 text-[#d7ff55]" />
              <p className="mt-3 truncate text-xl font-semibold">{form.favoriteBrands.split(',')[0] || 'Brands'}</p>
              <p className="text-xs text-white/45">Favorite brands</p>
            </div>
          </div>

          {form.coverPhoto && (
            <div className="mt-5 overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
              <Image src={form.coverPhoto} alt="Profile cover" width={1200} height={450} className="h-44 w-full object-cover" />
            </div>
          )}

          <p className="mt-5 text-sm leading-6 text-white/50">Your profile is the home for your fashion portfolio, saved inspiration, and brand identity across the community.</p>
        </section>

        <section className="glass rounded-[8px] p-5">
          {loading ? (
            <div className="h-72 animate-pulse rounded-[8px] bg-white/7" />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <input id="profile-name" name="name" autoComplete="name" aria-label="Full name" className="field" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" />
                <input id="profile-email" name="email" type="email" autoComplete="email" aria-label="Email" className="field" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email" />
                <input id="profile-photo" name="profilePhoto" autoComplete="url" aria-label="Profile photo URL" className="field" value={form.profilePhoto} onChange={(e) => update('profilePhoto', e.target.value)} placeholder="Profile photo URL" />
                <input id="profile-cover-photo" name="coverPhoto" autoComplete="url" aria-label="Cover photo URL" className="field" value={form.coverPhoto} onChange={(e) => update('coverPhoto', e.target.value)} placeholder="Cover photo URL" />
                <input id="profile-website" name="website" autoComplete="url" aria-label="Website or portfolio" className="field" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="Website or portfolio" />
                <input id="profile-style-type" name="styleType" aria-label="Style type" className="field" value={form.styleType} onChange={(e) => update('styleType', e.target.value)} placeholder="Style type" />
                <input id="profile-age" name="age" aria-label="Age" className="field" value={form.age} onChange={(e) => update('age', e.target.value)} placeholder="Age" />
                <input id="profile-gender" name="gender" aria-label="Gender" className="field" value={form.gender} onChange={(e) => update('gender', e.target.value)} placeholder="Gender" />
                <input id="profile-style-preferences" name="stylePreferences" aria-label="Style preferences" className="field" value={form.stylePreferences} onChange={(e) => update('stylePreferences', e.target.value)} placeholder="Style preferences" />
                <input id="profile-favorite-brands" name="favoriteBrands" aria-label="Favorite brands" className="field" value={form.favoriteBrands} onChange={(e) => update('favoriteBrands', e.target.value)} placeholder="Favorite brands" />
                <input id="profile-favorite-colors" name="favoriteColors" aria-label="Favorite colors" className="field" value={form.favoriteColors} onChange={(e) => update('favoriteColors', e.target.value)} placeholder="Favorite colors" />
                <input id="profile-top-size" name="topSize" aria-label="Top size" className="field" value={form.topSize} onChange={(e) => update('topSize', e.target.value)} placeholder="Top size" />
                <input id="profile-bottom-size" name="bottomSize" aria-label="Bottom size" className="field" value={form.bottomSize} onChange={(e) => update('bottomSize', e.target.value)} placeholder="Bottom size" />
                <input id="profile-shoe-size" name="shoeSize" aria-label="Shoe size" className="field" value={form.shoeSize} onChange={(e) => update('shoeSize', e.target.value)} placeholder="Shoe size" />
              </div>
              <textarea
                id="profile-bio"
                name="bio"
                aria-label="Bio or style summary"
                rows={4}
                className="field mt-3 min-h-[120px]"
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="Bio / style summary"
              />
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
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
