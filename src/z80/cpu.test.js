import { describe, it, expect } from 'vitest'
import { Z80Cpu, FLAG } from './cpu.js'
import golden from './cpu.golden.json'
// Build a CPU with raw bytes loaded at address 0.
const make = (code, setup = {}) => {
  const cpu = new Z80Cpu({ onOut: setup.onOut, onIn: setup.onIn, onRst: setup.onRst })
  cpu.mem.set(code, 0)
  return cpu
}
const run = (cpu, n = 1) => { for (let i = 0; i < n; i++) cpu.step(); return cpu }

describe('registers and memory helpers', () => {
  it('pairs reflect 8-bit registers', () => {
    const cpu = new Z80Cpu()
    cpu.hl = 0x1234; cpu.bc = 0x5678; cpu.de = 0x9abc
    expect([cpu.r[4], cpu.r[5], cpu.r[0], cpu.r[1], cpu.r[2], cpu.r[3]]).toEqual([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc])
    cpu.a = 7
    expect(cpu.r[7]).toBe(7)
    cpu.setRR(3, 0x4321)
    expect(cpu.getRR(3)).toBe(0x4321)
    cpu.setRR(0, 1); cpu.setRR(1, 2); cpu.setRR(2, 3)
    expect([cpu.bc, cpu.de, cpu.hl]).toEqual([1, 2, 3])
  })
  it('(HL) access goes to memory', () => {
    const cpu = new Z80Cpu()
    cpu.hl = 0x9000
    cpu.setR(6, 0x1ff)
    expect(cpu.getR(6)).toBe(0xff)
    expect(cpu.mem[0x9000]).toBe(0xff)
  })
  it('creates its own memory by default and can reset', () => {
    const cpu = new Z80Cpu()
    cpu.halted = true
    cpu.reset()
    expect(cpu.mem.length).toBe(0x10000)
    expect(cpu.halted).toBe(false)
  })
  it('step does nothing once halted', () => {
    const cpu = make([0x00])
    cpu.halted = true
    cpu.step()
    expect(cpu.pc).toBe(0)
  })
})

describe('loads', () => {
  it('LD r,n / r,r / HALT', () => {
    const cpu = run(make([0x06, 5, 0x48, 0x76]), 3)
    expect(cpu.r[1]).toBe(5)
    expect(cpu.halted).toBe(true)
  })
  it('LD rr,nn and SP,HL', () => {
    const cpu = run(make([0x21, 0x34, 0x12, 0xf9]), 2)
    expect(cpu.hl).toBe(0x1234)
    expect(cpu.sp).toBe(0x1234)
  })
  it('indirect loads and stores', () => {
    const cpu = make([0x02, 0x0a, 0x12, 0x1a, 0x32, 0x00, 0x90, 0x3a, 0x00, 0x90, 0x22, 0x10, 0x90, 0x2a, 0x10, 0x90])
    cpu.a = 0x42; cpu.bc = 0x9100; cpu.de = 0x9200; cpu.hl = 0x7788
    run(cpu, 2)
    expect(cpu.mem[0x9100]).toBe(0x42)
    cpu.a = 0
    cpu.step(); cpu.a = 0; cpu.step()
    expect(cpu.mem[0x9200]).toBe(0)
    cpu.a = 9
    cpu.step()
    expect(cpu.mem[0x9000]).toBe(9)
    cpu.a = 0
    cpu.step()
    expect(cpu.a).toBe(9)
    cpu.step()
    expect(cpu.read16(0x9010)).toBe(0x7788)
    cpu.hl = 0
    cpu.step()
    expect(cpu.hl).toBe(0x7788)
  })
  it('LD A,(DE) reads memory', () => {
    const cpu = make([0x1a])
    cpu.de = 0x9000
    cpu.mem[0x9000] = 0x33
    run(cpu)
    expect(cpu.a).toBe(0x33)
  })
})

