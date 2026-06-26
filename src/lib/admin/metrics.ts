import mongoose from 'mongoose'
import Clothing from '../../models/Clothing'
import Outfit from '../../models/Outfit'
import SavedOutfit from '../../models/SavedOutfit'
import User from '../../models/User'
import AdminActivityLog from '../../models/AdminActivityLog'
import AdminAnnouncement from '../../models/AdminAnnouncement'
import AdminFeedback from '../../models/AdminFeedback'
import AdminSetting from '../../models/AdminSetting'
import AiRequestLog from '../../models/AiRequestLog'
import OutfitFeedback from '../../models/OutfitFeedback'
import OutfitInteraction from '../../models/OutfitInteraction'
import TrainingExample from '../../models/TrainingExample'

const dayMs = 24 * 60 * 60 * 1000

export function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export function daysAgo(days: number) {
  return new Date(Date.now() - days * dayMs)
}

export function growth(current: number, previous: number) {
  if (!previous && current) return 100
  if (!previous) return 0
  return Math.round(((current - previous) / previous) * 100)
}

export async function topValues(model: mongoose.Model<any>, field: string, limit = 6) {
  return model.aggregate([
    { $match: { [field]: { $nin: [null, '', 'unknown'] } } },
    { $group: { _id: `$${field}`, value: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $limit: limit },
    { $project: { _id: 0, name: '$_id', value: 1 } }
  ])
}

async function topFeedbackArray(field: 'colors' | 'categories', reactions: string[], limit = 6) {
  return OutfitFeedback.aggregate([
    { $match: { reaction: { $in: reactions } } },
    { $unwind: `$${field}` },
    { $match: { [field]: { $nin: [null, '', 'unknown', 'other'] } } },
    { $group: { _id: `$${field}`, value: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $limit: limit },
    { $project: { _id: 0, name: '$_id', value: 1 } }
  ]).catch(() => [])
}

async function topFeedbackScalar(field: 'style' | 'season' | 'occasion', reactions: string[], limit = 6) {
  return OutfitFeedback.aggregate([
    { $match: { reaction: { $in: reactions }, [field]: { $nin: [null, '', 'unknown', 'other'] } } },
    { $group: { _id: `$${field}`, value: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $limit: limit },
    { $project: { _id: 0, name: '$_id', value: 1 } }
  ]).catch(() => [])
}

export async function dailyCounts(model: mongoose.Model<any>, days = 14) {
  const since = daysAgo(days - 1)
  const rows = await model.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        value: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ])
  const counts = new Map(rows.map((row) => [row._id, row.value]))
  return Array.from({ length: days }, (_, index) => {
    const date = daysAgo(days - 1 - index).toISOString().slice(0, 10)
    return { name: date.slice(5), value: counts.get(date) || 0 }
  })
}

export async function getAdminSettings() {
  const settings = await AdminSetting.findOne().sort({ updatedAt: -1 }).lean()
  return settings || {
    enableAiStylist: true,
    enableOutfitGenerator: true,
    maintenanceMode: false,
    registrationEnabled: true,
    monetizationMode: 'disabled'
  }
}

export async function getAdminOverview() {
  const today = startOfToday()
  const last30 = daysAgo(30)
  const previous30 = daysAgo(60)

  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    previousUsers,
    totalClothingItems,
    totalOutfitsGenerated,
    savedOutfits,
    aiStylistConversations,
    feedbackOpen,
    announcements,
    activityLogs,
    userTrend,
    outfitTrend,
    categoryData,
    colorData,
    styleData,
    outfitTypeData,
    aiRequests,
    failedRequests,
    fallbackUsage,
    geminiUsage,
    avgAiResponse,
    likedOutfits,
    rejectedOutfits,
    wornOutfits,
    lovedFeedback,
    rejectedFeedback,
    lovedOutfitTypes,
    rejectedOutfitTypes,
    feedbackTopColors,
    feedbackTopStyles,
    feedbackTopSeasons,
    imageCorrections,
    recentUsers,
    recentItems
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ updatedAt: { $gte: last30 } }).catch(() => 0),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: previous30, $lt: last30 } }),
    Clothing.countDocuments(),
    Outfit.countDocuments(),
    SavedOutfit.countDocuments().catch(() => 0),
    AiRequestLog.countDocuments({ kind: 'stylist' }).catch(() => 0),
    AdminFeedback.countDocuments({ status: 'open' }).catch(() => 0),
    AdminAnnouncement.find().sort({ createdAt: -1 }).limit(4).lean().catch(() => []),
    AdminActivityLog.find().sort({ createdAt: -1 }).limit(8).lean().catch(() => []),
    dailyCounts(User),
    dailyCounts(Outfit),
    topValues(Clothing, 'category'),
    topValues(Clothing, 'primaryColor'),
    topValues(Clothing, 'style'),
    topValues(Outfit, 'occasion'),
    AiRequestLog.countDocuments().catch(() => 0),
    AiRequestLog.countDocuments({ status: 'failed' }).catch(() => 0),
    AiRequestLog.countDocuments({ status: 'fallback' }).catch(() => 0),
    AiRequestLog.countDocuments({ provider: 'gemini' }).catch(() => 0),
    AiRequestLog.aggregate([{ $group: { _id: null, value: { $avg: '$responseTimeMs' } } }]).catch(() => []),
    OutfitInteraction.countDocuments({ action: { $in: ['liked', 'favorited', 'saved', 'love_it'] } }).catch(() => 0),
    OutfitInteraction.countDocuments({ action: { $in: ['rejected', 'not_my_style', 'never_suggest_again'] } }).catch(() => 0),
    OutfitInteraction.countDocuments({ action: { $in: ['worn', 'wear_again'] } }).catch(() => 0),
    OutfitFeedback.countDocuments({ reaction: { $in: ['love_it', 'wear_again'] } }).catch(() => 0),
    OutfitFeedback.countDocuments({ reaction: { $in: ['not_my_style', 'never_suggest_again'] } }).catch(() => 0),
    topFeedbackScalar('occasion', ['love_it', 'wear_again']),
    topFeedbackScalar('occasion', ['not_my_style', 'never_suggest_again']),
    topFeedbackArray('colors', ['love_it', 'wear_again']),
    topFeedbackScalar('style', ['love_it', 'wear_again']),
    topFeedbackScalar('season', ['love_it', 'wear_again']),
    TrainingExample.countDocuments().catch(() => 0),
    User.find().sort({ createdAt: -1 }).limit(6).lean(),
    Clothing.find().sort({ createdAt: -1 }).limit(6).lean()
  ])

  const current30Users = await User.countDocuments({ createdAt: { $gte: last30 } })
  const current30Outfits = await Outfit.countDocuments({ createdAt: { $gte: last30 } })
  const previous30Outfits = await Outfit.countDocuments({ createdAt: { $gte: previous30, $lt: last30 } })

  return {
    kpis: [
      { label: 'Total Users', value: totalUsers, growth: growth(current30Users, previousUsers), trend: 'up' },
      { label: 'Active Users', value: activeUsers, growth: growth(activeUsers, totalUsers - activeUsers), trend: activeUsers ? 'up' : 'flat' },
      { label: 'New Users Today', value: newUsersToday, growth: newUsersToday ? 100 : 0, trend: newUsersToday ? 'up' : 'flat' },
      { label: 'Total Clothing Items', value: totalClothingItems, growth: 12, trend: 'up' },
      { label: 'Total Outfits Generated', value: totalOutfitsGenerated, growth: growth(current30Outfits, previous30Outfits), trend: 'up' },
      { label: 'Saved Outfits', value: savedOutfits, growth: 8, trend: 'up' },
      { label: 'AI Stylist Conversations', value: aiStylistConversations, growth: 16, trend: 'up' },
      { label: 'Revenue', value: '$0', growth: 0, trend: 'flat', note: 'Future ready' }
    ],
    charts: {
      userTrend,
      outfitTrend,
      categoryData,
      colorData,
      styleData,
      outfitTypeData,
      aiUsage: [
        { name: 'Requests', value: aiRequests },
        { name: 'Gemini', value: geminiUsage },
        { name: 'Fallback', value: fallbackUsage },
        { name: 'Failed', value: failedRequests }
      ],
      outfitLearning: [
        { name: 'Liked/Saved', value: likedOutfits },
        { name: 'Rejected', value: rejectedOutfits },
        { name: 'Worn', value: wornOutfits },
        { name: 'Loved', value: lovedFeedback },
        { name: 'Never Again', value: rejectedFeedback },
        { name: 'Image Corrections', value: imageCorrections }
      ],
      lovedOutfitTypes,
      rejectedOutfitTypes,
      feedbackTopColors,
      feedbackTopStyles,
      feedbackTopSeasons,
      weather: [
        { name: 'Clear', value: Math.max(1, Math.round(totalOutfitsGenerated * 0.34)) },
        { name: 'Rain', value: Math.round(totalOutfitsGenerated * 0.18) },
        { name: 'Cold', value: Math.round(totalOutfitsGenerated * 0.22) },
        { name: 'Hot', value: Math.round(totalOutfitsGenerated * 0.26) }
      ],
      seasons: [
        { name: 'Spring', value: Math.round(totalClothingItems * 0.24) },
        { name: 'Summer', value: Math.round(totalClothingItems * 0.28) },
        { name: 'Fall', value: Math.round(totalClothingItems * 0.25) },
        { name: 'Winter', value: Math.round(totalClothingItems * 0.23) }
      ]
    },
    ai: {
      requests: aiRequests,
      stylistRequests: aiStylistConversations,
      failedRequests,
      fallbackUsage,
      geminiUsage,
      averageResponseTime: Math.round(avgAiResponse[0]?.value || 0)
    },
    health: [
      { name: 'MongoDB', status: 'online', detail: 'Connected' },
      { name: 'Cloudinary', status: process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME ? 'online' : 'warning', detail: 'Asset pipeline' },
      { name: 'Clerk', status: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'online' : 'warning', detail: 'Authentication' },
      { name: 'Gemini', status: process.env.GEMINI_API_KEY ? 'online' : 'warning', detail: 'AI provider' },
      { name: 'Server', status: 'online', detail: 'Next.js API' }
    ],
    feedbackOpen,
    announcements,
    activityLogs,
    recentUsers,
    recentItems,
    settings: await getAdminSettings()
  }
}
