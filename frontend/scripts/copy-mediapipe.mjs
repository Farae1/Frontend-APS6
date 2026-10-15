// Copies MediaPipe's WebAssembly files (face detection) to public/mediapipe,
// where the browser loads them from. Runs after `npm install`; the folder is
// generated, so it stays out of git.
import { cpSync, mkdirSync } from 'node:fs'

const source = 'node_modules/@mediapipe/tasks-vision/wasm'
const target = 'public/mediapipe'
const files = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
]

mkdirSync(target, { recursive: true })
for (const file of files) cpSync(`${source}/${file}`, `${target}/${file}`)
console.log(`MediaPipe copied to ${target}`)
