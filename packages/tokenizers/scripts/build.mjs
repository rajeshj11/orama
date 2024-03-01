import path from 'node:path'
import fs from 'node:fs'
import childProcess from 'node:child_process'

const isWasmPackInstalled = await checkWasmPackInstalled()
  
if (!isWasmPackInstalled) {
  console.warn('!! WARNING')
  console.warn('!! Compilation of the Mandarin tokenizer requires wasm-pack to be installed.')
  console.warn('!! No wasm-pack installation found. Skipping build.')
  process.exit(0)
}

const outdirBaseURL = new URL('../build', import.meta.url).pathname
const tokenizersBaseURL = new URL('../src', import.meta.url).pathname

const mandarinTokenizerPath = path.join(tokenizersBaseURL, 'tokenizer-mandarin')
const mandarinTokenizerWasmPath = path.join(mandarinTokenizerPath, 'pkg')
const mandarinTokenizerDistPath = path.join(tokenizersBaseURL, '../build/tokenizer-mandarin')
const mandarinTokenizerWrapperPath = path.join(tokenizersBaseURL, 'tokenizer-mandarin/src/tokenizer.ts')
const mandarinTokenizerWrapperDistPath = path.join(mandarinTokenizerDistPath, 'tokenizer.ts')

if (fs.existsSync(outdirBaseURL)) {
  fs.rmdirSync(outdirBaseURL, { recursive: true })
}

fs.mkdirSync(outdirBaseURL)

childProcess.execSync(`cd ${mandarinTokenizerPath} && wasm-pack build --target web`)

fs.cpSync(mandarinTokenizerWrapperPath, mandarinTokenizerWrapperDistPath, {
  recursive: true
})

fs.cpSync(mandarinTokenizerWasmPath, mandarinTokenizerDistPath, {
  recursive: true
})

fs.rmSync(path.join(mandarinTokenizerDistPath, '.gitignore'))

const r = fs.readFileSync('./build/tokenizer-mandarin/tokenizer_mandarin_bg.wasm')
const b = new Uint8Array(r)
const rr = `export const wasm = new Uint8Array([${b.join(',')}]);`
fs.writeFileSync('./build/tokenizer-mandarin/tokenizer_mandarin_bg_wasm_arr.js', rr)

childProcess.execSync(`cd ${mandarinTokenizerDistPath} && npx tsup --format cjs,esm,iife --outDir . tokenizer.ts`)

async function checkWasmPackInstalled() {
  return new Promise((resolve) => {
    childProcess.exec('wasm-pack --version', (err) => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}