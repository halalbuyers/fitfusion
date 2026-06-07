'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Loader2, Heart } from 'lucide-react'

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

type Step = 'welcome' | 'fashion-type' | 'styles' | 'colors' | 'occasions' | 'goals' | 'finish'

export default function OnboardingPage() {
  const router = useRouter()
  const { userId } = useAuth()
  
  const [step, setStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    fashionType: '',
    preferredStyles: [] as string[],
    favoriteColors: [] as string[],
    preferredOccasions: [] as string[],
    fashionGoals: [] as string[]
  })

  useEffect(() => {
    if (!userId) {
      router.push('/login')
    }
  }, [userId, router])

  const steps: Step[] = ['welcome', 'fashion-type', 'styles', 'colors', 'occasions', 'goals', 'finish']
  const currentStepIndex = steps.indexOf(step)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleNext = () => {
    if (step === 'fashion-type' && !formData.fashionType) {
      setError('Please select a fashion type')
      return
    }
    if (step === 'styles' && formData.preferredStyles.length === 0) {
      setError('Please select at least one style')
      return
    }
    if (step === 'colors' && formData.favoriteColors.length === 0) {
      setError('Please select at least one color')
      return
    }
    if (step === 'occasions' && formData.preferredOccasions.length === 0) {
      setError('Please select at least one occasion')
      return
    }
    if (step === 'goals' && formData.fashionGoals.length === 0) {
      setError('Please select at least one goal')
      return
    }

    setError('')
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const handlePrev = () => {
    setError('')
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  const handleToggleOption = (option: string, field: 'preferredStyles' | 'favoriteColors' | 'preferredOccasions' | 'fashionGoals') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(option)
        ? prev[field].filter(item => item !== option)
        : [...prev[field], option]
    }))
    setError('')
  }

  const handleComplete = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/fashion-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center p-4">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-[#d7ff55] to-[#a0cc00]"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d7ff55] to-[#a0cc00]">
                <Heart className="h-8 w-8 text-black" />
              </div>
              <h1 className="text-5xl font-bold text-white mb-3">Welcome to FitFusion</h1>
              <p className="text-xl text-white/60 mb-8">Let's personalize your fashion experience in just 5 minutes.</p>
              <button
                onClick={handleNext}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d7ff55] to-[#a0cc00] px-8 py-4 text-lg font-semibold text-black transition hover:shadow-lg hover:shadow-[#d7ff55]/50"
              >
                Get Started <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {step === 'fashion-type' && (
            <motion.div
              key="fashion-type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">What fashion categories do you wear?</h2>
              <p className="text-white/50 mb-8">This helps us personalize your outfit suggestions.</p>

              <div className="grid gap-4">
                {['Menswear', 'Womenswear', 'Both', 'Prefer Not To Specify'].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        fashionType: option.toLowerCase().replace(' ', '-')
                      }))
                      setError('')
                    }}
                    className={`p-4 rounded-lg border-2 transition ${
                      formData.fashionType === option.toLowerCase().replace(' ', '-')
                        ? 'border-[#d7ff55] bg-[#d7ff55]/10'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-lg font-semibold text-white">{option}</p>
                  </button>
                ))}
              </div>

              {error && <p className="mt-4 text-red-400">{error}</p>}
            </motion.div>
          )}

          {step === 'styles' && (
            <motion.div
              key="styles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">What styles do you prefer?</h2>
              <p className="text-white/50 mb-8">Select at least one. You can choose multiple.</p>

              <div className="grid grid-cols-2 gap-3">
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
                    <p className="text-sm font-semibold text-white">{style}</p>
                  </button>
                ))}
              </div>

              {error && <p className="mt-4 text-red-400">{error}</p>}
            </motion.div>
          )}

          {step === 'colors' && (
            <motion.div
              key="colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">What are your favorite colors?</h2>
              <p className="text-white/50 mb-8">Select your preferred palette.</p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                    <p className="text-sm font-semibold text-white">{color}</p>
                  </button>
                ))}
              </div>

              {error && <p className="mt-4 text-red-400">{error}</p>}
            </motion.div>
          )}

          {step === 'occasions' && (
            <motion.div
              key="occasions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">When do you dress up?</h2>
              <p className="text-white/50 mb-8">Help us suggest outfits for your lifestyle.</p>

              <div className="grid grid-cols-2 gap-3">
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
                    <p className="text-sm font-semibold text-white">{occasion}</p>
                  </button>
                ))}
              </div>

              {error && <p className="mt-4 text-red-400">{error}</p>}
            </motion.div>
          )}

          {step === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">What do you want from FitFusion?</h2>
              <p className="text-white/50 mb-8">Tell us your fashion goals.</p>

              <div className="grid gap-3">
                {FASHION_GOALS.map(goal => (
                  <button
                    key={goal}
                    onClick={() => handleToggleOption(goal, 'fashionGoals')}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      formData.fashionGoals.includes(goal)
                        ? 'border-[#d7ff55] bg-[#d7ff55]/10'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-base font-semibold text-white">{goal}</p>
                  </button>
                ))}
              </div>

              {error && <p className="mt-4 text-red-400">{error}</p>}
            </motion.div>
          )}

          {step === 'finish' && (
            <motion.div
              key="finish"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {loading ? (
                <>
                  <div className="mb-8 flex justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d7ff55] to-[#a0cc00]">
                        <Loader2 className="h-8 w-8 text-black" />
                      </div>
                    </motion.div>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">Creating your profile...</h2>
                  <p className="text-white/60">Personalizing FitFusion for you.</p>
                </>
              ) : (
                <>
                  <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d7ff55] to-[#a0cc00]">
                    <Heart className="h-8 w-8 text-black" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">You're all set!</h2>
                  <p className="text-white/60 mb-8">Your FitFusion profile is ready. Let's find you amazing outfits.</p>
                  <button
                    onClick={handleComplete}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d7ff55] to-[#a0cc00] px-8 py-4 text-lg font-semibold text-black transition hover:shadow-lg hover:shadow-[#d7ff55]/50"
                  >
                    Go to Dashboard <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 'welcome' && step !== 'finish' && (
          <div className="mt-12 flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-white transition hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" /> Back
            </button>

            <div className="flex gap-2">
              {steps.map((s, i) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition ${
                    i < currentStepIndex
                      ? 'bg-[#d7ff55] w-6'
                      : i === currentStepIndex
                      ? 'bg-[#d7ff55] w-8'
                      : 'bg-white/20 w-2'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#d7ff55] to-[#a0cc00] px-6 py-3 font-semibold text-black transition hover:shadow-lg hover:shadow-[#d7ff55]/30"
            >
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
