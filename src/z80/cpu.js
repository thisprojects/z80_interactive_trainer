// Z80 CPU core covering the trainer's instruction subset (real Z80 opcode encoding).

export const FLAG = { S: 0x80, Z: 0x40, H: 0x10, PV: 0x04, N: 0x02, C: 0x01 }

const parity = (v) => {
  let p = v & 0xff
  p ^= p >> 4
  p ^= p >> 2
  p ^= p >> 1
  return (p & 1) === 0
}

export class Z80Cpu {
  constructor({ memory, onOut = () => {}, onIn = () => 0, onRst = () => false, onRom = () => false, onCall = () => {} } = {}) {
    this.mem = memory || new Uint8Array(0x10000)
    this.onOut = onOut
    this.onIn = onIn
    this.onRst = onRst
    this.onRom = onRom // called with a CALL target; true = handled like a ROM routine, so no call is made
    this.onCall = onCall
    this.reset()
  }

  reset() {
    // r is indexed by the Z80 register encoding: B C D E H L (unused) A
    this.r = new Uint8Array(8)
    this.f = 0
    this.ix = 0
    this.iy = 0
    this.alt = { r: new Uint8Array(8), f: 0 } // the shadow set swapped by EXX and EX AF,AF'
    this.sp = 0xf000
    this.pc = 0
    this.halted = false
  }

  // ----- register access -----
  get a() { return this.r[7] }
  set a(v) { this.r[7] = v }
  get hl() { return (this.r[4] << 8) | this.r[5] }
  set hl(v) { this.r[4] = (v >> 8) & 0xff; this.r[5] = v & 0xff }
  get bc() { return (this.r[0] << 8) | this.r[1] }
  set bc(v) { this.r[0] = (v >> 8) & 0xff; this.r[1] = v & 0xff }
  get de() { return (this.r[2] << 8) | this.r[3] }
  set de(v) { this.r[2] = (v >> 8) & 0xff; this.r[3] = v & 0xff }

  getR(i) { return i === 6 ? this.mem[this.hl] : this.r[i] }
  setR(i, v) {
    if (i === 6) this.mem[this.hl] = v & 0xff
    else this.r[i] = v & 0xff
  }

  getRR(i) { return [this.bc, this.de, this.hl, this.sp][i] }
  setRR(i, v) {
    v &= 0xffff
    if (i === 0) this.bc = v
    else if (i === 1) this.de = v
    else if (i === 2) this.hl = v
    else this.sp = v
  }

  // ----- memory / stack helpers -----
  fetch() {
    const v = this.mem[this.pc]
    this.pc = (this.pc + 1) & 0xffff
    return v
  }
  fetch16() {
    const lo = this.fetch()
    return lo | (this.fetch() << 8)
  }
  read16(addr) { return this.mem[addr & 0xffff] | (this.mem[(addr + 1) & 0xffff] << 8) }
  write16(addr, v) {
    this.mem[addr & 0xffff] = v & 0xff
    this.mem[(addr + 1) & 0xffff] = (v >> 8) & 0xff
  }
  push(v) {
    this.sp = (this.sp - 2) & 0xffff
    this.write16(this.sp, v)
  }
  pop() {
    const v = this.read16(this.sp)
    this.sp = (this.sp + 2) & 0xffff
    return v
  }

  // ----- flag helpers -----
  flag(mask) { return (this.f & mask) !== 0 }
  setFlag(mask, on) { this.f = on ? this.f | mask : this.f & ~mask }
  szFlags(res) {
    this.setFlag(FLAG.S, res & 0x80)
    this.setFlag(FLAG.Z, (res & 0xff) === 0)
  }

  condition(cc) {
    switch (cc) {
      case 0: return !this.flag(FLAG.Z)
      case 1: return this.flag(FLAG.Z)
      case 2: return !this.flag(FLAG.C)
      case 3: return this.flag(FLAG.C)
      case 4: return !this.flag(FLAG.PV)
      case 5: return this.flag(FLAG.PV)
      case 6: return !this.flag(FLAG.S)
      default: return this.flag(FLAG.S)
    }
  }

  // ----- ALU -----
  add8(v, carry) {
    const a = this.a
    const res = a + v + carry
    const r8 = res & 0xff
    this.szFlags(r8)
    this.setFlag(FLAG.H, (a & 0xf) + (v & 0xf) + carry > 0xf)
    this.setFlag(FLAG.PV, ((a ^ r8) & (v ^ r8) & 0x80) !== 0)
    this.setFlag(FLAG.N, false)
    this.setFlag(FLAG.C, res > 0xff)
    return r8
  }