describe('arithmetic and flags', () => {
  it('ADD sets carry, zero, half-carry and overflow', () => {
    const cpu = make([0x80, 0x80, 0x80])
    cpu.a = 0xff; cpu.r[0] = 1
    run(cpu)
    expect(cpu.a).toBe(0)
    expect(cpu.flag(FLAG.C)).toBe(true)
    expect(cpu.flag(FLAG.Z)).toBe(true)
    expect(cpu.flag(FLAG.H)).toBe(true)
    cpu.a = 0x7f; cpu.r[0] = 1
    run(cpu)
    expect(cpu.flag(FLAG.PV)).toBe(true)
    expect(cpu.flag(FLAG.S)).toBe(true)
  })
  it('ADC and SBC include carry', () => {
    const cpu = make([0x88, 0x98])
    cpu.a = 1; cpu.r[0] = 1; cpu.f = FLAG.C
    run(cpu)
    expect(cpu.a).toBe(3)
    cpu.f = FLAG.C
    run(cpu)
    expect(cpu.a).toBe(1)
  })
  it('SUB and CP set carry on borrow; CP keeps A', () => {
    const cpu = make([0x90, 0xb8])
    cpu.a = 3; cpu.r[0] = 5
    run(cpu)
    expect(cpu.a).toBe(0xfe)
    expect(cpu.flag(FLAG.C)).toBe(true)
    expect(cpu.flag(FLAG.N)).toBe(true)
    cpu.a = 5; cpu.r[0] = 5
    run(cpu)
    expect(cpu.a).toBe(5)
    expect(cpu.flag(FLAG.Z)).toBe(true)
  })
  it('SUB overflow', () => {
    const cpu = make([0x90])
    cpu.a = 0x80; cpu.r[0] = 1
    run(cpu)
    expect(cpu.flag(FLAG.PV)).toBe(true)
  })
  it('logic ops', () => {
    const cpu = make([0xa0, 0xa8, 0xb0, 0xe6, 0x0f])
    cpu.a = 0b1100; cpu.r[0] = 0b1010
    run(cpu)
    expect(cpu.a).toBe(0b1000)
    expect(cpu.flag(FLAG.H)).toBe(true)
    cpu.a = 0b1100
    run(cpu)
    expect(cpu.a).toBe(0b0110)
    expect(cpu.flag(FLAG.PV)).toBe(true)
    run(cpu)
    expect(cpu.a).toBe(0b1110)
    cpu.a = 0xff
    run(cpu)
    expect(cpu.a).toBe(0x0f)
  })
  it('INC / DEC 8-bit flags', () => {
    const cpu = make([0x04, 0x05, 0x04, 0x05])
    cpu.r[0] = 0xff
    run(cpu)
    expect(cpu.r[0]).toBe(0)
    expect(cpu.flag(FLAG.Z)).toBe(true)
    run(cpu)
    expect(cpu.r[0]).toBe(0xff)
    cpu.r[0] = 0x7f
    run(cpu)
    expect(cpu.flag(FLAG.PV)).toBe(true)
    cpu.r[0] = 0x80
    run(cpu)
    expect(cpu.flag(FLAG.PV)).toBe(true)
  })
  it('INC / DEC 16-bit leave flags alone and wrap', () => {
    const cpu = make([0x03, 0x2b])
    cpu.bc = 0xffff; cpu.hl = 0; cpu.f = 0x55
    run(cpu, 2)
    expect(cpu.bc).toBe(0)
    expect(cpu.hl).toBe(0xffff)
    expect(cpu.f).toBe(0x55)
  })
  it('ADD HL,rr', () => {
    const cpu = make([0x19])
    cpu.hl = 0xffff; cpu.de = 2
    run(cpu)
    expect(cpu.hl).toBe(1)
    expect(cpu.flag(FLAG.C)).toBe(true)
    expect(cpu.flag(FLAG.H)).toBe(true)
  })
  it('NEG', () => {
    const cpu = make([0xed, 0x44, 0xed, 0x44])
    cpu.a = 5
    run(cpu)
    expect(cpu.a).toBe(251)
    cpu.a = 0
    run(cpu)
    expect(cpu.a).toBe(0)
    expect(cpu.flag(FLAG.C)).toBe(false)
  })
  it('CPL, SCF, CCF', () => {
    const cpu = make([0x2f, 0x37, 0x3f, 0x3f])
    cpu.a = 0x0f
    run(cpu)
    expect(cpu.a).toBe(0xf0)
    run(cpu)
    expect(cpu.flag(FLAG.C)).toBe(true)
    run(cpu)
    expect(cpu.flag(FLAG.C)).toBe(false)
    expect(cpu.flag(FLAG.H)).toBe(true)
    run(cpu)
    expect(cpu.flag(FLAG.C)).toBe(true)
  })
})

