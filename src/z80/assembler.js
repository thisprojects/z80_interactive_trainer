// Two-pass Z80 assembler for the beginner subset. Emits real Z80 machine code.

export class AsmError extends Error {
  constructor(message, line) {
    super(line ? `Line ${line}: ${message}` : message)
    this.name = 'AsmError'
    this.line = line
  }
}

export const DEFAULT_ORIGIN = 0x8000

const REG8 = { b: 0, c: 1, d: 2, e: 3, h: 4, l: 5, a: 7 }
const REG16 = { bc: 0, de: 1, hl: 2, sp: 3 }
const COND = { nz: 0, z: 1, nc: 2, c: 3, po: 4, pe: 5, p: 6, m: 7 }
const ALU_OPS = { add: 0, adc: 1, sub: 2, sbc: 3, and: 4, xor: 5, or: 6, cp: 7 }
const SHIFT_OPS = { rlc: 0, rrc: 1, rl: 2, rr: 3, sla: 4, sra: 5, sll: 6, srl: 7 }
const BIT_OPS = { bit: 1, res: 2, set: 3 }
const SIMPLE = {
  nop: [0x00], halt: [0x76], rlca: [0x07], rrca: [0x0f], rla: [0x17], rra: [0x1f],
  cpl: [0x2f], scf: [0x37], ccf: [0x3f], neg: [0xed, 0x44], ldir: [0xed, 0xb0],
  lddr: [0xed, 0xb8], ret: [0xc9],
}
// Real Z80 instructions this trainer does not implement. Naming them explicitly stops an
// un-indented one (e.g. `ldi`) from being silently read as a label.
const UNSUPPORTED = new Set([
  'ldi', 'ldd', 'cpi', 'cpd', 'cpir', 'cpdr', 'ini', 'ind', 'inir', 'indr', 'outi', 'outd', 'otir', 'otdr',
  'di', 'ei', 'im', 'reti', 'retn', 'daa', 'exx', 'rld', 'rrd',
])
const RESERVED_LABELS = new Set([...Object.keys(REG8), ...Object.keys(REG16), ...Object.keys(COND), 'af'])
const MAX_ADDRESS = 0x10000
const DIRECTIVES = new Set(['org', 'equ', 'db', 'defb', 'dw', 'defw', 'ds', 'defs', 'end'])
const MNEMONICS = new Set([
  ...Object.keys(SIMPLE), ...Object.keys(ALU_OPS), ...Object.keys(SHIFT_OPS),
  ...Object.keys(BIT_OPS), 'ld', 'inc', 'dec', 'jp', 'jr', 'djnz', 'call', 'push',
  'pop', 'rst', 'out', 'in', 'ex',
])

// ---------- expression evaluation ----------

function tokenizeExpr(text, line) {
  const tokens = []
  const re = /\s*(?:(0x[0-9a-f]+|\$[0-9a-f]+(?![\w])|[0-9][0-9a-f]*h(?![\w])|0b[01]+|%[01]+|[0-9]+)|('(?:[^'\\]|\\.)')|("(?:[^"\\]|\\.)")|([a-z_.][\w.]*)|(\$)|(<<|>>|[-+*/&|^~()]))/iy
  let pos = 0
  while (pos < text.length) {
    re.lastIndex = pos
    const m = re.exec(text)
    if (!m) {
      if (text.slice(pos).trim() === '') break
      throw new AsmError(`Cannot parse expression "${text.trim()}"`, line)
    }
    pos = re.lastIndex
    if (m[1] !== undefined) tokens.push({ t: 'num', v: parseNumber(m[1]) })
    else if (m[2] !== undefined || m[3] !== undefined) {
      const body = (m[2] || m[3]).slice(1, -1)
      tokens.push({ t: 'num', v: unescape(body).charCodeAt(0) })
    } else if (m[4] !== undefined) tokens.push({ t: 'id', v: m[4].toLowerCase() })
    else if (m[5] !== undefined) tokens.push({ t: 'here' })
    else tokens.push({ t: 'op', v: m[6] })
  }
  return tokens
}

function parseNumber(s) {
  const l = s.toLowerCase()
  if (l.startsWith('0x')) return parseInt(l.slice(2), 16)
  if (l.startsWith('$')) return parseInt(l.slice(1), 16)
  if (l.startsWith('0b')) return parseInt(l.slice(2), 2)
  if (l.startsWith('%')) return parseInt(l.slice(1), 2)
  if (/h$/.test(l)) return parseInt(l.slice(0, -1), 16)
  return parseInt(l, 10)
}