  sub8(v, carry) {
    const a = this.a
    const res = a - v - carry
    const r8 = res & 0xff
    this.szFlags(r8)
    this.setFlag(FLAG.H, (a & 0xf) - (v & 0xf) - carry < 0)
    this.setFlag(FLAG.PV, ((a ^ v) & (a ^ r8) & 0x80) !== 0)
    this.setFlag(FLAG.N, true)
    this.setFlag(FLAG.C, res < 0)
    return r8
  }

  logic(res, half) {
    this.a = res
    this.szFlags(res)
    this.setFlag(FLAG.H, half)
    this.setFlag(FLAG.PV, parity(res))
    this.setFlag(FLAG.N, false)
    this.setFlag(FLAG.C, false)
  }

  alu(op, v) {
    const carry = this.flag(FLAG.C) ? 1 : 0
    switch (op) {
      case 0: this.a = this.add8(v, 0); break
      case 1: this.a = this.add8(v, carry); break
      case 2: this.a = this.sub8(v, 0); break
      case 3: this.a = this.sub8(v, carry); break
      case 4: this.logic(this.a & v, true); break
      case 5: this.logic(this.a ^ v, false); break
      case 6: this.logic(this.a | v, false); break
      default: this.sub8(v, 0) // CP: flags only
    }
  }

  inc8(v) {
    const res = (v + 1) & 0xff
    this.szFlags(res)
    this.setFlag(FLAG.H, (v & 0xf) === 0xf)
    this.setFlag(FLAG.PV, v === 0x7f)
    this.setFlag(FLAG.N, false)
    return res
  }

  dec8(v) {
    const res = (v - 1) & 0xff
    this.szFlags(res)
    this.setFlag(FLAG.H, (v & 0xf) === 0)
    this.setFlag(FLAG.PV, v === 0x80)
    this.setFlag(FLAG.N, true)
    return res
  }

  // 16-bit ADD (HL, IX or IY as the base): H, N, C only
  add16(base, v) {
    const res = base + v
    this.setFlag(FLAG.H, (base & 0xfff) + (v & 0xfff) > 0xfff)
    this.setFlag(FLAG.N, false)
    this.setFlag(FLAG.C, res > 0xffff)
    return res & 0xffff
  }

  addHL(v) {
    this.hl = this.add16(this.hl, v)
  }

  // ADC HL,rr / SBC HL,rr: all of S Z H P/V N C
  adc16(v, carry) {
    const hl = this.hl
    const res = hl + v + carry
    const r16 = res & 0xffff
    this.setFlag(FLAG.S, r16 & 0x8000)
    this.setFlag(FLAG.Z, r16 === 0)
    this.setFlag(FLAG.H, (hl & 0xfff) + (v & 0xfff) + carry > 0xfff)
    this.setFlag(FLAG.PV, ((hl ^ r16) & (v ^ r16) & 0x8000) !== 0)
    this.setFlag(FLAG.N, false)
    this.setFlag(FLAG.C, res > 0xffff)
    this.hl = r16
  }

  sbc16(v, carry) {
    const hl = this.hl
    const res = hl - v - carry
    const r16 = res & 0xffff
    this.setFlag(FLAG.S, r16 & 0x8000)
    this.setFlag(FLAG.Z, r16 === 0)
    this.setFlag(FLAG.H, (hl & 0xfff) - (v & 0xfff) - carry < 0)
    this.setFlag(FLAG.PV, ((hl ^ v) & (hl ^ r16) & 0x8000) !== 0)
    this.setFlag(FLAG.N, true)
    this.setFlag(FLAG.C, res < 0)
    this.hl = r16
  }

  // DAA: adjust A after a BCD add or subtract
  daa() {
    const a = this.a
    const n = this.flag(FLAG.N)
    let adjust = 0
    let carry = this.flag(FLAG.C)
    if (this.flag(FLAG.H) || (a & 0xf) > 9) adjust |= 0x06
    if (carry || a > 0x99) { adjust |= 0x60; carry = true }
    const res = (n ? a - adjust : a + adjust) & 0xff
    this.a = res
    this.szFlags(res)
    this.setFlag(FLAG.H, n ? this.flag(FLAG.H) && (a & 0xf) < 6 : (a & 0xf) > 9)
    this.setFlag(FLAG.PV, parity(res))
    this.setFlag(FLAG.C, carry)
  }