describe('rotates, shifts and bits', () => {
  it('accumulator rotates', () => {
    const cpu = make([0x07, 0x0f, 0x17, 0x1f])
    cpu.a = 0x81
    run(cpu)
    expect(cpu.a).toBe(0x03)
    expect(cpu.flag(FLAG.C)).toBe(true)
    run(cpu)
    expect(cpu.a).toBe(0x81)
    cpu.f = 0
    run(cpu)
    expect(cpu.a).toBe(0x02)
    expect(cpu.flag(FLAG.C)).toBe(true)
    run(cpu)
    expect(cpu.a).toBe(0x81)
  })
  it.each([
    [0, 0x81, 0x03], [1, 0x81, 0xc0], [2, 0x80, 0x00], [3, 0x01, 0x00],
    [4, 0x81, 0x02], [5, 0x81, 0xc0], [6, 0x80, 0x01], [7, 0x81, 0x40],
  ])('CB shift op %i of %s', (op, input, expected) => {
    const cpu = make([0xcb, (op << 3) | 7])
    cpu.a = input
    run(cpu)
    expect(cpu.a).toBe(expected)
  })
  it('RL / RR use carry', () => {
    const cpu = make([0xcb, 0x17, 0xcb, 0x1f])
    cpu.a = 0; cpu.f = FLAG.C
    run(cpu)
    expect(cpu.a).toBe(1)
    cpu.f = FLAG.C
    run(cpu)
    expect(cpu.a).toBe(0x80)
  })
  it('BIT / SET / RES', () => {
    const cpu = make([0xcb, 0x7f, 0xcb, 0x47, 0xcb, 0xff, 0xcb, 0xbf])
    cpu.a = 0x80
    run(cpu)
    expect(cpu.flag(FLAG.Z)).toBe(false)
    expect(cpu.flag(FLAG.S)).toBe(true)
    run(cpu)
    expect(cpu.flag(FLAG.Z)).toBe(true)
    cpu.a = 0
    run(cpu)
    expect(cpu.a).toBe(0x80)
    run(cpu)
    expect(cpu.a).toBe(0)
  })
  it('CB ops work on (HL)', () => {
    const cpu = make([0xcb, 0xc6])
    cpu.hl = 0x9000
    run(cpu)
    expect(cpu.mem[0x9000]).toBe(1)
  })
})

describe('control flow', () => {
  it('JP, JP cc, JP (HL)', () => {
    const cpu = make([0xc3, 0x10, 0x00])
    run(cpu)
    expect(cpu.pc).toBe(0x10)
    const c2 = make([0xca, 0x20, 0x00, 0xc2, 0x30, 0x00, 0xe9])
    c2.f = 0
    run(c2)
    expect(c2.pc).toBe(3)
    run(c2)
    expect(c2.pc).toBe(0x30)
    const c3 = make([0xe9])
    c3.hl = 0x44
    run(c3)
    expect(c3.pc).toBe(0x44)
  })
  it('evaluates every condition code', () => {
    const cpu = new Z80Cpu()
    cpu.f = 0
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((c) => cpu.condition(c))).toEqual([true, false, true, false, true, false, true, false])
    cpu.f = FLAG.Z | FLAG.C | FLAG.PV | FLAG.S
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((c) => cpu.condition(c))).toEqual([false, true, false, true, false, true, false, true])
  })
  it('JR and DJNZ', () => {
    const cpu = make([0x18, 0x02, 0x00, 0x00, 0x06, 0x02, 0x10, 0xfe, 0x20, 0x00, 0x28, 0x7f])
    run(cpu)
    expect(cpu.pc).toBe(4)
    run(cpu)
    run(cpu, 2)
    expect(cpu.r[0]).toBe(0)
    expect(cpu.pc).toBe(8)
    cpu.f = FLAG.Z
    run(cpu)
    expect(cpu.pc).toBe(10)
    run(cpu)
    expect(cpu.pc).toBe(10 + 2 + 0x7f)
  })
  it('CALL / RET and conditional variants', () => {
    const cpu = make([0xcd, 0x10, 0x00, 0x76])
    cpu.mem.set([0xc9], 0x10)
    run(cpu)
    expect(cpu.pc).toBe(0x10)
    expect(cpu.sp).toBe(0xf000 - 2)
    run(cpu)
    expect(cpu.pc).toBe(3)
    expect(cpu.sp).toBe(0xf000)
    const c2 = make([0xc4, 0x10, 0x00, 0xcc, 0x10, 0x00, 0xc0, 0xc8])
    c2.f = FLAG.Z
    run(c2)
    expect(c2.pc).toBe(3)
    run(c2)
    expect(c2.pc).toBe(0x10)
    c2.pc = 6
    c2.sp = 0x9000
    c2.write16(0x9000, 0x77)
    run(c2)
    expect(c2.pc).toBe(7)
    run(c2)
    expect(c2.pc).toBe(0x77)
  })
  it('PUSH / POP including AF', () => {
    const cpu = make([0xc5, 0xf5, 0xe1, 0xf1, 0xd1])
    cpu.bc = 0x1234; cpu.a = 0x56; cpu.f = 0x78
    run(cpu, 2)
    run(cpu)
    expect(cpu.hl).toBe(0x5678)
    cpu.a = 0; cpu.f = 0
    run(cpu)
    expect([cpu.a, cpu.f]).toEqual([0x12, 0x34])
    run(cpu)
    expect(cpu.de).toBe(0x0000)
  })
  it('RST pushes and jumps unless a hook handles it', () => {
    const cpu = make([0xd7])
    run(cpu)
    expect(cpu.pc).toBe(0x10)
    expect(cpu.read16(cpu.sp)).toBe(1)
    const hooked = make([0xd7], { onRst: () => true })
    run(hooked)
    expect(hooked.pc).toBe(1)
  })
})

