const fs = require('fs')
const ts = require('typescript')

require.extensions['.ts'] = function loadTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true
    }
  })
  module._compile(output.outputText, filename)
}

const { hexToColorFamily } = require('../src/lib/color-engine.ts')

const cases = [
  ['white', '#ffffff'],
  ['off-white', '#f5f5f5'],
  ['light gray', '#e5e5e5'],
  ['red', '#ff0000'],
  ['blue', '#0000ff'],
  ['green', '#00ff00'],
  ['beige', '#d8c49a'],
  ['black', '#000000']
]

for (const [label, hex] of cases) {
  console.log(`${label} -> ${hexToColorFamily(hex)}`)
}
