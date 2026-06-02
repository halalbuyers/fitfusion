"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CloudRain, CloudSun, Loader2, Sparkles, Thermometer, Wind } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

type WeatherData = {
  temperature?: number
  condition?: string
  suggestion?: string
  source?: string
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/weather')
      .then((res) => res.json())
      .then(setWeather)
      .catch(() => setWeather({ temperature: 24, condition: 'moderate', suggestion: 'Use balanced layers and breathable fabrics.', source: 'fallback' }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppFrame
      title="Weather styling"
      eyebrow="Forecast-aware outfits"
      action={<Link href="/outfit-generator" className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#d7ff55] px-5 text-sm font-semibold text-black"><Sparkles className="h-4 w-4" />Generate fit</Link>}
    >
      {loading ? (
        <div className="glass grid min-h-[420px] place-items-center rounded-[8px]">
          <Loader2 className="h-7 w-7 animate-spin text-[#d7ff55]" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass overflow-hidden rounded-[8px]">
            <div className="relative min-h-[360px] p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(215,255,85,.18),transparent_20rem),radial-gradient(circle_at_80%_10%,rgba(125,211,252,.16),transparent_18rem)]" />
              <div className="relative">
                <div className="grid h-16 w-16 place-items-center rounded-[8px] bg-white text-black">
                  <CloudSun className="h-8 w-8" />
                </div>
                <p className="mt-10 text-sm uppercase tracking-[0.24em] text-white/40">{weather?.source || 'local'} forecast</p>
                <h2 className="mt-3 text-6xl font-semibold tracking-tight sm:text-7xl">{weather?.temperature ?? 24}C</h2>
                <p className="mt-4 text-2xl capitalize text-white/78">{weather?.condition || 'moderate'}</p>
              </div>
            </div>
          </section>
          <section className="grid gap-4">
            <div className="glass rounded-[8px] p-5">
              <div className="flex items-center gap-3">
                <Thermometer className="h-5 w-5 text-[#d7ff55]" />
                <h2 className="font-semibold">Styling guidance</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/58">{weather?.suggestion || 'Choose breathable layers and avoid heavy outerwear unless conditions change.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-[8px] p-5">
                <CloudRain className="h-5 w-5 text-white/65" />
                <p className="mt-4 text-sm text-white/45">Weather fit</p>
                <p className="mt-1 text-xl font-semibold capitalize">{weather?.condition || 'moderate'}</p>
              </div>
              <div className="glass rounded-[8px] p-5">
                <Wind className="h-5 w-5 text-white/65" />
                <p className="mt-4 text-sm text-white/45">Layering</p>
                <p className="mt-1 text-xl font-semibold">{(weather?.temperature ?? 24) < 18 ? 'Add layer' : 'Light'}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppFrame>
  )
}
