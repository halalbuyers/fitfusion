"use client"

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Bot, Footprints, Loader2, Send, Shirt, Sparkles, ThumbsDown, ThumbsUp, UserRound } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'
import { readApiJson } from '../../lib/api'

type OutfitCardItem = {
  id?: string
  label: string
  role: string
  image?: string
  category?: string
  color?: string
}

type OutfitCardData = {
  top: string
  bottom: string
  shoes: string
  style: string
  reason: string
  score?: number
  items?: OutfitCardItem[]
  missing?: Array<{ title: string; estimatedNewCombinations?: number; estimatedImprovementPercent?: number }>
  followUps?: string[]
}

type Message = {
  role: 'assistant' | 'user'
  content: string
  method?: string
  outfitCard?: OutfitCardData
  suggestions?: string[]
  memorySummary?: string
}

const starters = [
  'What should I wear today?',
  'Create a luxury outfit.',
  'Help me pack for a trip.',
  'Style my black hoodie.',
  'What am I missing?',
  'Show my least worn clothes.'
]

function cleanAssistantText(value: unknown) {
  if (typeof value !== 'string') return 'I could not produce a recommendation yet.'
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return trimmed
  try {
    const parsed = JSON.parse(trimmed)
    return parsed.reply || parsed.recommendation || parsed.explanation || 'Here is a wardrobe-aware recommendation.'
  } catch {
    return trimmed.replace(/[{}[\]"]/g, '').replace(/,/g, '\n')
  }
}

export default function StylistPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I remember your wardrobe, preferences, recent outfits, and style feedback. Ask naturally, and I will style only from pieces you own unless I clearly mark something as a purchase suggestion.',
      suggestions: starters
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [feedbackByMessage, setFeedbackByMessage] = useState<Record<number, 'liked' | 'disliked'>>({})

  const apiMessages = useMemo(() => messages.map((message) => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: message.content
  })), [messages])

  function revealAssistantMessage(message: Message) {
    const fullText = message.content
    const words = fullText.split(' ')
    const index = messages.length + 1
    setMessages((current) => [...current, { ...message, content: '' }])
    let cursor = 0
    const timer = window.setInterval(() => {
      cursor += 3
      setMessages((current) => current.map((entry, entryIndex) => (
        entryIndex === index ? { ...entry, content: words.slice(0, cursor).join(' ') } : entry
      )))
      if (cursor >= words.length) window.clearInterval(timer)
    }, 28)
  }

  async function send(text = input) {
    const prompt = text.trim()
    if (!prompt || isTyping) return
    const nextMessages: Message[] = [...messages, { role: 'user', content: prompt }]
    setMessages(nextMessages)
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, messages: apiMessages.concat({ role: 'user', content: prompt }) })
      })
      const data = await readApiJson<any>(res, 'Stylist failed')
      revealAssistantMessage({
        role: 'assistant',
        content: cleanAssistantText(data.reply),
        method: data.method,
        outfitCard: data.outfitCard,
        suggestions: data.suggestions,
        memorySummary: data.memorySummary
      })
    } catch {
      revealAssistantMessage({
        role: 'assistant',
        content: 'I hit a connection issue, so here is the fallback: use a neutral top, balanced bottoms, clean shoes, and add a jacket only if the weather needs it.',
        method: 'fallback',
        suggestions: starters
      })
    } finally {
      setIsTyping(false)
    }
  }

  async function rateAdvice(index: number, action: 'liked' | 'disliked') {
    setFeedbackByMessage((current) => ({ ...current, [index]: action }))
    await fetch('/api/ai/stylist-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, topic: messages[index]?.content?.slice(0, 80) || 'stylist advice' })
    }).catch(() => undefined)
  }

  function OutfitRecommendationCard({ card }: { card: OutfitCardData }) {
    const rows = [
      ['Top', card.top, Shirt],
      ['Bottom', card.bottom, Sparkles],
      ['Shoes', card.shoes, Footprints]
    ] as const

    return (
      <div className="mt-4 overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045]">
        {card.items?.length ? (
          <div className="grid grid-cols-4 gap-px bg-white/10">
            {card.items.slice(0, 4).map((item, index) => (
              <div key={item.id || `${item.label}-${index}`} className="relative aspect-square bg-black/40">
                {item.image ? <Image src={item.image} alt={item.label} fill sizes="140px" className="object-contain p-2.5" /> : <div className="grid h-full place-items-center text-white/25"><Shirt className="h-5 w-5" /></div>}
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase text-white/40">Outfit card</p>
            <h3 className="mt-1 text-sm font-semibold">{card.style}</h3>
          </div>
          <div className="flex items-center gap-2 text-[#d7ff55]">
            {typeof card.score === 'number' ? <span className="text-xs font-semibold">{card.score}/100</span> : null}
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <div className="grid gap-2 p-3">
          {rows.map(([label, value, Icon]) => (
            <div key={label} className="flex items-center gap-3 rounded-[8px] bg-black/24 px-3 py-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-white/8">
                <Icon className="h-4 w-4 text-white/70" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-white/35">{label}</p>
                <p className="text-sm text-white/82">{value}</p>
              </div>
            </div>
          ))}
          <div className="rounded-[8px] bg-[#d7ff55]/10 px-3 py-3 text-sm leading-6 text-white/68">
            <span className="font-semibold text-white">Why it works: </span>{card.reason}
          </div>
          {card.missing?.length ? (
            <div className="rounded-[8px] border border-amber-300/15 bg-amber-300/10 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-100/70">Purchase suggestions</p>
              <div className="mt-2 grid gap-1">
                {card.missing.slice(0, 2).map((item) => (
                  <p key={item.title} className="text-xs text-white/58">{item.title} {item.estimatedNewCombinations ? `· +${item.estimatedNewCombinations} combinations` : ''}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <AppFrame title="AI stylist chat" eyebrow="Persistent personal stylist">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.68fr_1.32fr]">
        <aside className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[8px] bg-[#d7ff55] text-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Personal stylist V2</h2>
              <p className="text-sm text-white/42">Memory, wardrobe, weather, and outfit history</p>
            </div>
          </div>
          <div className="mt-5 rounded-[8px] border border-white/10 bg-black/22 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">Memory</p>
            <p className="mt-2 text-sm leading-6 text-white/55">{messages.slice().reverse().find((message) => message.memorySummary)?.memorySummary || 'Learning from your wardrobe and feedback.'}</p>
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-white/35">Suggested questions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {starters.map((starter) => (
              <button key={starter} onClick={() => send(starter)} className="rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-left text-xs leading-5 text-white/65 transition hover:bg-white/8 hover:text-white">
                {starter}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3 shadow-2xl shadow-black/20 sm:p-4">
          <div className="hide-scrollbar grid max-h-[70vh] min-h-[500px] content-start gap-4 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-white/10">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-[88%] rounded-[8px] p-4 shadow-lg shadow-black/12 transition ${message.role === 'user' ? 'bg-white text-black' : 'bg-black/28 text-white'}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold opacity-60">
                    {message.role === 'user' ? 'You' : 'Noir Closet'}
                    {message.method && <span className="rounded bg-white/10 px-1.5 py-0.5 uppercase">{message.method}</span>}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6">{message.content || (message.role === 'assistant' ? 'Thinking through your wardrobe...' : '')}</p>
                  {message.role === 'assistant' && message.outfitCard && <OutfitRecommendationCard card={message.outfitCard} />}
                  {message.role === 'assistant' && (message.outfitCard?.followUps?.length || message.suggestions?.length) ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(message.outfitCard?.followUps || message.suggestions || []).slice(0, 4).map((suggestion) => (
                        <button key={suggestion} onClick={() => send(suggestion)} className="rounded-[8px] border border-white/10 bg-white/7 px-2.5 py-1.5 text-xs text-white/62 transition hover:bg-white/12 hover:text-white">
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {message.role === 'assistant' && index > 0 ? (
                    <div className="mt-3 flex gap-2">
                      <button title="Like stylist advice" onClick={() => rateAdvice(index, 'liked')} className={`icon-button h-8 w-8 ${feedbackByMessage[index] === 'liked' ? 'bg-[#d7ff55] text-black' : ''}`}>
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button title="Dislike stylist advice" onClick={() => rateAdvice(index, 'disliked')} className={`icon-button h-8 w-8 ${feedbackByMessage[index] === 'disliked' ? 'bg-white text-black' : ''}`}>
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
                {message.role === 'user' && (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-white text-black">
                    <UserRound className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-white/10">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="grid gap-2 rounded-[8px] bg-black/28 p-4 text-sm text-white/55">
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1" aria-label="Stylist is typing">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:240ms]" />
                    </span>
                    Checking wardrobe memory
                  </div>
                  <div className="h-3 w-56 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              id="stylist-message"
              name="message"
              autoComplete="off"
              aria-label="Stylist message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              className="field h-12 flex-1"
              placeholder="I have an interview tomorrow..."
            />
            <button onClick={() => send()} disabled={isTyping || !input.trim()} className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-white px-5 text-sm font-semibold text-black disabled:opacity-50">
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>
        </section>
      </div>
    </AppFrame>
  )
}