  // CB-prefix rotate/shift; sets S Z P C and returns the result
  shift(op, v) {
    const c = this.flag(FLAG.C) ? 1 : 0
    let res
    let out
    switch (op) {
      case 0: out = v >> 7; res = ((v << 1) | out) & 0xff; break // RLC
      case 1: out = v & 1; res = ((v >> 1) | (out << 7)) & 0xff; break // RRC
      case 2: out = v >> 7; res = ((v << 1) | c) & 0xff; break // RL
      case 3: out = v & 1; res = ((v >> 1) | (c << 7)) & 0xff; break // RR
      case 4: out = v >> 7; res = (v << 1) & 0xff; break // SLA
      case 5: out = v & 1; res = (v >> 1) | (v & 0x80); break // SRA
      case 6: out = v >> 7; res = ((v << 1) | 1) & 0xff; break // SLL
      default: out = v & 1; res = v >> 1 // SRL
    }
    this.szFlags(res)
    this.setFlag(FLAG.H, false)
    this.setFlag(FLAG.PV, parity(res))
    this.setFlag(FLAG.N, false)
    this.setFlag(FLAG.C, out)
    return res
  }

  execCB() {
    const op = this.fetch()
    const reg = op & 7
    const bit = (op >> 3) & 7
    const group = op >> 6
    const out = this.cbApply(group, bit, this.getR(reg))
    if (out !== null) this.setR(reg, out)
  }

  // Shared by CB and DD/FD CB: returns the byte to write back, or null for BIT.
  cbApply(group, bit, v) {
    if (group === 0) return this.shift(bit, v)
    if (group === 1) {
      const zero = (v & (1 << bit)) === 0
      this.setFlag(FLAG.Z, zero)
      this.setFlag(FLAG.PV, zero)
      this.setFlag(FLAG.S, bit === 7 && !zero)
      this.setFlag(FLAG.H, true)
      this.setFlag(FLAG.N, false)
      return null
    }
    return group === 2 ? v & ~(1 << bit) : v | (1 << bit)
  }

  execED() {
    const op = this.fetch()
    switch (op) {
      case 0x44: { // NEG
        const a = this.a
        this.a = 0
        this.a = this.sub8(a, 0)
        break
      }
      case 0xa0: case 0xa8: case 0xb0: case 0xb8: { // LDI LDD LDIR LDDR
        const step = op & 8 ? -1 : 1
        this.mem[this.de] = this.mem[this.hl]
        this.hl = this.hl + step
        this.de = this.de + step
        this.bc = this.bc - 1
        this.setFlag(FLAG.H, false)
        this.setFlag(FLAG.N, false)
        this.setFlag(FLAG.PV, this.bc !== 0)
        if (op & 0x10 && this.bc !== 0) this.pc = (this.pc - 2) & 0xffff
        break
      }
      case 0xa1: case 0xa9: case 0xb1: case 0xb9: { // CPI CPD CPIR CPDR
        const step = op & 8 ? -1 : 1
        const v = this.mem[this.hl]
        const res = (this.a - v) & 0xff
        this.szFlags(res)
        this.setFlag(FLAG.H, (this.a & 0xf) < (v & 0xf))
        this.setFlag(FLAG.N, true)
        this.hl = this.hl + step
        this.bc = this.bc - 1
        this.setFlag(FLAG.PV, this.bc !== 0)
        if (op & 0x10 && this.bc !== 0 && res !== 0) this.pc = (this.pc - 2) & 0xffff
        break
      }
      default:
        if ((op & 0xcf) === 0x42) this.sbc16(this.getRR((op >> 4) & 3), this.flag(FLAG.C) ? 1 : 0)
        else if ((op & 0xcf) === 0x4a) this.adc16(this.getRR((op >> 4) & 3), this.flag(FLAG.C) ? 1 : 0)
        else if ((op & 0xcf) === 0x43) this.write16(this.fetch16(), this.getRR((op >> 4) & 3))
        else if ((op & 0xcf) === 0x4b) this.setRR((op >> 4) & 3, this.read16(this.fetch16()))
        else if ((op & 0xc7) === 0x41) this.onOut(this.r[1], ((op >> 3) & 7) === 6 ? 0 : this.r[(op >> 3) & 7]) // OUT (C),r
        else throw new Error(`Unsupported opcode ED ${op.toString(16).toUpperCase()} at ${this.pc - 2}`)
    }
  }