function unescape(s) {
  if (s[0] !== '\\') return s
  return { n: '\n', r: '\r', t: '\t', 0: '\0', '\\': '\\', "'": "'", '"': '"' }[s[1]] ?? s[1]
}

// Evaluates an expression. `symbols` is a Map; `here` is the current address.
// Returns undefined when a symbol is not (yet) defined and `allowUndefined` is set.
export function evaluate(text, symbols, here, line, allowUndefined = false) {
  const tokens = tokenizeExpr(text, line)
  if (tokens.length === 0) throw new AsmError('Missing expression', line)
  let i = 0
  let undef = false

  const primary = () => {
    const tok = tokens[i++]
    if (!tok) throw new AsmError(`Unexpected end of expression "${text.trim()}"`, line)
    if (tok.t === 'num') return tok.v
    if (tok.t === 'here') return here
    if (tok.t === 'id') {
      if (symbols.has(tok.v)) return symbols.get(tok.v)
      if (allowUndefined) { undef = true; return 0 }
      throw new AsmError(`Unknown symbol "${tok.v}"`, line)
    }
    if (tok.v === '(') {
      const v = or()
      if (tokens[i++]?.v !== ')') throw new AsmError('Missing ")"', line)
      return v
    }
    if (tok.v === '-') return -primary()
    if (tok.v === '+') return primary()
    if (tok.v === '~') return ~primary()
    throw new AsmError(`Unexpected "${tok.v}" in expression`, line)
  }
  const binary = (next, ops) => () => {
    let v = next()
    while (tokens[i]?.t === 'op' && ops[tokens[i].v]) {
      const f = ops[tokens[i++].v]
      v = f(v, next())
    }
    return v
  }
  const divide = (a, b) => {
    if (b === 0) throw new AsmError('Division by zero', line)
    return Math.trunc(a / b)
  }
  const shiftBy = (f) => (a, b) => {
    if (b < 0 || b > 31) throw new AsmError(`Shift count ${b} must be between 0 and 31`, line)
    return f(a, b)
  }
  const mul = binary(primary, { '*': (a, b) => a * b, '/': divide })
  const add = binary(mul, { '+': (a, b) => a + b, '-': (a, b) => a - b })
  const shift = binary(add, { '<<': shiftBy((a, b) => a << b), '>>': shiftBy((a, b) => a >> b) })
  const and = binary(shift, { '&': (a, b) => a & b })
  const xor = binary(and, { '^': (a, b) => a ^ b })
  const or = binary(xor, { '|': (a, b) => a | b })

  const value = or()
  if (i < tokens.length) throw new AsmError(`Unexpected "${tokens[i].v ?? '$'}" in expression`, line)
  return undef ? undefined : value
}

// ---------- line parsing ----------

function stripComment(line) {
  let quote = null
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === ';') return line.slice(0, i)
  }
  return line
}

function splitOperands(text) {
  const out = []
  let depth = 0
  let quote = null
  let cur = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      cur += ch
      if (ch === '\\') cur += text[++i] ?? ''
      else if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") { quote = ch; cur += ch }
    else if (ch === '(') { depth++; cur += ch }
    else if (ch === ')') { depth--; cur += ch }
    else if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = '' }
    else cur += ch
  }
  if (cur.trim() !== '' || out.length) out.push(cur.trim())
  return out
}

function parseLine(raw, lineNo) {
  const text = stripComment(raw).replace(/\s+$/, '')
  if (text.trim() === '') return null
  let rest = text
  let label = null
  const m = /^([A-Za-z_.][\w.]*)(:?)/.exec(text)
  if (m && text[0] !== ' ' && text[0] !== '\t') {
    const word = m[1].toLowerCase()
    const isOp = (MNEMONICS.has(word) || DIRECTIVES.has(word)) && !m[2]
    if (UNSUPPORTED.has(word) && !m[2]) {
      // `ldi` alone is the unsupported instruction; `ldi EQU 5` or `ldi DB 1` is a label that shares its name
      const next = /^\s*(\S+)/.exec(text.slice(m[0].length))?.[1]?.toLowerCase()
      if (!(next && (MNEMONICS.has(next) || DIRECTIVES.has(next)))) {
        throw new AsmError(`${word.toUpperCase()} is not supported by this trainer`, lineNo)
      }
    }
    if (!isOp) {
      label = word
      rest = text.slice(m[0].length)
    }
  } else if (/^\s*[A-Za-z_.][\w.]*:/.test(text)) {
    const mm = /^\s*([A-Za-z_.][\w.]*):/.exec(text)
    label = mm[1].toLowerCase()
    rest = text.slice(mm[0].length)
  }
  rest = rest.trim()
  if (rest === '') return { label, lineNo }
  const sp = /^(\S+)\s*(.*)$/.exec(rest)
  let mnemonic = sp[1].toLowerCase()
  let args = sp[2]
  if (UNSUPPORTED.has(mnemonic)) throw new AsmError(`${mnemonic.toUpperCase()} is not supported by this trainer`, lineNo)
  if (!MNEMONICS.has(mnemonic) && !DIRECTIVES.has(mnemonic)) {
    throw new AsmError(`Unknown instruction "${sp[1]}"`, lineNo)
  }
  if (label && mnemonic === 'equ') return { label, mnemonic, operands: [args.trim()], lineNo }
  return { label, mnemonic, operands: splitOperands(args), lineNo }
}

