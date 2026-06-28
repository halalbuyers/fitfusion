const knownBrands = ['nike', 'adidas', 'puma', 'zara', 'hm', 'h&m', 'uniqlo', 'levi', 'levis', 'gucci', 'prada', 'balenciaga', 'supreme']

export function detectVisibleBrand(input: { filename?: string; tags?: string[]; manualBrand?: string }) {
  if (input.manualBrand) return { brand: input.manualBrand, confidence: 100, needsConfirmation: false }
  const text = [input.filename, ...(input.tags || [])].join(' ').toLowerCase()
  const hit = knownBrands.find((brand) => text.includes(brand))
  return {
    brand: hit ? (hit === 'hm' ? 'H&M' : hit) : '',
    confidence: hit ? 72 : 24,
    needsConfirmation: !hit || Boolean(hit)
  }
}
