'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Save, AlertCircle, Check, Loader2, ArrowLeft, RotateCcw } from 'lucide-react'
import { AppFrame } from '../../../components/AppFrame'

const STYLE_OPTIONS = [
  'Streetwear',
  'Minimalist',
  'Casual',
  'Formal',
  'Business Casual',
  'Luxury',
  'Vintage',
  'Athleisure',
  'Sporty',
  'Ethnic',
  'Traditional',
  'Smart Casual'
]

const COLOR_OPTIONS = [
  'Black',
  'White',
  'Grey',
  'Navy',
  'Blue',
  'Light Blue',
  'Beige',
  'Cream',
  'Brown',
  'Olive',
  'Green',
  'Red',
  'Burgundy',
  'Pink',
  'Purple',
  'Yellow',
  'Orange'
]

const OCCASION_OPTIONS = [
  'College',
  'Work',
  'Daily Wear',
  'Gym',
  'Travel',
  'Date Night',
  'Party',
  'Wedding',
  'Festival',
  'Formal Events'
]

const FASHION_GOALS = [
  'Dress Better',
  'Save Time',
  'Get Outfit Ideas',
  'Improve Style',
  'Wardrobe Organization',
  'Build Confidence',
  'Track Outfits'
]

export default function FashionProfileSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [reanalysisInProgress, setReanalysisInProgress] = useState(false)
  const [reanalysisMessage, setReanalysisMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    fashionType: 'prefer-not-to-specify',
    preferredStyles: [] as string[],
    favoriteColors: [] as string[],
    preferredOccasions: [] as string[],
    fashionGoals: [] as string[]
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/fashion-profile')
        if (!response.ok) throw new Error('Failed to fetch profile')
        
        const data = await response.json()
        setFormData({
          fashionType: data.fashionType,
          preferredStyles: data.preferredStyles || [],
          favoriteColors: data.favoriteColors || [],
          preferredOccasions: data.preferredOccasions || [],
          fashionGoals: data.fashionGoals || []
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleToggleOption = (option: string, field: 'preferredStyles' | 'favoriteColors' | 'preferredOccasions' | 'fashionGoals') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(option)
        ? prev[field].filter(item => item !== option)
        : [...prev[field], option]
    }))
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    setReanalysisMessage('')

    try {
      const response = await fetch('/api/fashion-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save profile')
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReanalyzeWardrobe = async () => {
    setReanalysisInProgress(true)
    setReanalysisMessage('')
    setError('')

    try {
      const response = await fetch('/api/wardrobe/reanalyze', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Wardrobe reanalysis failed')
      setReanalysisMessage(`Updated ${data.updated} items for ${data.fashionType}.`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReanalysisInProgress(false)
    }
  }

  if (loading) {
    return (
      <AppFrame title="Fashion Profile" eyebrow="Settings">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#d7ff55]" />
        </div>
      </AppFrame>
    )
  }

  return (
    <AppFrame 
      title="Fashion Profile" 
      eyebrow="Settings"
      action={<Link href="/profile" className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/20"><ArrowLeft className="h-4 w-4" /> Back</Link>}
    >
      <div className="max-w-4xl">
        {error && (
          <div className="animate-float-in mb-6 flex items-center gap-3 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-red-200">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="animate-float-in mb-6 flex items-center gap-3 rounded-lg border border-green-400/30 bg-green-400/10 p-4 text-green-200">
            <Check className="h-5 w-5" />
            <span>Profile updated successfully</span>
          </div>
        )}

        {/* Fashion Type */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-4">Fashion Type</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Menswear', 'Womenswear', 'Both', 'Prefer Not To Specify'].map(option => (
              <button
                key={option}
                onClick={() => setFormData(prev => ({
                  ...prev,
                  fashionType: option.toLowerCase().replace(' ', '-')
                }))}
                className={`p-4 rounded-lg border-2 transition ${
                  formData.fashionType === option.toLowerCase().replace(' ', '-')
                    ? 'border-[#d7ff55] bg-[#d7ff55]/10'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="font-semibold text-white">{option}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Preferred Styles */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-4">Preferred Styles</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {STYLE_OPTIONS.map(style => (
              <button
                key={style}
                onClick={() => handleToggleOption(style, 'preferredStyles')}
                className={`p-3 rounded-lg border-2 transition text-center ${
                  formData.preferredStyles.includes(style)
                    ? 'border-[#d7ff55] bg-[#d7ff55]/10'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="text-sm font-medium text-white">{style}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Favorite Colors */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-4">Favorite Colors</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                onClick={() => handleToggleOption(color, 'favoriteColors')}
                className={`p-3 rounded-lg border-2 transition text-center ${
                  formData.favoriteColors.includes(color)
                    ? 'border-[#d7ff55] bg-[#d7ff55]/10'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="text-xs font-medium text-white">{color}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Preferred Occasions */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-4">Preferred Occasions</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {OCCASION_OPTIONS.map(occasion => (
              <button
                key={occasion}
                onClick={() => handleToggleOption(occasion, 'preferredOccasions')}
                className={`p-3 rounded-lg border-2 transition text-center ${
                  formData.preferredOccasions.includes(occasion)
                    ? 'border-[#d7ff55] bg-[#d7ff55]/10'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="text-sm font-medium text-white">{occasion}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Fashion Goals */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-4">Fashion Goals</h3>
          <div className="space-y-3">
            {FASHION_GOALS.map(goal => (
              <button
                key={goal}
                onClick={() => handleToggleOption(goal, 'fashionGoals')}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  formData.fashionGoals.includes(goal)
                    ? 'border-[#d7ff55] bg-[#d7ff55]/10'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="font-medium text-white">{goal}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <div className="flex flex-col gap-3 pt-6 border-t border-white/10 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#d7ff55] to-[#a0cc00] px-6 py-3 font-semibold text-black transition hover:shadow-lg hover:shadow-[#d7ff55]/30 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={handleReanalyzeWardrobe}
              disabled={reanalysisInProgress}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              {reanalysisInProgress ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Reanalyzing...
                </>
              ) : (
                <>
                  <RotateCcw className="h-5 w-5" />
                  Reanalyze Wardrobe
                </>
              )}
            </button>
          </div>
          {reanalysisMessage ? (
            <p className="text-sm text-white/70">{reanalysisMessage}</p>
          ) : null}
        </div>
      </div>
    </AppFrame>
  )
}
