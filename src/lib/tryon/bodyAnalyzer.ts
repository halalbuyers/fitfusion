export type BodyPoint = { x: number; y: number }
export type BodyBox = { x: number; y: number; width: number; height: number }

export type BodyAnalysis = {
  heightEstimateCm: number
  confidence: number
  pose: string
  facePosition: BodyBox
  shoulders: BodyBox
  waist: BodyBox
  arms: { left: BodyBox; right: BodyBox }
  legs: { left: BodyBox; right: BodyBox }
  proportions: {
    shoulderToWaist: number
    torsoToLeg: number
    stanceWidth: number
  }
  renderZones: {
    top: BodyBox
    layer: BodyBox
    bottom: BodyBox
    shoes: BodyBox
    accessories: BodyBox
  }
}

export function analyzeBody(input: { width?: number; height?: number; sourceType?: string; pose?: string } = {}): BodyAnalysis {
  const width = Math.max(1, Number(input.width || 900))
  const height = Math.max(1, Number(input.height || 1400))
  const ratio = height / width
  const fullBody = input.sourceType !== 'selfie' && ratio >= 1.15
  const heightEstimateCm = fullBody ? Math.round(164 + Math.min(18, Math.max(-8, (ratio - 1.45) * 24))) : 172
  const pose = input.pose || (fullBody ? 'standing' : 'portrait crop')
  const faceY = fullBody ? 8 : 12
  const faceHeight = fullBody ? 12 : 24
  const shoulderY = fullBody ? 22 : 40
  const waistY = fullBody ? 44 : 68

  return {
    heightEstimateCm,
    confidence: fullBody ? 82 : 58,
    pose,
    facePosition: { x: 40, y: faceY, width: 20, height: faceHeight },
    shoulders: { x: 28, y: shoulderY, width: 44, height: 10 },
    waist: { x: 34, y: waistY, width: 32, height: 9 },
    arms: {
      left: { x: 18, y: shoulderY + 3, width: 14, height: fullBody ? 31 : 22 },
      right: { x: 68, y: shoulderY + 3, width: 14, height: fullBody ? 31 : 22 }
    },
    legs: {
      left: { x: 35, y: fullBody ? 55 : 82, width: 13, height: fullBody ? 33 : 12 },
      right: { x: 52, y: fullBody ? 55 : 82, width: 13, height: fullBody ? 33 : 12 }
    },
    proportions: {
      shoulderToWaist: 0.72,
      torsoToLeg: fullBody ? 0.92 : 1.35,
      stanceWidth: fullBody ? 0.24 : 0.14
    },
    renderZones: {
      top: { x: 29, y: shoulderY - 1, width: 42, height: fullBody ? 29 : 34 },
      layer: { x: 25, y: shoulderY - 2, width: 50, height: fullBody ? 36 : 39 },
      bottom: { x: 31, y: fullBody ? 48 : 72, width: 38, height: fullBody ? 31 : 18 },
      shoes: { x: 30, y: fullBody ? 84 : 88, width: 40, height: fullBody ? 10 : 8 },
      accessories: { x: 23, y: fullBody ? 29 : 46, width: 54, height: 24 }
    }
  }
}
