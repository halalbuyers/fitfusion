"use client"

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { AlertTriangle, Check, Cloud, Loader2, RotateCcw, Sparkles, Upload, X } from 'lucide-react'
import Toast from './Toast'
import { displayReviewValue, reviewCategories, reviewColors, reviewSeasons, reviewStyles } from '../lib/review-options'
import { getAllowedCategoriesForFashionType } from '../lib/fashion-profile-categories'

const fits = ['regular', 'oversized', 'slim', 'baggy']

type Draft = {
  image: string
  category: string
  primaryColor: string
  secondaryColors: string[]
  colors: string[]
  style: string
  season: string
  occasion: string[]
  tags: string[]
  brand?: string
  fit?: string
  fitType?: string
  material?: string
  aiCategory: string
  aiColor: string
  categoryConfidence: number
  colorConfidence: number
}

type ReviewForm = {
  category: string
  primaryColor: string
  secondaryColors: string
  style: string
  season: string
  tags: string
  brand: string
}

function toCsv(values?: string[]) {
  return (values || []).join(', ')
}

function splitCsv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function uniqueColorList(values: string[]) {
  return [...new Set(values.map((color) => color.trim().toLowerCase()).filter((color) => color && color !== 'unknown'))]
}

function confidenceTone(confidence: number) {
  if (confidence >= 90) return 'border-emerald-300/25 bg-emerald-300/12 text-emerald-100'
  if (confidence >= 75) return 'border-[#d7ff55]/25 bg-[#d7ff55]/10 text-[#e8ff91]'
  return 'border-amber-300/25 bg-amber-300/12 text-amber-100'
}