describe('I/O and block ops', () => {
  it('OUT / IN', () => {
    const out = []
    const cpu = make([0xd3, 0x05, 0xdb, 0x07], { onOut: (p, v) => out.push([p, v]), onIn: () => 0x1ff })
    cpu.a = 9
    run(cpu, 2)
    expect(out).toEqual([[5, 9]])
    expect(cpu.a).toBe(0xff)
  })
  it('default I/O handlers do nothing', () => {
    const cpu = make([0xd3, 0x05, 0xdb, 0x07])
    run(cpu, 2)
    expect(cpu.a).toBe(0)
  })
  it('EX DE,HL', () => {
    const cpu = make([0xeb])
    cpu.de = 1; cpu.hl = 2
    run(cpu)
    expect([cpu.de, cpu.hl]).toEqual([2, 1])
  })
  it('LDIR and LDDR', () => {
    const cpu = make([0xed, 0xb0])
    cpu.mem.set([1, 2, 3], 0x9000)
    cpu.hl = 0x9000; cpu.de = 0x9100; cpu.bc = 3
    run(cpu, 3)
    expect(Array.from(cpu.mem.slice(0x9100, 0x9103))).toEqual([1, 2, 3])
    expect(cpu.pc).toBe(2)
    const back = make([0xed, 0xb8])
    back.mem.set([1, 2, 3], 0x9000)
    back.hl = 0x9002; back.de = 0x9102; back.bc = 3
    run(back, 3)
    expect(Array.from(back.mem.slice(0x9100, 0x9103))).toEqual([1, 2, 3])
  })
})

describe('unsupported opcodes', () => {
  it.each([
    [[0x08], /Unsupported/], [[0x27], /DAA/], [[0xd9], /EXX/], [[0xdd], /Unsupported/],
    [[0xfd], /Unsupported/], [[0xf3], /Unsupported/], [[0xe3], /Unsupported/],
    [[0xed, 0x00], /ED/],
  ])('%j', (code, pattern) => {
    expect(() => make(code).step()).toThrow(pattern)
  })
})

// Boundary-value results taken from the reference Python `z80` package (see tools/make_golden.py).
// Compared on the documented flags only: bits 3 and 5 are not modelled.
describe('golden results from a reference Z80', () => {
  const FLAGS_MASK = 0xd7
  it.each(golden)('%s', (_name, code, a, f, b, wantA, wantF, wantB) => {
    const cpu = make(code)
    cpu.a = a; cpu.f = f; cpu.r[0] = b
    run(cpu)
    expect({ A: cpu.a, F: cpu.f & FLAGS_MASK, B: cpu.r[0] }).toEqual({ A: wantA, F: wantF & FLAGS_MASK, B: wantB })
  })
})