  // DD / FD prefixed instructions: the documented IX / IY forms only.
  execIndexed(reg) {
    const op = this.fetch()
    const disp = () => (this.fetch() << 24) >> 24
    const at = () => (this[reg] + disp()) & 0xffff
    const x = op >> 6
    const y = (op >> 3) & 7
    const z = op & 7
    switch (op) {
      case 0x21: this[reg] = this.fetch16(); return
      case 0x22: this.write16(this.fetch16(), this[reg]); return
      case 0x2a: this[reg] = this.read16(this.fetch16()); return
      case 0x23: this[reg] = (this[reg] + 1) & 0xffff; return
      case 0x2b: this[reg] = (this[reg] - 1) & 0xffff; return
      case 0x09: case 0x19: case 0x29: case 0x39: {
        const rr = (op >> 4) & 3
        this[reg] = this.add16(this[reg], rr === 2 ? this[reg] : this.getRR(rr))
        return
      }
      case 0x34: { const a = at(); this.mem[a] = this.inc8(this.mem[a]); return }
      case 0x35: { const a = at(); this.mem[a] = this.dec8(this.mem[a]); return }
      case 0x36: { const a = at(); this.mem[a] = this.fetch(); return }
      case 0xe1: this[reg] = this.pop(); return
      case 0xe5: this.push(this[reg]); return
      case 0xe9: this.pc = this[reg]; return
      case 0xf9: this.sp = this[reg]; return
      case 0xe3: {
        const t = this.read16(this.sp)
        this.write16(this.sp, this[reg])
        this[reg] = t
        return
      }
      case 0xcb: {
        const a = at()
        const sub = this.fetch()
        if ((sub & 7) !== 6) break
        const out = this.cbApply(sub >> 6, (sub >> 3) & 7, this.mem[a])
        if (out !== null) this.mem[a] = out
        return
      }
      default:
        if (x === 1 && z === 6 && y !== 6) { this.r[y] = this.mem[at()]; return } // LD r,(IX+d)
        if (x === 1 && y === 6 && z !== 6) { this.mem[at()] = this.r[z]; return } // LD (IX+d),r
        if (x === 2 && z === 6) { this.alu(y, this.mem[at()]); return } // ALU A,(IX+d)
    }
    const hex = op.toString(16).toUpperCase().padStart(2, '0')
    throw new Error(`Unsupported opcode ${reg === 'ix' ? 'DD' : 'FD'} ${hex} at ${(this.pc - 2) & 0xffff}`)
  }

  // Execute one instruction.
  step() {
    if (this.halted) return
    const start = this.pc
    const op = this.fetch()
    const x = op >> 6
    const y = (op >> 3) & 7
    const z = op & 7
    const p = y >> 1

    if (x === 1) {
      if (op === 0x76) this.halted = true
      else this.setR(y, this.getR(z))
      return
    }
    if (x === 2) {
      this.alu(y, this.getR(z))
      return
    }
    if (x === 0) return this.execX0(op, y, z, p)
    return this.execX3(op, y, z, p, start)
  }

  execX0(op, y, z, p) {
    switch (z) {
      case 0:
        if (y === 0) return // NOP
        if (y === 1) { // EX AF,AF'
          const a = this.a
          this.a = this.alt.r[7]
          this.alt.r[7] = a
          const f = this.f
          this.f = this.alt.f
          this.alt.f = f
          return
        }
        if (y === 2) { // DJNZ
          const d = (this.fetch() << 24) >> 24
          this.r[0] = (this.r[0] - 1) & 0xff
          if (this.r[0] !== 0) this.pc = (this.pc + d) & 0xffff
          return
        }
        if (y === 3 || y >= 4) { // JR / JR cc
          const d = (this.fetch() << 24) >> 24
          if (y === 3 || this.condition(y - 4)) this.pc = (this.pc + d) & 0xffff
          return
        }
        break
      case 1:
        if (y & 1) this.addHL(this.getRR(p))
        else this.setRR(p, this.fetch16())
        return
      case 2:
        switch (y) {
          case 0: this.mem[this.bc] = this.a; return
          case 1: this.a = this.mem[this.bc]; return
          case 2: this.mem[this.de] = this.a; return
          case 3: this.a = this.mem[this.de]; return
          case 4: this.write16(this.fetch16(), this.hl); return
          case 5: this.hl = this.read16(this.fetch16()); return
          case 6: this.mem[this.fetch16()] = this.a; return
          default: this.a = this.mem[this.fetch16()]; return
        }
      case 3:
        this.setRR(p, this.getRR(p) + (y & 1 ? -1 : 1))
        return
      case 4: this.setR(y, this.inc8(this.getR(y))); return
      case 5: this.setR(y, this.dec8(this.getR(y))); return
      case 6: this.setR(y, this.fetch()); return
      default: // z === 7
        return this.execAccumulatorOps(y)
    }
    throw new Error(`Unsupported opcode ${op.toString(16).toUpperCase()}`)
  }

