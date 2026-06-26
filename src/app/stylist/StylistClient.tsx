"use client"

import { useMemo, useState } from 'react'
import { Bot, Footprints, Send, Shirt, Sparkles, ThumbsDown, ThumbsUp, UserRound } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

type OutfitCardData = {
  top: string
  bottom: string
  shoes: string
  style: string
  reason: string
}

type Message = {
  role: 'assistant' | 'user'
  content: string
  method?: string
  outfitCard?: OutfitCardData
}

const starters = [
  'What should I wear to college today?',
  'Make me a date night outfit.',
  'Suggest a rainy day streetwear fit.',
  'What items am I missing from my wardrobe?'
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
      content: 'Tell me the occasion, weather, or vibe. I will use your saved wardrobe first and only lean on AI if it is available.'
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [feedbackByMessage, setFeedbackByMessage] = useState<Record<number, 'liked' | 'disliked'>>({})

  const apiMessages = useMemo(() => messages.map((message) => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: message.content
  })), [messages])

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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Stylist failed')
      setMessages((current) => [...current, {
        role: 'assistant',
        content: cleanAssistantText(data.reply),
        method: data.method,
        outfitCard: data.outfitCard
      }])
    } catch {
      setMessages((current) => [...current, {
        role: 'assistant',
        content: 'I hit a connection issue, so here is the fallback: use a neutral top, balanced bottoms, clean shoes, and add a jacket if the weather is cold or rainy.',
        method: 'fallback'
      }])
    } finally {
      setIsTyping(false)
    }
  }

  async function rateAdvice(index: number, action: 'liked' | 'disliked') {
    setFeedbackByMessage((current) => ({ ...current, [index]: action }))
    await fetch('/api/ai/stylist-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, topic: 'stylist advice' })
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
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase text-white/40">Outfit card</p>
            <h3 className="mt-1 text-sm font-semibold">{card.style}</h3>
          </div>
          <Sparkles className="h-4 w-4 text-[#d7ff55]" />
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
            <span className="font-semibold text-white">Reason: </span>{card.reason}
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppFrame title="AI stylist chat" eyebrow="Wardrobe-aware assistant">
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[8px] bg-[#d7ff55] text-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Stylist mode</h2>
              <p className="text-sm text-white/42">Local engine plus optional AI polish</p>
            </div>
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-white/35">Suggested prompts</p>
          <div className="mt-3 grid gap-2">
            {starters.map((starter) => (
              <button key={starter} onClick={() => send(starter)} className="rounded-[8px] border border-white/10 bg-black/20 px-3 py-3 text-left text-sm leading-5 text-white/65 transition hover:bg-white/8 hover:text-white">
                {starter}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3 shadow-2xl shadow-black/20 sm:p-4">
          <div className="hide-scrollbar grid max-h-[68vh] min-h-[430px] content-start gap-4 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-white/10">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-[8px] p-4 shadow-lg shadow-black/12 ${message.role === 'user' ? 'bg-white text-black' : 'bg-black/28 text-white'}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold opacity-60">
                    {message.role === 'user' ? 'You' : 'Noir Closet'}
                    {message.method && <span className="rounded bg-white/10 px-1.5 py-0.5 uppercase">{message.method}</span>}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6">{message.content}</p>
                  {message.role === 'assistant' && message.outfitCard && <OutfitRecommendationCard card={message.outfitCard} />}
                  {message.role === 'assistant' && index > 0 ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        title="Like stylist advice"
                        onClick={() => rateAdvice(index, 'liked')}
                        className={`icon-button h-8 w-8 ${feedbackByMessage[index] === 'liked' ? 'bg-[#d7ff55] text-black' : ''}`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Dislike stylist advice"
                        onClick={() => rateAdvice(index, 'disliked')}
                        className={`icon-button h-8 w-8 ${feedbackByMessage[index] === 'disliked' ? 'bg-white text-black' : ''}`}
                      >
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
                <div className="flex items-center gap-2 rounded-[8px] bg-black/28 p-4 text-sm text-white/55">
                  <span className="flex gap-1" aria-label="Stylist is typing">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:240ms]" />
                  </span>
                  Styling from your wardrobe
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <input
              id="stylist-message"
              name="message"
              autoComplete="off"
              aria-label="Stylist message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              className="field h-12 flex-1"
              placeholder="Ask for a winter streetwear outfit..."
            />
            <button onClick={() => send()} disabled={isTyping || !input.trim()} className="flex h-12 items-center gap-2 rounded-[8px] bg-white px-5 text-sm font-semibold text-black disabled:opacity-50">
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </section>
      </div>
    </AppFrame>
  )
}
