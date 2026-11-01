// Companion to compare_cpu.py: runs the generated cases on src/z80/cpu.js.
import { readFileSync, unlinkSync } from 'node:fs'
import { Z80Cpu } from '../src/z80/cpu.js'

const path = new URL('./cases.json', import.meta.url)
const { cases, strict, ptr, org } = JSON.parse(readFileSync(path))
const FLAG_MASK = strict ? 0xff : 0xd7 // ignore undocumented bits 3 and 5
const hex = (v) => v.toString(16).toUpperCase().padStart(2, '0')

const groups = new Map()
let failures = 0
for (const c of cases) {
  const mem = new Uint8Array(0x10000)
  mem.set([...c.code, 0x76], org)
  mem.set(Array.from({ length: 16 }, (_, i) => i), ptr)
  if ('mem' in c.init) mem[ptr] = c.init.mem
  const cpu = new Z80Cpu({ memory: mem })
  cpu.sp = c.init.sp ?? 0xf000
  cpu.pc = org
  const names = { b: 0, c: 1, d: 2, e: 3, h: 4, l: 5, a: 7 }
  for (const [k, v] of Object.entries(c.init)) {
    if (k in names) cpu.r[names[k]] = v
    else if (k === 'f') cpu.f = v
  }
  let steps = 0
  while (!cpu.halted && steps++ < 1000) cpu.step()
  const got = { a: cpu.a, f: cpu.f, b: cpu.r[0], c: cpu.r[1], d: cpu.r[2], e: cpu.r[3], h: cpu.r[4], l: cpu.r[5], sp: cpu.sp, pc: cpu.pc }
  const bad = []
  for (const k of Object.keys(got)) {
    const mask = k === 'f' ? FLAG_MASK : 0xffff
    if ((got[k] & mask) !== (c.expect[k] & mask)) bad.push(`${k.toUpperCase()}: got ${hex(got[k])} want ${hex(c.expect[k])}`)
  }
  const seen = [...mem.slice(ptr, ptr + 0x110), ...mem.slice(0xeff0, 0xf000)]
  for (let i = 0; i < c.expect.mem.length; i++) {
    if (seen[i] !== c.expect.mem[i]) { bad.push(`mem[${i}]: got ${hex(seen[i])} want ${hex(c.expect.mem[i])}`); break }
  }
  if (bad.length) {
    failures++
    const key = c.name.split(' ').slice(0, 2).join(' ')
    if (!groups.has(key)) groups.set(key, { n: 0, example: `${c.name} -> ${bad.join('; ')}` })
    groups.get(key).n++
  }
}
unlinkSync(path)
console.log(`${cases.length - failures}/${cases.length} cases match (flag mask ${hex(FLAG_MASK)})`)
for (const [key, g] of groups) console.log(`  FAIL ${key} x${g.n}: ${g.example}`)
process.exit(failures ? 1 : 0)
