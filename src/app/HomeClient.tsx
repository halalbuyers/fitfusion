'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  CloudSun,
  MessageCircle,
  Palette,
  ScanLine,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Wand2
} from 'lucide-react'

const heroImage = '/images/hero-fashion.webp'

type Feature = {
  title: string
  body: string
  icon: LucideIcon
  tone: string
  lift: string
}

const features: Feature[] = [
  {
    title: 'Vision-led closet memory',
    body: 'Detect categories, colors, style codes, seasonality, and repeat wear patterns from every piece you upload.',
    icon: ScanLine,
    tone: 'from-[#d7ff55]/24 to-white/[0.03]',
    lift: 'lg:translate-y-8'
  },
  {
    title: 'Outfits that understand context',
    body: 'Balance weather, calendar intent, color harmony, comfort, and your own saves before recommending a look.',
    icon: BrainCircuit,
    tone: 'from-cyan-300/18 to-white/[0.03]',
    lift: ''
  },
  {
    title: 'Stylist chat with taste',
    body: 'Ask wardrobe-aware questions and get decisive guidance without losing your personal silhouette.',
    icon: MessageCircle,
    tone: 'from-white/14 to-[#d7ff55]/8',
    lift: 'lg:translate-y-14'
  },
  {
    title: 'Planning across the week',
    body: 'Save looks, map outfits to days, prepare for travel, and keep the whole system in sync.',
    icon: CalendarDays,
    tone: 'from-[#d7ff55]/16 to-cyan-300/10',
    lift: 'lg:translate-y-3'
  }
]

const engineCards = [
  { label: 'Weather', title: '48F layered streetwear', score: '94%', icon: CloudSun, detail: 'Warm core, clean contrast, waterproof sneakers.' },
  { label: 'Calendar', title: 'Founder dinner ready', score: '91%', icon: CalendarDays, detail: 'Charcoal tailoring with a relaxed black base.' },
  { label: 'Shopping', title: 'Only one gap detected', score: '1', icon: ShoppingBag, detail: 'A cropped wool layer unlocks six more outfits.' },
  { label: 'Try-On', title: 'Virtual fit confidence', score: '88%', icon: Camera, detail: 'Sleeve length and sneaker profile are aligned.' },
  { label: 'Palette', title: 'Neutral system balanced', score: 'A', icon: Palette, detail: 'Black, bone, denim, and lime accents stay coherent.' }
]

const testimonials = [
  {
    quote: 'Noir Closet made my closet feel expensive again. I stopped buying random pieces and started building outfits.',
    name: 'Maya R.',
    role: 'Creative director',
    initials: 'MR'
  },
  {
    quote: 'The AI stylist feels sharp, calm, and specific. It knows what I own and still leaves room for taste.',
    name: 'Julian K.',
    role: 'Founder',
    initials: 'JK'
  },
  {
    quote: 'Calendar planning is the thing I did not know I needed. Travel weeks are suddenly painless.',
    name: 'Ari S.',
    role: 'Product lead',
    initials: 'AS'
  }
]

const faqs = [
  ['Can Noir Closet work without AI keys?', 'Yes. The app includes deterministic fallback logic so demos and local development still work while the AI providers are offline.'],
  ['Is this built for production?', 'The architecture includes protected APIs, Mongoose schemas, Cloudinary uploads, Clerk auth, and modular AI engines.'],
  ['Is Noir Closet free during beta?', 'Yes. Authenticated users can use the full product while the focus stays on AI quality, community, and feedback.'],
  ['What makes the recommendations personal?', 'The engine blends wardrobe metadata, prior saves, outfit feedback, weather, occasion, and stylist memory before it explains a look.']
]

const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.68, ease: 'easeOut' } }
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } }
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        hidden: { opacity: 0, y: 22 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.68, delay, ease: 'easeOut' } }
      }}
    >
      {children}
    </motion.div>
  )
}

