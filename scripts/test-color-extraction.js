const fs = require('fs')
const os = require('os')
const path = require('path')
const ts = require('typescript')
const sharp = require('sharp')

require.extensions['.ts'] = function loadTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  })
  module._compile(output.outputText, filename)
}

const { extractImageColors } = require('../src/lib/image-color-extraction.ts')

const fixtures = [
  { name: 'red-shirt.webp', clothing: [255, 0, 0], background: [214, 196, 166], format: 'webp' },
  { name: 'blue-jeans.webp', clothing: [0, 0, 255], background: [42, 130, 60], format: 'webp' },
  { name: 'white-hoodie.webp', clothing: [255, 255, 255], background: [132, 88, 45], format: 'webp' },
  { name: 'green-shirt.png', clothing: [0, 255, 0], background: [232, 232, 225], format: 'png' },
  { name: 'beige-jacket.jpg', clothing: [216, 196, 154], background: [92, 130, 78], format: 'jpeg' },
  { name: 'black-hoodie.jpg', clothing: [8, 8, 8], background: [255, 255, 255], format: 'jpeg' }
]

async function ensureFixture(fixture, directory) {
  const localPath = path.join(process.cwd(), 'test-fixtures', 'color-extraction', fixture.name)
  if (fs.existsSync(localPath)) return localPath

  const generatedPath = path.join(directory, fixture.name)
  const base = sharp({
    create: {
      width: 160,
      height: 160,
      channels: 3,
      background: { r: fixture.background[0], g: fixture.background[1], b: fixture.background[2] }
    }
  })

  const clothing = await sharp({
    create: {
      width: 74,
      height: 96,
      channels: 3,
      background: { r: fixture.clothing[0], g: fixture.clothing[1], b: fixture.clothing[2] }
    }
  })
    .png()
    .toBuffer()

  await base
    .composite([{ input: clothing, left: 43, top: 32 }])
    .toFormat(fixture.format)
    .toFile(generatedPath)

  return generatedPath
}

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'noircloset-color-test-'))

  for (const fixture of fixtures) {
    const filePath = await ensureFixture(fixture, tempDir)
    const detected = await extractImageColors(filePath)

    console.log(fixture.name)
    console.log(`Detected: ${detected.colors.join(', ') || 'none'}`)
    console.log(`Primary: ${detected.primaryColor}`)
    console.log(`Secondary: ${detected.secondaryColors.join(', ') || 'none'}`)
    console.log(`Raw Hex: ${detected.rawHex.join(', ') || 'none'}`)
    console.log('')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
