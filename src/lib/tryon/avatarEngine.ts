import { analyzeBody, type BodyAnalysis } from './bodyAnalyzer'

export type AvatarPayload = {
  name: string
  sourceType: 'selfie' | 'full-body' | 'ai'
  imageUrl: string
  publicId?: string
  bodyAnalysis: BodyAnalysis
  active: boolean
}

export function cleanAvatarName(value?: string) {
  const name = String(value || '').trim()
  return name ? name.slice(0, 80) : 'My avatar'
}

function syntheticSvg(style = 'studio') {
  const palette = style === 'luxury'
    ? ['#101010', '#d7ff55', '#ffffff']
    : style === 'streetwear'
      ? ['#0b0c0f', '#7dd3fc', '#d7ff55']
      : ['#111318', '#ffffff', '#d7ff55']
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1400" viewBox="0 0 900 1400">
<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${palette[0]}"/><stop offset="1" stop-color="#20242c"/></linearGradient></defs>
<rect width="900" height="1400" fill="url(#g)"/>
<circle cx="450" cy="205" r="88" fill="${palette[1]}" opacity=".9"/>
<path d="M296 385c54-62 254-62 308 0 31 36 50 144 60 324 8 152 37 287 82 405H590c-30-94-48-206-54-337H364c-7 132-26 244-56 337H154c45-118 73-253 82-405 10-180 29-288 60-324Z" fill="${palette[2]}" opacity=".88"/>
<path d="M300 470h300v96H300z" fill="${palette[1]}" opacity=".34"/>
<text x="450" y="1245" text-anchor="middle" fill="rgba(255,255,255,.58)" font-family="Arial" font-size="34">NOIR CLOSET AI AVATAR</text>
</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export function createSyntheticAvatar(input: { name?: string; style?: string } = {}): AvatarPayload {
  return {
    name: cleanAvatarName(input.name || 'AI avatar'),
    sourceType: 'ai',
    imageUrl: syntheticSvg(input.style),
    bodyAnalysis: analyzeBody({ width: 900, height: 1400, sourceType: 'ai', pose: 'standing' }),
    active: true
  }
}

export function createUploadedAvatar(input: { name?: string; sourceType?: string; imageUrl: string; publicId?: string; width?: number; height?: number }): AvatarPayload {
  const sourceType = input.sourceType === 'selfie' ? 'selfie' : 'full-body'
  return {
    name: cleanAvatarName(input.name),
    sourceType,
    imageUrl: input.imageUrl,
    publicId: input.publicId,
    bodyAnalysis: analyzeBody({ width: input.width, height: input.height, sourceType }),
    active: true
  }
}

export function avatarSecurityNote() {
  return 'Avatar records are always queried by userId and never returned across accounts.'
}
