const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-2.0-flash'

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || ''
}

export function hasGemini() {
  return Boolean(getGeminiApiKey())
}

export async function generateGeminiText(
  prompt: string,
  systemInstruction = ''
): Promise<string> {
  const apiKey = getGeminiApiKey()

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: systemInstruction
          ? {
              parts: [{ text: systemInstruction }]
            }
          : undefined,

        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],

        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 700
        }
      })
    })

    if (!response.ok) {
      const text = await response.text()

      // Better quota handling
      if (response.status === 429) {
        console.warn('Gemini quota exceeded')

        return JSON.stringify([
          {
            top: 'Black T-Shirt',
            bottom: 'Blue Jeans',
            shoes: 'White Sneakers',
            style: 'Minimal Streetwear',
            occasion: 'Casual',
            reason:
              'Neutral tones create a clean balanced outfit.'
          }
        ])
      }

      throw new Error(
        `Gemini request failed (${response.status}): ${text}`
      )
    }

    const data: any = await response.json()

    const output =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text || '')
        .join('') || ''

    if (!output) {
      throw new Error('Gemini returned empty response')
    }

    return output
  } catch (error) {
    console.error('Gemini Error:', error)

    // Final fallback
    return JSON.stringify([
      {
        top: 'White Hoodie',
        bottom: 'Black Cargo Pants',
        shoes: 'Chunky Sneakers',
        style: 'Urban Casual',
        occasion: 'Evening Outing',
        reason:
          'Strong monochrome contrast with modern streetwear styling.'
      }
    ])
  }
}