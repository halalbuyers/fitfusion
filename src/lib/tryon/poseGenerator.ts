export const poseOptions = ['standing', 'walking', 'sitting', 'mirror selfie', 'street photography', 'studio pose'] as const
export type TryOnPose = typeof poseOptions[number]

export function normalizePose(value?: string): TryOnPose {
  const text = String(value || '').toLowerCase()
  return poseOptions.find((pose) => text.includes(pose)) || 'standing'
}

export function poseAdjustment(value?: string) {
  const pose = normalizePose(value)
  if (pose === 'walking') return { pose, tilt: -2, stanceScale: 1.12, crop: 'full', prompt: 'dynamic walking pose with natural garment movement' }
  if (pose === 'sitting') return { pose, tilt: 0, stanceScale: 0.82, crop: 'three-quarter', prompt: 'seated pose with clean folds and realistic fabric compression' }
  if (pose === 'mirror selfie') return { pose, tilt: 1, stanceScale: 0.94, crop: 'phone mirror', prompt: 'premium mirror selfie pose, face and body preserved' }
  if (pose === 'street photography') return { pose, tilt: -1, stanceScale: 1.04, crop: 'editorial', prompt: 'street style posture with confident shoulders' }
  if (pose === 'studio pose') return { pose, tilt: 0, stanceScale: 1, crop: 'studio full body', prompt: 'clean studio pose with centered fashion framing' }
  return { pose, tilt: 0, stanceScale: 1, crop: 'full', prompt: 'natural standing pose with realistic clothing proportions' }
}