function FeatureCard({ feature }: { feature: Feature }) {
  const shouldReduceMotion = useReducedMotion()
  const Icon = feature.icon

  return (
    <motion.article
      variants={reveal}
      whileHover={shouldReduceMotion ? undefined : { y: -8, scale: 1.015 }}
      className={`premium-card group min-h-[260px] rounded-[8px] p-6 transition-colors duration-300 sm:p-7 ${feature.lift}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.tone} opacity-80 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-[8px] border border-white/12 bg-black/34 text-[#d7ff55] shadow-[0_0_34px_rgba(215,255,85,0.12)]">
            <Icon className="h-5 w-5" />
          </div>
          <span className="rounded-full border border-[#d7ff55]/20 bg-[#d7ff55]/10 px-3 py-1 text-xs font-semibold text-[#d7ff55]">
            Live
          </span>
        </div>
        <div className="mt-auto pt-10">
          <h3 className="text-2xl font-semibold leading-tight text-white">{feature.title}</h3>
          <p className="mt-4 text-sm leading-6 text-white/58">{feature.body}</p>
        </div>
      </div>
    </motion.article>
  )
}

function EngineCard({ card, index }: { card: (typeof engineCards)[number]; index: number }) {
  const Icon = card.icon

  return (
    <motion.article
      variants={reveal}
      className="premium-card min-h-[230px] snap-center rounded-[8px] p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-[8px] border border-white/12 bg-white/[0.06] text-[#d7ff55]">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm text-white/42">0{index + 1}</span>
      </div>
      <p className="mt-8 text-sm text-white/44">{card.label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <h3 className="max-w-[13rem] text-2xl font-semibold leading-tight">{card.title}</h3>
        <span className="rounded-full bg-[#d7ff55] px-3 py-1.5 text-sm font-black text-black">{card.score}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/54">{card.detail}</p>
    </motion.article>
  )
}

function OutfitEngineSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <Reveal>
          <p className="text-sm font-semibold uppercase text-[#d7ff55]">Outfit engine</p>
          <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] text-white sm:text-6xl">
            Built for real wardrobe decisions.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/58 sm:text-lg">
            Noir Closet combines computer vision labels, fashion rules, user saves, weather context, and AI explanations so each outfit feels intentional before you leave the house.
          </p>
          <div className="mt-8 grid gap-3 sm:max-w-md">
            {['Understands what you own', 'Explains why a look works', 'Adapts to weather, travel, and taste'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/72">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d7ff55] text-black">
                  <Check className="h-4 w-4" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </Reveal>

        <motion.div
          className="hidden min-h-[560px] grid-cols-6 grid-rows-6 gap-4 lg:grid"
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <div className="col-span-3 row-span-3">
            <EngineCard card={engineCards[0]} index={0} />
          </div>
          <div className="col-span-3 row-span-2 mt-12">
            <EngineCard card={engineCards[1]} index={1} />
          </div>
          <div className="col-span-2 row-span-3">
            <EngineCard card={engineCards[2]} index={2} />
          </div>
          <div className="col-span-2 row-span-3 -mt-8">
            <EngineCard card={engineCards[3]} index={3} />
          </div>
          <div className="col-span-2 row-span-3 mt-8">
            <EngineCard card={engineCards[4]} index={4} />
          </div>
        </motion.div>

        <motion.div
          className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 lg:hidden"
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          {engineCards.map((card, index) => (
            <div key={card.label} className="min-w-[82%] snap-center sm:min-w-[46%]">
              <EngineCard card={card} index={index} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const shouldReduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (shouldReduceMotion) return
    const interval = window.setInterval(() => {
      setActive((current) => (current + 1) % testimonials.length)
    }, 5200)

    return () => window.clearInterval(interval)
  }, [shouldReduceMotion])

  const testimonial = testimonials[active]

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase text-[#d7ff55]">Loved in beta</p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.08] sm:text-6xl">Quietly powerful. Immediately useful.</h2>
        </Reveal>

        <div className="relative mt-10 overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:mt-14 sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7ff55]/70 to-transparent" />
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={testimonial.name}
              initial={shouldReduceMotion ? false : { opacity: 0, x: 26 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, x: -26 }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
              className="glass rounded-[8px] p-6 sm:p-10"
            >
              <div className="flex items-center gap-1 text-[#d7ff55]" aria-label="Five star rating">
                {[0, 1, 2, 3, 4].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <p className="mt-7 text-2xl font-medium leading-9 text-white sm:text-4xl sm:leading-[1.2]">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <footer className="mt-8 flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full border border-[#d7ff55]/30 bg-[#d7ff55]/12 text-sm font-black text-[#d7ff55]">
                  {testimonial.initials}
                </div>
                <div>
                  <cite className="not-italic font-semibold text-white">{testimonial.name}</cite>
                  <p className="mt-1 text-sm text-white/48">{testimonial.role}</p>
                </div>
              </footer>
            </motion.blockquote>
          </AnimatePresence>

          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show testimonial from ${item.name}`}
                className={`h-2.5 rounded-full transition-all focus-ring ${active === index ? 'w-8 bg-[#d7ff55]' : 'w-2.5 bg-white/22 hover:bg-white/45'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const [open, setOpen] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1fr]">
        <Reveal>
          <p className="text-sm font-semibold uppercase text-[#d7ff55]">FAQ</p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.08] sm:text-6xl">Sharp answers. No clutter.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-white/56">
            The homepage stays calm, but the product underneath is a full wardrobe intelligence system.
          </p>
        </Reveal>

        <Reveal className="grid gap-3">
          {faqs.map(([question, answer], index) => {
            const isOpen = open === index
            const panelId = `faq-panel-${index}`

            return (
              <div key={question} className="rounded-[8px] border border-white/10 bg-white/[0.04] shadow-xl shadow-black/16 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left text-base font-semibold text-white sm:px-6"
                >
                  <span>{question}</span>
                  <motion.span animate={{ rotate: isOpen && !shouldReduceMotion ? 180 : 0 }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-black/28 text-white/70">
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={panelId}
                      initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-6 text-sm leading-7 text-white/56 sm:px-6">{answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

function HeroVisual() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.82, delay: 0.16, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-[340px] sm:max-w-[420px] lg:ml-auto lg:max-w-[480px]"
    >
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="noir-hero-glow relative overflow-hidden rounded-[8px] border border-white/12 bg-white/[0.055] p-2 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-3"
      >
        <div className="relative h-[260px] overflow-hidden rounded-[8px] bg-black sm:h-[440px] lg:h-[560px]">
          <Image
            src={heroImage}
            alt="AI fashion styling preview"
            fill
            sizes="(min-width: 1280px) 440px, (min-width: 640px) 420px, calc(100vw - 48px)"
            className="object-cover"
            priority
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/12 to-transparent" />
        </div>

        <div className="absolute bottom-3 left-3 right-3 rounded-[8px] border border-white/12 bg-black/72 p-3 backdrop-blur-2xl sm:bottom-7 sm:left-7 sm:right-7 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/48 sm:text-sm">Today, 48F</p>
              <h2 className="mt-1 text-base font-semibold leading-tight sm:text-xl">Black hoodie + light denim</h2>
            </div>
            <div className="shrink-0 rounded-full bg-[#d7ff55] px-2.5 py-1.5 text-sm font-black text-black sm:px-3">94%</div>
          </div>
          <div className="mt-4 grid gap-2" aria-hidden="true">
            <span className="noir-skeleton h-2 w-11/12 rounded-full" />
            <span className="noir-skeleton h-2 w-8/12 rounded-full" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function HomeClient() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="w-full max-w-full overflow-hidden bg-[#070707] text-white">
      <section className="premium-grid relative px-4 pb-14 pt-9 sm:px-6 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(215,255,85,0.14),transparent_24rem)]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.82fr] lg:items-center">
          <motion.div
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
            variants={stagger}
            className="min-w-0 max-w-4xl"
          >
            <motion.div variants={reveal} className="inline-flex items-center gap-2 rounded-full border border-[#d7ff55]/25 bg-[#d7ff55]/10 px-3 py-2 text-xs font-semibold text-[#d7ff55]">
              <Sparkles className="h-4 w-4" />
              AI Fashion Operating System
            </motion.div>
            <motion.h1 variants={reveal} className="mt-6 text-[3rem] font-semibold leading-[0.96] text-white sm:text-7xl lg:text-8xl">
              <span className="block">Noir Closet</span>
              <span className="block">Fashion OS</span>
            </motion.h1>
            <motion.p variants={reveal} className="mt-6 max-w-2xl text-base leading-7 text-white/62 sm:text-xl sm:leading-9">
              A premium wardrobe command center for outfit generation, virtual try-on, shopping intelligence, and an AI stylist that understands what you actually own.
            </motion.p>
            <motion.div variants={reveal} className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/register" className="noir-ripple inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#d7ff55] px-6 py-3 text-sm font-black text-black transition hover:bg-[#e7ff8f] sm:w-auto">
                Build my wardrobe
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" prefetch={false} className="noir-ripple inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.08] sm:w-auto">
                View product
                <Wand2 className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div variants={reveal} className="-mx-1 mt-8 flex snap-x gap-2 overflow-x-auto px-1 pb-1 text-center sm:mx-0 sm:grid sm:max-w-xl sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
              {[
                ['94%', 'fit score'],
                ['6', 'engines'],
                ['24/7', 'stylist']
              ].map(([value, label]) => (
                <div key={label} className="min-w-[9rem] snap-center rounded-[8px] border border-white/10 bg-white/[0.045] p-3 backdrop-blur-xl sm:min-w-0">
                  <p className="text-lg font-black text-white sm:text-2xl">{value}</p>
                  <p className="mt-1 text-xs text-white/42">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <HeroVisual />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-[#d7ff55]">Core system</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.08] sm:text-6xl">Every feature earns its place.</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/56">
              Designed like a native fashion app: fewer dead zones, clearer controls, faster decisions, and a quieter premium surface.
            </p>
          </Reveal>

          <motion.div
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:items-start"
            initial={shouldReduceMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            {features.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </motion.div>
        </div>
      </section>

      <OutfitEngineSection />
      <TestimonialsSection />
      <FAQSection />

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <Reveal className="mx-auto max-w-5xl rounded-[8px] border border-[#d7ff55]/20 bg-[#d7ff55]/10 p-6 text-center shadow-[0_0_90px_rgba(215,255,85,0.08)] sm:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#d7ff55] text-black">
            <Shirt className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-4xl font-semibold leading-[1.08] sm:text-6xl">Turn your closet into an operating system.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/62">
            Start with the pieces you own. Noir Closet handles the intelligence layer.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="noir-ripple inline-flex min-h-12 items-center justify-center rounded-full bg-[#d7ff55] px-7 py-3 text-sm font-black text-black transition hover:bg-[#e7ff8f]">
              Create account
            </Link>
            <Link href="/try-on" prefetch={false} className="noir-ripple inline-flex min-h-12 items-center justify-center rounded-full border border-white/16 bg-black/24 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/35">
              Open Try-On
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