// ---------- operand classification ----------

function classify(op) {
  const l = op.trim().toLowerCase()
  if (l in REG8) return { kind: 'r8', n: REG8[l], name: l }
  if (l === '(hl)') return { kind: 'r8', n: 6, name: '(hl)' }
  if (l === 'af' || l === "af'") return { kind: 'af' }
  if (l in REG16) return { kind: 'r16', n: REG16[l], name: l }
  if (l === '(bc)' || l === '(de)') return { kind: 'ind', name: l }
  if (l === '(sp)') return { kind: 'ind', name: l }
  if (l === '(c)') return { kind: 'portc' }
  if (l in COND) return { kind: 'cond', n: COND[l], name: l }
  if (l.startsWith('(') && wrapsWhole(op.trim())) return { kind: 'mem', expr: op.trim().slice(1, -1) }
  return { kind: 'imm', expr: op.trim() }
}

function wrapsWhole(s) {
  if (!s.endsWith(')')) return false
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')' && --depth === 0 && i < s.length - 1) return false
  }
  return depth === 0
}

// ---------- encoder ----------

function encode(ins, ctx) {
  const { mnemonic: mn, operands, lineNo } = ins
  const fail = (msg) => { throw new AsmError(msg, lineNo) }
  // "C" is the carry condition (not register C) in jumps, calls and returns
  const condC = ['jp', 'jr', 'call', 'ret'].includes(mn)
  const ops = operands.map((o, i) =>
    condC && i === 0 && o.trim().toLowerCase() === 'c' ? { kind: 'cond', n: COND.c, name: 'c' } : classify(o))
  const val = (expr) => ctx.eval(expr)
  const n8 = (expr) => {
    const v = val(expr)
    if (v === undefined) return 0
    if (v < -128 || v > 255) fail(`Value ${v} does not fit in 8 bits`)
    return v & 0xff
  }
  const n16 = (expr) => {
    const v = val(expr)
    if (v === undefined) return [0, 0]
    if (v < -32768 || v > 65535) fail(`Value ${v} does not fit in 16 bits`)
    return [v & 0xff, (v >> 8) & 0xff]
  }
  const rel = (expr) => {
    const target = val(expr)
    if (target === undefined) return 0
    const d = target - (ctx.pc + 2)
    if (d < -128 || d > 127) fail(`Jump target out of range for relative jump (${d})`)
    return d & 0xff
  }
  const need = (count) => {
    if (ops.length !== count) fail(`"${mn.toUpperCase()}" needs ${count} operand${count === 1 ? '' : 's'}`)
  }
  const bad = () => fail(`Invalid operands for ${mn.toUpperCase()}`)

  if (mn in SIMPLE) {
    if (mn === 'ret' && ops.length === 1) {
      if (ops[0].kind !== 'cond') bad()
      return [0xc0 | (ops[0].n << 3)]
    }
    need(0)
    return [...SIMPLE[mn]]
  }

  if (mn in ALU_OPS) {
    // allow "ADD A,x" and the short form "SUB x"
    let [dst, src] = ops
    if (ops.length === 1) { src = dst; dst = null }
    else if (ops.length !== 2) need(2)
    if (mn === 'add' && dst?.kind === 'r16' && dst.name === 'hl') {
      if (src.kind !== 'r16') bad()
      return [0x09 | (src.n << 4)]
    }
    if (dst && !(dst.kind === 'r8' && dst.n === 7)) bad()
    if (src.kind === 'r8') return [0x80 | (ALU_OPS[mn] << 3) | src.n]
    if (src.kind === 'imm') return [0xc6 | (ALU_OPS[mn] << 3), n8(src.expr)]
    bad()
  }

  if (mn in SHIFT_OPS) {
    need(1)
    if (ops[0].kind !== 'r8') bad()
    return [0xcb, (SHIFT_OPS[mn] << 3) | ops[0].n]
  }

  if (mn in BIT_OPS) {
    need(2)
    if (ops[0].kind !== 'imm' || ops[1].kind !== 'r8') bad()
    const b = val(ops[0].expr)
    if (b === undefined && !ctx.final) return [0xcb, (BIT_OPS[mn] << 6) | ops[1].n]
    if (b === undefined || b < 0 || b > 7) fail('Bit number must be 0-7')
    return [0xcb, (BIT_OPS[mn] << 6) | (b << 3) | ops[1].n]
  }

  switch (mn) {
    case 'ld': return encodeLd(ops, { need, bad, n8, n16, val, fail })
    case 'inc':
    case 'dec': {
      need(1)
      const o = ops[0]
      const dec = mn === 'dec'
      if (o.kind === 'r8') return [0x04 | (o.n << 3) | (dec ? 1 : 0)]
      if (o.kind === 'r16') return [0x03 | (o.n << 4) | (dec ? 8 : 0)]
      bad()
      break
    }
    case 'jp': {
      if (ops.length === 1) {
        if (ops[0].kind === 'r8' && ops[0].n === 6) return [0xe9]
        if (ops[0].kind === 'r16' && ops[0].name === 'hl') return [0xe9]
        if (ops[0].kind === 'imm') return [0xc3, ...n16(ops[0].expr)]
        bad()
      }
      need(2)
      if (ops[0].kind !== 'cond' || ops[1].kind !== 'imm') bad()
      return [0xc2 | (ops[0].n << 3), ...n16(ops[1].expr)]
    }
    case 'jr': {
      if (ops.length === 1) {
        if (ops[0].kind !== 'imm') bad()
        return [0x18, rel(ops[0].expr)]
      }
      need(2)
      if (ops[0].kind !== 'cond' || ops[0].n > 3 || ops[1].kind !== 'imm') {
        fail('JR only supports conditions NZ, Z, NC and C')
      }
      return [0x20 | (ops[0].n << 3), rel(ops[1].expr)]
    }
    case 'djnz':
      need(1)
      if (ops[0].kind !== 'imm') bad()
      return [0x10, rel(ops[0].expr)]
    case 'call': {
      if (ops.length === 1) {
        if (ops[0].kind !== 'imm') bad()
        return [0xcd, ...n16(ops[0].expr)]
      }
      need(2)
      if (ops[0].kind !== 'cond' || ops[1].kind !== 'imm') bad()
      return [0xc4 | (ops[0].n << 3), ...n16(ops[1].expr)]
    }
    case 'push':
    case 'pop': {
      need(1)
      const o = ops[0]
      let code
      if (o.kind === 'af') code = 3
      else if (o.kind === 'r16' && o.name !== 'sp') code = o.n
      else bad()
      return [(mn === 'push' ? 0xc5 : 0xc1) | (code << 4)]
    }
    case 'rst': {
      need(1)
      const v = val(ops[0].expr ?? '')
      if (v === undefined && !ctx.final) return [0xc7]
      if (v === undefined || v < 0 || v > 0x38 || v % 8) fail('RST target must be 0, 8, 16 ... 56')
      return [0xc7 | v]
    }
    case 'out': {
      need(2)
      if (ops[0].kind === 'mem' && ops[1].kind === 'r8' && ops[1].n === 7) return [0xd3, n8(ops[0].expr)]
      return bad()
    }
    case 'in': {
      need(2)
      if (ops[0].kind === 'r8' && ops[0].n === 7 && ops[1].kind === 'mem') return [0xdb, n8(ops[1].expr)]
      return bad()
    }
    case 'ex': {
      need(2)
      if (ops[0].kind === 'r16' && ops[0].name === 'de' && ops[1].kind === 'r16' && ops[1].name === 'hl') return [0xeb]
      return fail('Only EX DE,HL is supported')
    }
    default:
      return fail(`Cannot encode "${mn}"`)
  }
  return fail(`Cannot encode "${mn}"`)
}

