const fs = require('fs')
const os = require('os')
const path = require('path')
const zlib = require('zlib')

function crc32(buf) {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}

function png(rgb) {
  const width = 16
  const height = 16
  const rows = []
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 3)
    for (let x = 0; x < width; x += 1) {
      row[1 + x * 3] = rgb[0]
      row[2 + x * 3] = rgb[1]
      row[3 + x * 3] = rgb[2]
    }
    rows.push(row)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0))
  ])
}

async function main() {
  const { Vibrant } = await import('node-vibrant/node')
  const cases = [
    ['red', [255, 0, 0]],
    ['blue', [0, 0, 255]],
    ['white', [255, 255, 255]],
    ['green', [0, 255, 0]],
    ['beige', [216, 196, 154]]
  ]

  for (const [name, rgb] of cases) {
    const file = path.join(os.tmpdir(), `noircloset-vibrant-${name}-${Date.now()}.png`)
    fs.writeFileSync(file, png(rgb))
    const palette = await Vibrant.from(file).maxColorCount(8).quality(1).getPalette()
    const swatches = Object.entries(palette)
      .filter(([, swatch]) => Boolean(swatch))
      .map(([key, swatch]) => `${key}:${swatch.hex}:${swatch.rgb.map((n) => Math.round(n)).join(',')}`)
      .join(' | ')
    console.log(`${name} ${swatches}`)
    fs.unlinkSync(file)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
