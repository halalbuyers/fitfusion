import Link from 'next/link'
import Image from 'next/image'

const heroImage = '/images/hero-fashion.webp'

export default function Home() {
  const features = [
    ['AI Wardrobe Analysis', 'Detects categories, colors, seasonality, style codes, and tags from clothing images.'],
    ['Outfit Intelligence', 'Scores color harmony, weather fit, occasion, trends, and previous saves.'],
    ['AI Stylist Chat', 'Answers wardrobe-aware questions with concise, modern fashion advice.'],
    ['Social Planning', 'Save looks, plan the week, post outfits, and discover community inspiration.']
  ]
  const faqs = [
    ['Can FitFusion work without AI keys?', 'Yes. The app includes deterministic fallback logic so demos and local development still work.'],
    ['Is this built for production?', 'The architecture includes protected APIs, Mongoose schemas, Cloudinary upload flow, Clerk auth, and scalable modules.'],
    ['Can premium features be extended?', 'Yes. Subscription state is modeled and the UI separates advanced analytics, unlimited uploads, and try-on features.']
  ]

  return (
    <div className="overflow-hidden bg-[#070707]">
      <section className="premium-grid relative px-4 pb-16 pt-16 sm:px-6 lg:pt-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">AI fashion operating system</p>
            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-semibold tracking-tight sm:text-7xl lg:text-8xl">
              Your AI-Powered Personal Stylist
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/58">
              Upload your wardrobe, generate weather-aware outfits, chat with a stylist, plan your week, and share looks from one premium fashion-tech workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-black transition hover:bg-white/88">Build my wardrobe</Link>
              <Link href="/dashboard" prefetch={false} className="rounded-full border border-white/15 px-6 py-3 text-center text-sm font-semibold text-white transition hover:border-white/35">View product</Link>
            </div>
          </div>
          <div>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30">
              <div className="relative h-[420px] w-full overflow-hidden rounded-[1.5rem] bg-black/20 sm:h-[520px]">
                <Image
                  src={heroImage}
                  alt="Premium fashion styling"
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover"
                  priority
                  fetchPriority="high"
                  loading="eager"
                  unoptimized
                />
              </div>
              <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-white/12 bg-black/72 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/50">Today in New York, 48F</p>
                    <h2 className="mt-1 text-xl font-semibold">Black hoodie + light denim</h2>
                  </div>
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black">94%</div>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/58">Neutral contrast, winter layering, waterproof sneaker recommendation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([title, body]) => (
              <div key={title} className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/52">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">Outfit engine</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Built for real wardrobe decisions.</h2>
            <p className="mt-5 text-white/55">FitFusion combines computer vision labels, fashion rules, user saves, weather context, and AI explanations so every outfit feels intentional.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {['Casual', 'Streetwear', 'Formal', 'Party', 'Gym', 'Travel'].map((occasion, index) => (
              <div key={occasion} className="glass rounded-2xl p-5">
                <p className="text-sm text-white/45">0{index + 1}</p>
                <h3 className="mt-10 text-xl font-semibold">{occasion}</h3>
                <p className="mt-2 text-sm text-white/45">Generated look mode</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          {['"FitFusion made my closet feel ten times bigger."', '"The AI stylist sounds sharper than most shopping apps."', '"Calendar planning is perfect for travel weeks."'].map((quote) => (
            <blockquote key={quote} className="glass rounded-2xl p-6 text-lg leading-8 text-white/74">{quote}</blockquote>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          {faqs.map(([question, answer]) => (
            <div key={question} className="rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold">{question}</h3>
              <p className="mt-3 text-sm leading-6 text-white/52">{answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