  execAccumulatorOps(y) {
    const a = this.a
    const c = this.flag(FLAG.C) ? 1 : 0
    let out
    switch (y) {
      case 0: out = a >> 7; this.a = ((a << 1) | out) & 0xff; break // RLCA
      case 1: out = a & 1; this.a = (a >> 1) | (out << 7); break // RRCA
      case 2: out = a >> 7; this.a = ((a << 1) | c) & 0xff; break // RLA
      case 3: out = a & 1; this.a = (a >> 1) | (c << 7); break // RRA
      case 5: // CPL
        this.a = ~a & 0xff
        this.setFlag(FLAG.H, true)
        this.setFlag(FLAG.N, true)
        return
      case 6: // SCF
        this.setFlag(FLAG.C, true)
        this.setFlag(FLAG.H, false)
        this.setFlag(FLAG.N, false)
        return
      case 7: // CCF
        this.setFlag(FLAG.H, c === 1)
        this.setFlag(FLAG.C, c === 0)
        this.setFlag(FLAG.N, false)
        return
      default: this.daa(); return // y = 4
    }
    this.setFlag(FLAG.C, out)
    this.setFlag(FLAG.H, false)
    this.setFlag(FLAG.N, false)
  }

  execX3(op, y, z, p, start) {
    switch (z) {
      case 0:
        if (this.condition(y)) this.pc = this.pop()
        return
      case 1:
        if (!(y & 1)) {
          const v = this.pop()
          if (p === 3) { this.a = v >> 8; this.f = v & 0xff } else this.setRR(p, v)
        } else if (p === 0) this.pc = this.pop() // RET
        else if (p === 1) { // EXX
          for (let i = 0; i < 6; i++) [this.r[i], this.alt.r[i]] = [this.alt.r[i], this.r[i]]
        }
        else if (p === 2) this.pc = this.hl // JP (HL)
        else this.sp = this.hl // LD SP,HL
        return
      case 2: {
        const nn = this.fetch16()
        if (this.condition(y)) this.pc = nn
        return
      }
      case 3:
        switch (y) {
          case 0: this.pc = this.fetch16(); return // JP nn
          case 1: this.execCB(); return
          case 2: this.onOut(this.fetch(), this.a); return // OUT (n),A
          case 3: this.a = this.onIn(this.fetch()) & 0xff; return // IN A,(n)
          case 4: { // EX (SP),HL
            const t = this.read16(this.sp)
            this.write16(this.sp, this.hl)
            this.hl = t
            return
          }
          case 5: { // EX DE,HL
            const t = this.de
            this.de = this.hl
            this.hl = t
            return
          }
          default: break
        }
        break
      case 4: {
        const nn = this.fetch16()
        if (this.condition(y) && !this.onRom(nn, this)) {
          this.push(this.pc)
          this.pc = nn
          this.onCall(nn)
        }
        return
      }
      case 5:
        if (!(y & 1)) {
          this.push(p === 3 ? (this.a << 8) | this.f : this.getRR(p))
        } else if (p === 0) { // CALL nn
          const nn = this.fetch16()
          if (!this.onRom(nn, this)) {
            this.push(this.pc)
            this.pc = nn
            this.onCall(nn)
          }
        } else if (p === 2) this.execED()
        else if (p === 1) this.execIndexed('ix')
        else this.execIndexed('iy')
        return
      case 6: this.alu(y, this.fetch()); return
      default: { // RST
        const target = y * 8
        if (!this.onRst(target, this)) {
          this.push(this.pc)
          this.pc = target
        }
        return
      }
    }
    throw new Error(`Unsupported opcode ${op.toString(16).toUpperCase()} at ${start}`)
  }
}
