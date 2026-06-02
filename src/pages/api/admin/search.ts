import type { NextApiRequest, NextApiResponse } from 'next'
import User from '../../../models/User'
import Clothing from '../../../models/Clothing'
import Outfit from '../../../models/Outfit'
import AdminFeedback from '../../../models/AdminFeedback'
import { requireAdmin } from '../../../lib/admin/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const q = String(req.query.q || '').trim()
  if (!q) return res.status(200).json({ results: [] })
  const regex = { $regex: q, $options: 'i' }
  const [users, wardrobe, outfits, feedback] = await Promise.all([
    User.find({ $or: [{ name: regex }, { email: regex }] }).limit(5).lean(),
    Clothing.find({ $or: [{ category: regex }, { primaryColor: regex }, { style: regex }, { tags: regex }] }).limit(5).lean(),
    Outfit.find({ $or: [{ title: regex }, { occasion: regex }, { tags: regex }] }).limit(5).lean(),
    AdminFeedback.find({ $or: [{ title: regex }, { message: regex }, { email: regex }] }).limit(5).lean()
  ])

  return res.status(200).json({
    results: [
      ...users.map((item) => ({ type: 'User', title: item.name, subtitle: item.email, href: '/admin/users' })),
      ...wardrobe.map((item) => ({ type: 'Wardrobe', title: item.category, subtitle: `${item.primaryColor} / ${item.style}`, href: '/admin/analytics' })),
      ...outfits.map((item) => ({ type: 'Outfit', title: item.title, subtitle: item.occasion, href: '/admin/analytics' })),
      ...feedback.map((item) => ({ type: 'Feedback', title: item.title, subtitle: item.status, href: '/admin/feedback' }))
    ]
  })
}
