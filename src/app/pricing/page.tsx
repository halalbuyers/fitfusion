import { AppFrame } from '../../components/AppFrame'

const plans = [
  ['Free', '$0', '50 uploads, core recommendations, community feed'],
  ['Premium', '$12', 'Unlimited uploads, advanced AI styling, analytics, calendar'],
  ['Studio', '$29', 'Virtual try-on, celebrity-inspired looks, priority AI']
]

export default function PricingPage() {
  return (
    <AppFrame title="Premium styling plans" eyebrow="Subscription logic ready">
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map(([name, price, detail]) => (
          <div key={name} className="glass rounded-2xl p-6">
            <h2 className="text-2xl font-semibold">{name}</h2>
            <p className="mt-5 text-5xl font-semibold">{price}<span className="text-base text-white/40">/mo</span></p>
            <p className="mt-5 min-h-16 text-sm leading-6 text-white/52">{detail}</p>
            <button className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Choose {name}</button>
          </div>
        ))}
      </div>
    </AppFrame>
  )
}