function encodeLd(ops, { need, bad, n8, n16, fail }) {
  need(2)
  const [d, s] = ops
  // LD r,r'
  if (d.kind === 'r8' && s.kind === 'r8') {
    if (d.n === 6 && s.n === 6) fail('LD (HL),(HL) is not a valid instruction')
    return [0x40 | (d.n << 3) | s.n]
  }
  // LD r,n
  if (d.kind === 'r8' && s.kind === 'imm') return [0x06 | (d.n << 3), n8(s.expr)]
  // LD rr,nn
  if (d.kind === 'r16' && s.kind === 'imm') return [0x01 | (d.n << 4), ...n16(s.expr)]
  if (d.kind === 'r16' && d.name === 'sp' && s.kind === 'r16' && s.name === 'hl') return [0xf9]
  // accumulator indirect
  if (d.kind === 'r8' && d.n === 7 && s.kind === 'ind') {
    if (s.name === '(bc)') return [0x0a]
    if (s.name === '(de)') return [0x1a]
  }
  if (s.kind === 'r8' && s.n === 7 && d.kind === 'ind') {
    if (d.name === '(bc)') return [0x02]
    if (d.name === '(de)') return [0x12]
  }
  // direct memory
  if (d.kind === 'r8' && d.n === 7 && s.kind === 'mem') return [0x3a, ...n16(s.expr)]
  if (d.kind === 'mem' && s.kind === 'r8' && s.n === 7) return [0x32, ...n16(d.expr)]
  if (d.kind === 'r16' && d.name === 'hl' && s.kind === 'mem') return [0x2a, ...n16(s.expr)]
  if (d.kind === 'mem' && s.kind === 'r16' && s.name === 'hl') return [0x22, ...n16(d.expr)]
  return bad()
}

