"use client"

import React, { useState } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import Toast from './Toast'

type Props = {
  item: any
  onClose: () => void
  onSaved: (updated: any) => void
}

function join(value: unknown) {
  return Array.isArray(value) ? value.join(', ') : String(value || '')
}

function split(value: string) {
  return value.split(',').map((part) => part.trim()).filter(Boolean)
}

export default function EditClothingModal({ item, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    category: item.category || '',
    colors: join(item.colors),
    style: item.style || '',
    season: item.season || '',
    occasion: join(item.occasion),
    tags: join(item.tags),
    brand: item.brand || '',
    fitType: item.fitType || '',
    material: item.material || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    setLoading(true)
    setError(null)
    try {
      const colors = split(form.colors)
      const body = {
        category: form.category,
        color: colors[0] || item.color || 'black',
        colors,
        style: form.style,
        season: form.season,
        occasion: split(form.occasion),
        tags: split(form.tags),
        brand: form.brand,
        fitType: form.fitType,
        material: form.material
      }
      const res = await fetch(`/api/wardrobe/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Save failed')
      const updated = await res.json()
      onSaved(updated)
      setToast({ message: 'Wardrobe item updated', type: 'success' })
      setTimeout(onClose, 500)
    } catch (e: any) {
      setError(e.message || 'Failed to save item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button aria-label="Close edit modal" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-[8px] border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/35">Wardrobe editor</p>
            <h3 className="mt-2 text-xl font-semibold">Edit clothing item</h3>
          </div>
          <button title="Close" onClick={onClose} className="icon-button h-9 w-9">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input className="field" value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="category" />
          <input className="field" value={form.colors} onChange={(e) => update('colors', e.target.value)} placeholder="colors, comma separated" />
          <input className="field" value={form.style} onChange={(e) => update('style', e.target.value)} placeholder="style" />
          <input className="field" value={form.season} onChange={(e) => update('season', e.target.value)} placeholder="season" />
          <input className="field" value={form.occasion} onChange={(e) => update('occasion', e.target.value)} placeholder="occasion, comma separated" />
          <input className="field" value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="brand" />
          <input className="field" value={form.fitType} onChange={(e) => update('fitType', e.target.value)} placeholder="fit type" />
          <input className="field" value={form.material} onChange={(e) => update('material', e.target.value)} placeholder="material" />
        </div>

        <input className="field mt-3" value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="tags, comma separated" />

        {error && <div className="mt-4 rounded-[8px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[8px] border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/8">Cancel</button>
          <button onClick={save} disabled={loading} className="flex items-center gap-2 rounded-[8px] bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </div>

        {toast && <Toast message={toast.message} type={toast.type === 'error' ? 'error' : 'success'} onClose={() => setToast(null)} />}
      </div>
    </div>
  )
}
