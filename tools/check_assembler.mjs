// Assemble every reference solution and every file in tools/samples with our assembler
// and with `pasmo`, and report any byte difference.
//
//   npm run check:assembler        (needs `pasmo` on the PATH: `brew install pasmo` / `apt install pasmo`)
//
// Exit codes: 0 = all identical, 1 = a difference, 2 = pasmo is not installed.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import solutions from '../src/data/solutions.js'
import { assemble } from '../src/z80/assembler.js'

if (spawnSync('pasmo', ['--version']).error) {
  console.error('pasmo is not installed (try `brew install pasmo` or `apt install pasmo`).')
  process.exit(2)
}

const samplesDir = new URL('./samples/', import.meta.url)
const sources = Object.entries(solutions).map(([id, src]) => [`solution:${id}`, src])
for (const f of readdirSync(samplesDir).filter((n) => n.endsWith('.asm'))) {
  sources.push([`sample:${f}`, readFileSync(new URL(f, samplesDir), 'utf8')])
}

const dir = mkdtempSync(join(tmpdir(), 'z80-asm-'))
let bad = 0
try {
  for (const [name, src] of sources) {
    const file = join(dir, 'x.asm')
    const out = join(dir, 'x.bin')
    writeFileSync(file, src)
    const theirs = spawnSync('pasmo', ['--bin', file, out], { encoding: 'utf8' })
    if (theirs.status !== 0) {
      console.log(`SKIP     ${name}: pasmo rejected it (${(theirs.stderr || theirs.stdout).trim().split('\n')[0]})`)
      bad++
      continue
    }
    const ours = Buffer.from(assemble(src).segments.flatMap((s) => s.bytes))
    if (ours.equals(readFileSync(out))) console.log(`identical ${name} (${ours.length} bytes)`)
    else { console.log(`DIFFERENT ${name}`); bad++ }
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}
console.log(bad ? `\n${bad} problem(s).` : `\nAll ${sources.length} sources are byte-identical to pasmo.`)
process.exit(bad ? 1 : 0)
