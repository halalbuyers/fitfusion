"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Cloud, Loader2, Sparkles, Upload } from 'lucide-react'
import Toast from './Toast'

const categories = ['t-shirt', 'shirt', 'hoodie', 'jacket', 'jeans', 'cargos', 'pants', 'shorts', 'sneakers', 'shoes', 'accessories']
const styles = ['minimal', 'streetwear', 'formal', 'athleisure', 'vintage', 'luxury']
const seasons = ['all-season', 'summer', 'winter', 'spring', 'autumn']

export default function UploadClothing({ onUploaded }: { onUploaded?: (data: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [form, setForm] = useState({
    category: '',
    color: '',
    style: '',
    season: 'all-season',
    occasion: '',
    brand: '',
    fitType: '',
    material: '',
    tags: ''
  })

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setToast({ message: 'Choose an image first', type: 'error' })
      return
    }
    const body = new FormData()
    body.append('file', file)
    Object.entries(form).forEach(([key, value]) => {
      if (value) body.append(key, value)
    })
    setLoading(true)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onUploaded?.(data)
      setToast({ message: data.persisted === false ? 'Uploaded with local fallback' : 'Added to wardrobe', type: 'success' })
      setFile(null)
      setPreview(null)
    } catch (error) {
      console.error(error)
      setToast({ message: 'Upload failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <label className="group relative flex min-h-[260px] cursor-pointer items-center justify-center overflow-hidden rounded-[8px] border border-dashed border-white/15 bg-white/[0.04] transition hover:border-white/35 hover:bg-white/[0.07]">
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        {preview ? (
          <Image src={preview} alt="Clothing upload preview" fill sizes="(min-width: 1024px) 360px, 90vw" className="object-contain p-4" unoptimized />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center text-white/55">
            <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-white text-black">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Upload wardrobe image</p>
              <p className="mt-1 text-xs text-white/45">AI will try to tag it, manual fields stay in control.</p>
            </div>
          </div>
        )}
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <select value={form.category} onChange={(e) => update('category', e.target.value)} className="field">
          <option value="">Auto category</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input value={form.color} onChange={(e) => update('color', e.target.value)} placeholder="primary color" className="field" />
        <select value={form.style} onChange={(e) => update('style', e.target.value)} className="field">
          <option value="">Auto style</option>
          {styles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={form.season} onChange={(e) => update('season', e.target.value)} className="field">
          {seasons.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input value={form.occasion} onChange={(e) => update('occasion', e.target.value)} placeholder="casual, college, date night" className="field" />
        <input value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="brand" className="field" />
        <input value={form.fitType} onChange={(e) => update('fitType', e.target.value)} placeholder="oversized, slim, relaxed" className="field" />
        <input value={form.material} onChange={(e) => update('material', e.target.value)} placeholder="cotton, denim, fleece" className="field" />
      </div>

      <input value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="tags separated by commas" className="field" />

      <button disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
        {loading ? 'Uploading' : 'Add clothing'}
        {!loading && <Sparkles className="h-4 w-4" />}
      </button>

      {toast && <Toast message={toast.message} type={toast.type === 'error' ? 'error' : 'success'} onClose={() => setToast(null)} />}
    </form>
  )
}