function PredictionMeta({ label, value, confidence }: { label: string; value: string; confidence: number }) {
  const needsReview = confidence < 75
  return (
    <div className="rounded-[8px] border border-white/10 bg-black/22 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">{label}</p>
          <p className="mt-1 text-sm font-medium capitalize text-white">{displayReviewValue(value)}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${confidenceTone(confidence)}`}>{confidence}%</span>
      </div>
      {needsReview ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-100/85">
          <AlertTriangle className="h-3.5 w-3.5" />
          Please verify this prediction.
        </div>
      ) : null}
    </div>
  )
}

export default function UploadClothing({ onUploaded }: { onUploaded?: (data: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [autoSaveHighConfidence, setAutoSaveHighConfidence] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [fashionProfile, setFashionProfile] = useState<{ fashionType?: string } | null>(null)
  const [form, setForm] = useState({
    category: '',
    primaryColor: '',
    secondaryColors: '',
    style: '',
    season: '',
    occasion: '',
    brand: '',
    fit: '',
    material: '',
    tags: ''
  })
  const [review, setReview] = useState<ReviewForm>({
    category: '',
    primaryColor: '',
    secondaryColors: '',
    style: '',
    season: '',
    tags: '',
    brand: ''
  })

  const correctedByUser = useMemo(() => {
    if (!draft) return false
    return review.category !== draft.aiCategory
      || review.primaryColor !== draft.aiColor
      || review.secondaryColors !== toCsv(draft.secondaryColors)
      || review.style !== draft.style
      || review.season !== draft.season
      || review.tags !== toCsv(draft.tags)
      || review.brand !== (draft.brand || '')
  }, [draft, review])
  const currentStep = saving ? 4 : draft ? 3 : loading ? 2 : preview ? 1 : 0
  const steps = ['Upload', 'AI analysis', 'Review', 'Save']

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateReview(key: keyof ReviewForm, value: string) {
    setReview((current) => ({ ...current, [key]: value }))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setDraft(null)
  }

  function resetUpload() {
    setFile(null)
    setPreview(null)
    setDraft(null)
    setReview({ category: '', primaryColor: '', secondaryColors: '', style: '', season: '', tags: '', brand: '' })
  }

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/fashion-profile')
        if (!response.ok) return
        const profile = await response.json()
        setFashionProfile(profile)
      } catch {
        return
      }
    }

    loadProfile()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setToast({ message: 'Choose an image first', type: 'error' })
      return
    }
    const body = new FormData()
    body.append('file', file)
    body.append('autoSaveHighConfidence', String(autoSaveHighConfidence))
    Object.entries(form).forEach(([key, value]) => {
      if (value) body.append(key, value)
    })
    setLoading(true)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      if (data.autoSaved) {
        onUploaded?.(data)
        setToast({ message: 'High-confidence item saved automatically', type: 'success' })
        resetUpload()
        return
      }
      const nextDraft = data.draft as Draft
      setDraft(nextDraft)
      setReview({
        category: nextDraft.category || 'other',
        primaryColor: nextDraft.primaryColor || 'unknown',
        secondaryColors: toCsv(nextDraft.secondaryColors),
        style: nextDraft.style || 'casual',
        season: nextDraft.season || 'all-season',
        tags: toCsv(nextDraft.tags),
        brand: nextDraft.brand || ''
      })
      setToast({ message: 'Analysis ready. Review before saving.', type: 'success' })
    } catch (error) {
      setToast({ message: 'Upload failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = React.useMemo(() => {
    if (!fashionProfile?.fashionType) return reviewCategories
    return [...new Set(['other', ...getAllowedCategoriesForFashionType(fashionProfile.fashionType)])]
  }, [fashionProfile])

  async function saveReviewedItem() {
    if (!draft) return
    setSaving(true)
    try {
      const res = await fetch('/api/wardrobe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: draft.image,
          category: review.category,
          primaryColor: review.primaryColor,
          secondaryColors: uniqueColorList(splitCsv(review.secondaryColors)).filter((color) => color !== review.primaryColor),
          colors: uniqueColorList([review.primaryColor, ...splitCsv(review.secondaryColors)]),
          style: review.style,
          season: review.season,
          tags: splitCsv(review.tags),
          brand: review.brand,
          occasion: draft.occasion,
          fit: draft.fit,
          fitType: draft.fitType,
          material: draft.material,
          aiCategory: draft.aiCategory,
          aiColor: draft.aiColor,
          categoryConfidence: draft.categoryConfidence,
          colorConfidence: draft.colorConfidence,
          correctedByUser
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      onUploaded?.(data)
      setToast({ message: correctedByUser ? 'Saved with your corrections' : 'Saved to wardrobe', type: 'success' })
      resetUpload()
    } catch (error) {
      setToast({ message: 'Save failed', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, index) => {
          const active = currentStep >= index + 1
          const current = currentStep === index + 1
          return (
            <div key={step} className={`rounded-[8px] border px-2 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${active ? 'border-[#d7ff55]/35 bg-[#d7ff55]/10 text-[#e8ff91]' : 'border-white/10 bg-white/[0.035] text-white/38'}`}>
              <div className={`mx-auto mb-1 grid h-6 w-6 place-items-center rounded-full ${active ? 'bg-[#d7ff55] text-black' : 'bg-white/8 text-white/45'}`}>
                {active && !current ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span className="block truncate">{step}</span>
            </div>
          )
        })}
      </div>
      <form onSubmit={submit} className="grid gap-5">
        <label htmlFor="wardrobe-upload-file" className="group relative flex min-h-[260px] cursor-pointer items-center justify-center overflow-hidden rounded-[8px] border border-dashed border-white/15 bg-white/[0.04] transition hover:border-white/35 hover:bg-white/[0.07]">
          <input id="wardrobe-upload-file" name="file" type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {preview ? (
            <Image src={preview} alt="Clothing upload preview" fill sizes="(min-width: 1024px) 360px, 90vw" className="object-contain p-4" unoptimized />
          ) : (
            <div className="flex max-w-xs flex-col items-center gap-3 px-4 text-center text-white/55">
              <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-white text-black">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Upload wardrobe image</p>
                <p className="mt-1 text-xs text-white/45">Noir Closet will analyze it, then you confirm before save.</p>
              </div>
            </div>
          )}
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <select id="upload-category" name="category" aria-label="Upload category" value={form.category} onChange={(e) => update('category', e.target.value)} className="field">
            <option value="">Auto category</option>
            {categoryOptions.map((item) => <option key={item} value={item}>{displayReviewValue(item)}</option>)}
          </select>
          <select id="upload-primary-color" name="primaryColor" aria-label="Upload primary color" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className="field">
            <option value="">Auto color</option>
            {reviewColors.map((item) => <option key={item} value={item}>{item === 'gray' ? 'Grey' : displayReviewValue(item)}</option>)}
          </select>
          <input id="upload-secondary-colors" name="secondaryColors" aria-label="Upload secondary colors" value={form.secondaryColors} onChange={(e) => update('secondaryColors', e.target.value)} placeholder="secondary colors" className="field" />
          <select id="upload-style" name="style" aria-label="Upload style" value={form.style} onChange={(e) => update('style', e.target.value)} className="field">
            <option value="">Auto style</option>
            {reviewStyles.map((item) => <option key={item} value={item}>{displayReviewValue(item)}</option>)}
          </select>
          <select id="upload-season" name="season" aria-label="Upload season" value={form.season} onChange={(e) => update('season', e.target.value)} className="field">
            <option value="">Auto season</option>
            {reviewSeasons.map((item) => <option key={item} value={item}>{displayReviewValue(item)}</option>)}
          </select>
          <input id="upload-occasion" name="occasion" aria-label="Upload occasion" value={form.occasion} onChange={(e) => update('occasion', e.target.value)} placeholder="casual, college, date night" className="field" />
          <input id="upload-brand" name="brand" aria-label="Upload brand" value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="brand" className="field" />
          <select id="upload-fit" name="fit" aria-label="Upload fit" value={form.fit} onChange={(e) => update('fit', e.target.value)} className="field">
            <option value="">Auto fit</option>
            {fits.map((item) => <option key={item} value={item}>{displayReviewValue(item)}</option>)}
          </select>
          <input id="upload-material" name="material" aria-label="Upload material" value={form.material} onChange={(e) => update('material', e.target.value)} placeholder="cotton, denim, fleece" className="field" />
        </div>

        <input id="upload-tags" name="tags" aria-label="Upload tags" value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="tags separated by commas" className="field" />

        <label htmlFor="upload-auto-save-high-confidence" className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white/68">
          <span>Auto-save high confidence items</span>
          <input id="upload-auto-save-high-confidence" name="autoSaveHighConfidence" type="checkbox" checked={autoSaveHighConfidence} onChange={(e) => setAutoSaveHighConfidence(e.target.checked)} className="h-4 w-4 accent-[#d7ff55]" />
        </label>

        <button disabled={loading || !file} className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
          {loading ? 'Analyzing' : 'Analyze item'}
          {!loading && <Sparkles className="h-4 w-4" />}
        </button>
      </form>

      {draft ? (
        <section className="overflow-hidden rounded-[8px] border border-white/12 bg-white/[0.06] shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[320px] bg-black/28">
              <Image src={draft.image} alt="Reviewed clothing item" fill sizes="(min-width: 1024px) 32vw, 100vw" unoptimized className="object-contain p-5" />
            </div>
            <div className="grid gap-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/35">Review & Confirm</p>
                  <h3 className="mt-2 text-xl font-semibold">Verify AI analysis</h3>
                </div>
                {correctedByUser ? <span className="rounded-full border border-[#d7ff55]/25 bg-[#d7ff55]/10 px-3 py-1 text-xs text-[#e8ff91]">Edited</span> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <PredictionMeta label="Category" value={draft.aiCategory} confidence={draft.categoryConfidence} />
                <PredictionMeta label="Primary Color" value={draft.aiColor} confidence={draft.colorConfidence} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label htmlFor="review-category" className="grid gap-1 text-xs text-white/45">
                  Category
                  <select id="review-category" name="reviewCategory" value={review.category} onChange={(e) => updateReview('category', e.target.value)} className="field text-sm">
                    {categoryOptions.map((item) => <option key={item} value={item}>{displayReviewValue(item)}</option>)}
                  </select>
                </label>
                <label htmlFor="review-primary-color" className="grid gap-1 text-xs text-white/45">
                  Primary Color
                  <select id="review-primary-color" name="reviewPrimaryColor" value={review.primaryColor} onChange={(e) => updateReview('primaryColor', e.target.value)} className="field text-sm">
                    {reviewColors.map((item) => <option key={item} value={item}>{item === 'gray' ? 'Grey' : displayReviewValue(item)}</option>)}
                  </select>
                </label>
                <label htmlFor="review-secondary-colors" className="grid gap-1 text-xs text-white/45">
                  Secondary Colors
                  <input id="review-secondary-colors" name="reviewSecondaryColors" value={review.secondaryColors} onChange={(e) => updateReview('secondaryColors', e.target.value)} className="field text-sm" />
                </label>
                <label htmlFor="review-style" className="grid gap-1 text-xs text-white/45">
                  Style
                  <select id="review-style" name="reviewStyle" value={review.style} onChange={(e) => updateReview('style', e.target.value)} className="field text-sm">
                    {reviewStyles.map((item) => <option key={item} value={item}>{displayReviewValue(item)}</option>)}
                  </select>
                </label>
                <label htmlFor="review-season" className="grid gap-1 text-xs text-white/45">
                  Season
                  <select id="review-season" name="reviewSeason" value={review.season} onChange={(e) => updateReview('season', e.target.value)} className="field text-sm">
                    {reviewSeasons.map((item) => <option key={item} value={item}>{displayReviewValue(item)}</option>)}
                  </select>
                </label>
                <label htmlFor="review-brand" className="grid gap-1 text-xs text-white/45">
                  Brand
                  <input id="review-brand" name="reviewBrand" value={review.brand} onChange={(e) => updateReview('brand', e.target.value)} placeholder="brand" className="field text-sm" />
                </label>
              </div>

              <label htmlFor="review-tags" className="grid gap-1 text-xs text-white/45">
                Tags
                <input id="review-tags" name="reviewTags" value={review.tags} onChange={(e) => updateReview('tags', e.target.value)} className="field text-sm" />
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={saveReviewedItem} disabled={saving} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] px-4 text-sm font-semibold text-black transition hover:bg-[#e8ff91] disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save Item
                </button>
                <button onClick={() => setDraft(null)} className="flex h-11 items-center justify-center gap-2 rounded-[8px] border border-white/10 px-4 text-sm text-white/70 transition hover:bg-white/8">
                  <RotateCcw className="h-4 w-4" />
                  Re-analyze
                </button>
                <button onClick={resetUpload} className="flex h-11 items-center justify-center gap-2 rounded-[8px] border border-red-300/15 bg-red-400/10 px-4 text-sm text-red-100 transition hover:bg-red-400/18">
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {toast && <Toast message={toast.message} type={toast.type === 'error' ? 'error' : 'success'} onClose={() => setToast(null)} />}
    </div>
  )
}
