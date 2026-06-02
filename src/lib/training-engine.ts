import TrainingExample from '../models/TrainingExample'

export async function recordTrainingExample(input: {
  userId?: string
  imageUrl: string
  aiCategory?: string
  userCategory?: string
  aiColor?: string
  userColor?: string
  aiStyle?: string
  userStyle?: string
}) {
  const changed = input.aiCategory !== input.userCategory || input.aiColor !== input.userColor || input.aiStyle !== input.userStyle
  if (!changed) return null
  return TrainingExample.create(input)
}

export async function getTrainingAnalytics() {
  const [total, categoryMistakes, colorMistakes, styleMistakes, recent] = await Promise.all([
    TrainingExample.countDocuments().catch(() => 0),
    TrainingExample.countDocuments({ $expr: { $ne: ['$aiCategory', '$userCategory'] } }).catch(() => 0),
    TrainingExample.countDocuments({ $expr: { $ne: ['$aiColor', '$userColor'] } }).catch(() => 0),
    TrainingExample.countDocuments({ $expr: { $ne: ['$aiStyle', '$userStyle'] } }).catch(() => 0),
    TrainingExample.find().sort({ createdAt: -1 }).limit(50).lean().catch(() => [])
  ])
  const mistakes = categoryMistakes + colorMistakes + styleMistakes
  return {
    total,
    accuracy: total ? Math.max(0, Math.round(100 - (mistakes / Math.max(1, total * 3)) * 100)) : 100,
    mistakes: [
      { name: 'Category', value: categoryMistakes },
      { name: 'Color', value: colorMistakes },
      { name: 'Style', value: styleMistakes }
    ],
    recent
  }
}
