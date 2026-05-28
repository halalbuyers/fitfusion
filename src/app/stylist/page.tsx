"use client"

import { useMemo, useState } from 'react'
import { Bot, Loader2, Send, Sparkles, UserRound } from 'lucide-react'
import { AppFrame } from '../../components/AppFrame'

type Message = {
  role: 'assistant' | 'user'
  content: string
  method?: string
}

const starters = [
  'What should I wear to college today?',
  'Make me a date night outfit.',
  'Suggest a rainy day streetwear fit.',
  'What items am I missing from my wardrobe?'
]

export default function StylistPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Tell me the occasion, weather, or vibe. I will use your saved wardrobe first and only lean on AI if it is available.'
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

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
        content: data.reply || 'I could not produce a recommendation yet.',
        method: data.method
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
          <div className="mt-5 grid gap-2">
            {starters.map((starter) => (
              <button key={starter} onClick={() => send(starter)} className="rounded-[8px] border border-white/10 bg-black/20 px-3 py-3 text-left text-sm leading-5 text-white/65 transition hover:bg-white/8 hover:text-white">
                {starter}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
          <div className="grid max-h-[62vh] min-h-[420px] content-start gap-4 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-white/10">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-[8px] p-4 ${message.role === 'user' ? 'bg-white text-black' : 'bg-black/28 text-white'}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold opacity-60">
                    {message.role === 'user' ? 'You' : 'FitFusion'}
                    {message.method && <span className="rounded bg-white/10 px-1.5 py-0.5 uppercase">{message.method}</span>}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6">{message.content}</p>
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
                <div className="rounded-[8px] bg-black/28 p-4 text-sm text-white/55">
                  <Loader2 className="inline h-4 w-4 animate-spin" /> Styling from your wardrobe...
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <input
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