// ---------- main entry ----------

// Assemble source text. Returns { segments: [{addr, bytes}], entry, symbols, size }.
export function assemble(source) {
  const lines = source.split(/\r?\n/)
  const parsed = []
  const symbols = new Map()
  let pc = DEFAULT_ORIGIN
  let entry = null
  let endExpr = null
  const pendingEqu = []

  const sizeOf = (ins) => {
    switch (ins.mnemonic) {
      case 'db': case 'defb': {
        let n = 0
        for (const o of ins.operands) n += /^"/.test(o) ? stringBytes(o, ins.lineNo).length : 1
        return n
      }
      case 'dw': case 'defw': return ins.operands.length * 2
      default: return null
    }
  }

  // Evaluate during pass 1, where the value is needed at once (ORG, DS). An EQU that
  // depends on a later definition is still unresolved here, so say that, not "unknown".
  const evalNow = (expr, here, lineNo) => {
    try {
      return evaluate(expr, symbols, here, lineNo)
    } catch (err) {
      const name = /^.*Unknown symbol "(.+)"$/.exec(err.message)?.[1]
      if (name && pendingEqu.some((e) => e.label === name)) {
        throw new AsmError(`"${name}" is an EQU that depends on a later definition, so it cannot be used here; define it after the symbols it uses`, lineNo)
      }
      throw err
    }
  }

  // pass 1: parse, assign addresses, collect labels
  lines.forEach((raw, idx) => {
    const lineNo = idx + 1
    const ins = parseLine(raw, lineNo)
    if (!ins) return
    if (ins.label) {
      if (RESERVED_LABELS.has(ins.label)) {
        throw new AsmError(`"${ins.label.toUpperCase()}" is a register or condition name and cannot be used as a label`, lineNo)
      }
      if (symbols.has(ins.label) || pendingEqu.some((e) => e.label === ins.label)) {
        throw new AsmError(`Label "${ins.label}" is defined twice`, lineNo)
      }
    }
    if (ins.mnemonic === 'equ') {
      if (!ins.label) throw new AsmError('EQU needs a label', lineNo)
      // resolve now when possible so later ORG/DS/BIT can use it; else wait for forward references
      const known = evaluate(ins.operands[0] ?? '', symbols, pc, lineNo, true)
      if (known === undefined) pendingEqu.push({ label: ins.label, expr: ins.operands[0], lineNo })
      else symbols.set(ins.label, known)
      return
    }
    if (ins.label) symbols.set(ins.label, pc)
    if (!ins.mnemonic) return
    ins.pc = pc
    if (ins.mnemonic === 'org') {
      const v = evalNow(ins.operands[0] ?? '', pc, lineNo)
      if (!Number.isInteger(v) || v < 0 || v >= MAX_ADDRESS) throw new AsmError(`ORG address ${v} is outside memory (0-65535)`, lineNo)
      pc = v
      ins.pc = pc
      if (ins.label) symbols.set(ins.label, pc)
    } else if (ins.mnemonic === 'end') {
      endExpr = ins.operands[0] || null
      parsed.push(ins)
      return
    } else if (['ds', 'defs'].includes(ins.mnemonic)) {
      const v = evalNow(ins.operands[0] ?? '', pc, lineNo)
      if (!Number.isInteger(v) || v < 0 || v > MAX_ADDRESS) throw new AsmError(`DS size ${v} is not between 0 and 65536`, lineNo)
      ins.count = v
      pc += v
    } else if (sizeOf(ins) !== null) {
      pc += sizeOf(ins)
    } else {
      // instruction: encode with unknown symbols to measure its size
      const bytes = encode(ins, { pc, final: false, eval: (e) => evaluate(e, symbols, pc, lineNo, true) })
      ins.size = bytes.length
      pc += bytes.length
    }
    if (pc > MAX_ADDRESS) throw new AsmError('Program runs past the end of memory (address 65535)', lineNo)
    parsed.push(ins)
  })

  // resolve EQUs (may reference labels defined later)
  let remaining = pendingEqu
  while (remaining.length) {
    const next = []
    for (const e of remaining) {
      const v = evaluate(e.expr, symbols, 0, e.lineNo, true)
      if (v === undefined) next.push(e)
      else symbols.set(e.label, v)
    }
    if (next.length === remaining.length) {
      throw new AsmError(`Cannot resolve "${next[0].label}"`, next[0].lineNo)
    }
    remaining = next
  }

  // pass 2: emit bytes
  const segments = []
  let current = null
  let firstByte = null
  const used = new Uint8Array(MAX_ADDRESS)
  const emit = (addr, bytes, lineNo) => {
    if (!bytes.length) return
    for (let i = 0; i < bytes.length; i++) {
      if (used[addr + i]) {
        throw new AsmError(`Bytes at address 0x${(addr + i).toString(16).toUpperCase()} overlap earlier code or data (check your ORG)`, lineNo)
      }
      used[addr + i] = 1
    }
    if (!current || current.addr + current.bytes.length !== addr) {
      current = { addr, bytes: [] }
      segments.push(current)
    }
    for (const b of bytes) current.bytes.push(b) // not push(...bytes): huge DS blocks overflow the argument limit in some engines
    if (firstByte === null) firstByte = addr
  }

  for (const ins of parsed) {
    const { mnemonic: mn, lineNo, pc: at } = ins
    const ev = (e) => evaluate(e, symbols, at, lineNo)
    if (mn === 'org' || mn === 'end') continue
    if (mn === 'db' || mn === 'defb') {
      const bytes = []
      for (const o of ins.operands) {
        if (/^"/.test(o)) bytes.push(...stringBytes(o, lineNo))
        else {
          const v = ev(o)
          if (v < -128 || v > 255) throw new AsmError(`Value ${v} does not fit in a byte`, lineNo)
          bytes.push(v & 0xff)
        }
      }
      emit(at, bytes, lineNo)
    } else if (mn === 'dw' || mn === 'defw') {
      const bytes = []
      for (const o of ins.operands) {
        const v = ev(o)
        if (v < -32768 || v > 65535) throw new AsmError(`Value ${v} does not fit in a word`, lineNo)
        bytes.push(v & 0xff, (v >> 8) & 0xff)
      }
      emit(at, bytes, lineNo)
    } else if (mn === 'ds' || mn === 'defs') {
      const fill = ins.operands[1] !== undefined ? ev(ins.operands[1]) & 0xff : 0
      emit(at, new Array(ins.count).fill(fill), lineNo)
    } else {
      const bytes = encode(ins, { pc: at, final: true, eval: ev })
      if (entry === null) entry = at // the program starts at its first instruction, not at leading data
      emit(at, bytes, lineNo)
    }
  }

  if (endExpr) entry = evaluate(endExpr, symbols, 0, 0) & 0xffff
  if (entry === null) entry = firstByte // data-only program: start at the first byte
  if (entry === null) throw new AsmError('Program is empty')
  const size = segments.reduce((n, s) => n + s.bytes.length, 0)
  return { segments, entry, symbols, size }
}

function stringBytes(op, lineNo) {
  if (!/^"(?:[^"\\]|\\.)*"$/.test(op)) throw new AsmError(`Bad string ${op}`, lineNo)
  const out = []
  const body = op.slice(1, -1)
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\\') { out.push(unescape(body.slice(i, i + 2)).charCodeAt(0)); i++ }
    else out.push(body.charCodeAt(i))
  }
  return out
}
