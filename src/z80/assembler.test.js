import { describe, it, expect } from 'vitest'
import { assemble, evaluate, AsmError } from './assembler.js'

const bytes = (src) => assemble(`ORG 0x8000\n${src}`).segments.flatMap((s) => s.bytes)
const err = (src) => {
  try { assemble(src) } catch (e) { return e }
  return null
}

describe('evaluate', () => {
  const syms = new Map([['x', 10]])
  it('handles numbers in all bases', () => {
    expect(evaluate('0x1F', syms, 0)).toBe(31)
    expect(evaluate('$1f', syms, 0)).toBe(31)
    expect(evaluate('1Fh', syms, 0)).toBe(31)
    expect(evaluate('0b101', syms, 0)).toBe(5)
    expect(evaluate('%101', syms, 0)).toBe(5)
    expect(evaluate('42', syms, 0)).toBe(42)
  })
  it('handles characters and escapes', () => {
    expect(evaluate("'A'", syms, 0)).toBe(65)
    expect(evaluate('"B"', syms, 0)).toBe(66)
    expect(evaluate("'\\n'", syms, 0)).toBe(10)
    expect(evaluate("'\\q'", syms, 0)).toBe('q'.charCodeAt(0))
  })
  it('handles operators and precedence', () => {
    expect(evaluate('1+2*3', syms, 0)).toBe(7)
    expect(evaluate('(1+2)*3', syms, 0)).toBe(9)
    expect(evaluate('7/2', syms, 0)).toBe(3)
    expect(evaluate('1<<4', syms, 0)).toBe(16)
    expect(evaluate('256>>4', syms, 0)).toBe(16)
    expect(evaluate('6&3', syms, 0)).toBe(2)
    expect(evaluate('6|1', syms, 0)).toBe(7)
    expect(evaluate('6^3', syms, 0)).toBe(5)
    expect(evaluate('~0&255', syms, 0)).toBe(255)
    expect(evaluate('-x', syms, 0)).toBe(-10)
    expect(evaluate('+x', syms, 0)).toBe(10)
  })
  it('handles $ and symbols', () => {
    expect(evaluate('$+2', syms, 100)).toBe(102)
    expect(evaluate('x+1', syms, 0)).toBe(11)
  })
  it('reports undefined symbols', () => {
    expect(() => evaluate('nope', syms, 0, 3)).toThrow(/Line 3: Unknown symbol/)
    expect(evaluate('nope', syms, 0, 3, true)).toBeUndefined()
  })
  it('rejects malformed expressions', () => {
    expect(() => evaluate('', syms, 0)).toThrow(/Missing expression/)
    expect(() => evaluate('1+', syms, 0)).toThrow(/Unexpected end/)
    expect(() => evaluate('(1', syms, 0)).toThrow(/Missing/)
    expect(() => evaluate('1 2', syms, 0)).toThrow(/Unexpected/)
    expect(() => evaluate('*', syms, 0)).toThrow(/Unexpected/)
    expect(() => evaluate('1 $', syms, 0)).toThrow(/Unexpected/)
    expect(() => evaluate('#', syms, 0)).toThrow(/Cannot parse/)
  })
})

describe('instruction encoding', () => {
  const cases = {
    'NOP': [0x00], 'HALT': [0x76], 'RLCA': [0x07], 'RRCA': [0x0f], 'RLA': [0x17], 'RRA': [0x1f],
    'CPL': [0x2f], 'SCF': [0x37], 'CCF': [0x3f], 'NEG': [0xed, 0x44], 'LDIR': [0xed, 0xb0],
    'LDDR': [0xed, 0xb8], 'RET': [0xc9], 'RET NZ': [0xc0], 'RET C': [0xd8],
    'LD A,B': [0x78], 'LD (HL),C': [0x71], 'LD A,(HL)': [0x7e],
    'LD A,5': [0x3e, 5], 'LD (HL),9': [0x36, 9], 'LD B,-1': [0x06, 0xff],
    'LD BC,0x1234': [0x01, 0x34, 0x12], 'LD SP,0xF000': [0x31, 0x00, 0xf0], 'LD SP,HL': [0xf9],
    'LD A,(BC)': [0x0a], 'LD A,(DE)': [0x1a], 'LD (BC),A': [0x02], 'LD (DE),A': [0x12],
    'LD A,(0x9000)': [0x3a, 0x00, 0x90], 'LD (0x9000),A': [0x32, 0x00, 0x90],
    'LD HL,(0x9000)': [0x2a, 0x00, 0x90], 'LD (0x9000),HL': [0x22, 0x00, 0x90],
    'INC B': [0x04], 'DEC C': [0x0d], 'INC (HL)': [0x34], 'INC HL': [0x23], 'DEC DE': [0x1b],
    'ADD A,B': [0x80], 'ADC A,C': [0x89], 'SUB B': [0x90], 'SBC A,D': [0x9a],
    'AND 3': [0xe6, 3], 'XOR A': [0xaf], 'OR (HL)': [0xb6], 'CP 10': [0xfe, 10], 'ADD A,5': [0xc6, 5],
    'ADD HL,DE': [0x19],
    'RLC B': [0xcb, 0x00], 'SRL A': [0xcb, 0x3f], 'SLA (HL)': [0xcb, 0x26],
    'BIT 7,A': [0xcb, 0x7f], 'RES 0,B': [0xcb, 0x80], 'SET 3,(HL)': [0xcb, 0xde],
    'JP 0x8000': [0xc3, 0x00, 0x80], 'JP NZ,0x8000': [0xc2, 0x00, 0x80], 'JP C,0x8000': [0xda, 0x00, 0x80],
    'JP (HL)': [0xe9], 'JP HL': [0xe9],
    'CALL 0x8000': [0xcd, 0x00, 0x80], 'CALL Z,0x8000': [0xcc, 0x00, 0x80],
    'PUSH BC': [0xc5], 'PUSH AF': [0xf5], 'POP HL': [0xe1], 'POP AF': [0xf1],
    'RST 16': [0xd7], 'OUT (0),A': [0xd3, 0], 'IN A,(0xFE)': [0xdb, 0xfe], 'EX DE,HL': [0xeb],
  }
  it.each(Object.entries(cases))('%s', (src, expected) => {
    expect(bytes(src)).toEqual(expected)
  })

  it('encodes relative jumps', () => {
    expect(bytes('top: NOP\n JR top')).toEqual([0x00, 0x18, 0xfd])
    expect(bytes('top: NOP\n JR NZ,top')).toEqual([0x00, 0x20, 0xfd])
    expect(bytes('top: NOP\n JR C,top')).toEqual([0x00, 0x38, 0xfd])
    expect(bytes('top: NOP\n DJNZ top')).toEqual([0x00, 0x10, 0xfd])
    expect(bytes('JR fwd\n NOP\nfwd: NOP')).toEqual([0x18, 0x01, 0x00, 0x00])
  })
})

describe('directives and structure', () => {
  it('handles DB, DW, DS', () => {
    expect(bytes('DB 1,2,"Hi",0')).toEqual([1, 2, 72, 105, 0])
    expect(bytes('DB "a\\n"')).toEqual([97, 10])
    expect(bytes("DB 'x'")).toEqual([120])
    expect(bytes('DW 0x1234,2')).toEqual([0x34, 0x12, 2, 0])
    expect(bytes('DS 3')).toEqual([0, 0, 0])
    expect(bytes('DS 2,7')).toEqual([7, 7])
    expect(bytes('DEFB 5\nDEFW 1\nDEFS 1')).toEqual([5, 1, 0, 0])
  })
  it('handles labels with and without colons, EQU, $ and comments', () => {
    const r = assemble('ORG 0x9000\nSIZE EQU 4\nstart: LD A,SIZE ; comment\nnext\n  LD B,$-start\nend_lbl: DB ";"\n')
    expect(r.segments[0].addr).toBe(0x9000)
    expect(r.symbols.get('next')).toBe(0x9002)
    expect(r.symbols.get('size')).toBe(4)
    expect(r.segments[0].bytes.slice(0, 4)).toEqual([0x3e, 4, 0x06, 2])
    expect(r.segments[0].bytes[4]).toBe(59)
  })
  it('allows column-0 mnemonics', () => {
    expect(bytes('NOP')).toEqual([0])
  })
  it('allows forward EQU references', () => {
    const r = assemble('ORG 0x8000\nlen EQU end_ - msg\nmsg: DB "abc"\nend_: LD A,len\n')
    expect(r.segments[0].bytes.slice(-2)).toEqual([0x3e, 3])
  })
  it('uses ORG to start new segments and END to set entry', () => {
    const r = assemble('ORG 0x8000\n NOP\n ORG 0x9000\nstart: HALT\n END start\n')
    expect(r.segments.map((s) => s.addr)).toEqual([0x8000, 0x9000])
    expect(r.entry).toBe(0x9000)
    expect(r.size).toBe(2)
  })
  it('defaults the entry to the first emitted byte', () => {
    expect(assemble('NOP').entry).toBe(0x8000)
  })
  it('lets EQU constants be used by DS, ORG, BIT and RST', () => {
    expect(assemble('SIZE EQU 3\n DS SIZE\n').size).toBe(3)
    expect(assemble('BASE EQU 0x9000\n ORG BASE\n NOP\n').segments[0].addr).toBe(0x9000)
    expect(bytes('FLAG EQU 3\n BIT FLAG,A')).toEqual([0xcb, 0x5f])
    expect(bytes('V EQU 8\n RST V')).toEqual([0xcf])
  })
  it('lets BIT and RST use constants defined later', () => {
    expect(bytes('BIT flag,A\nRST vec\nflag EQU 2\nvec EQU 16')).toEqual([0xcb, 0x57, 0xd7])
  })
  it('rejects absurd DS sizes and ORG addresses', () => {
    expect(() => assemble('DS 4000000000')).toThrow(/DS size/)
    expect(() => assemble('DS -1')).toThrow(/DS size/)
    expect(() => assemble('ORG 0x10000\nNOP')).toThrow(/ORG address/)
    expect(() => assemble('ORG -1\nNOP')).toThrow(/ORG address/)
  })
  it('rejects programs that run past the end of memory', () => {
    expect(() => assemble('ORG 0xFFFE\nLD HL,1')).toThrow(/past the end of memory/)
    expect(assemble('ORG 0xFFFE\nLD A,1').size).toBe(2)
  })
  it('range-checks DW values', () => {
    expect(() => assemble('DW 70000')).toThrow(/does not fit in a word/)
    expect(bytes('DW -1, 65535')).toEqual([0xff, 0xff, 0xff, 0xff])
  })
  it('checks DW at both edges', () => {
    expect(() => assemble('DW 65536')).toThrow(/does not fit in a word/)
    expect(() => assemble('DW -32769')).toThrow(/does not fit in a word/)
    expect(bytes('DW 65535, -32768')).toEqual([0xff, 0xff, 0x00, 0x80])
  })
  it('refuses register and condition names as labels', () => {
    for (const name of ['l', 'd', 'c', 'z', 'hl', 'af']) {
      expect(() => assemble(`${name}: NOP`)).toThrow(/cannot be used as a label/)
    }
  })
  it('starts at the first instruction, not at leading data', () => {
    const r = assemble('ORG 0x8000\nmsg: DB 1,2\nstart: LD A,1\nHALT')
    expect(r.entry).toBe(0x8002)
    expect(assemble('DB 7').entry).toBe(0x8000)
  })
  it('rejects overlapping ORG blocks', () => {
    expect(() => assemble('ORG 0x8000\nDB 1,2,3\nORG 0x8001\nDB 9')).toThrow(/0x8001 overlap/)
    expect(() => assemble('ORG 0x8000\nDS 4\nORG 0x8003\nNOP')).toThrow(/overlap/)
    expect(assemble('ORG 0x8000\nDB 1\nORG 0x8001\nDB 2').segments).toHaveLength(1)
  })
  it('explains EQUs that depend on later definitions when used by DS or ORG', () => {
    expect(() => assemble('a1 EQU b1+1\nb1 EQU 4\nDS a1')).toThrow(/"a1" is an EQU that depends on a later definition/)
    expect(() => assemble('DS nowhere')).toThrow(/Unknown symbol "nowhere"/)
    expect(assemble('b1 EQU 4\na1 EQU b1+1\nDS a1').size).toBe(5)
  })
  it('reports division by zero and bad shift counts', () => {
    expect(() => assemble('LD A,1/0')).toThrow(/Division by zero/)
    expect(() => assemble('LD A,1<<40')).toThrow(/Shift count 40/)
    expect(() => assemble('LD A,1>>-1')).toThrow(/Shift count -1/)
    expect(bytes('LD A,1<<3')).toEqual([0x3e, 8])
  })
  it('handles a full 64K DS block', () => {
    expect(assemble('ORG 0\nDS 65536').size).toBe(65536)
  })
  it('rejects unsupported instructions whether or not they are indented', () => {
    for (const name of ['ldi', 'ldd', 'cpir', 'di', 'ei', 'reti', 'retn', 'daa', 'exx', 'rld']) {
      expect(() => assemble(`${name}\nHALT`)).toThrow(new RegExp(`${name.toUpperCase()} is not supported`, 'i'))
      expect(() => assemble(`  ${name}\nHALT`)).toThrow(/is not supported by this trainer/)
    }
    expect(() => assemble('  IM 1')).toThrow(/IM is not supported/)
    expect(assemble('ldi: NOP').segments[0].bytes).toEqual([0]) // a label with a colon is still just a label
  })
  it('still allows a label that shares its name with an unsupported instruction', () => {
    expect(assemble('ind EQU 5\n LD A,ind').segments[0].bytes).toEqual([0x3e, 5])
    expect(assemble('ldi DB 7\n HALT').segments[0].bytes).toEqual([7, 0x76])
    expect(assemble('ini NOP\n HALT').segments[0].bytes).toEqual([0, 0x76])
    expect(assemble('cpi DS 2\n HALT').size).toBe(3)
    expect(() => assemble('ind')).toThrow(/IND is not supported/)
    expect(() => assemble('ldi 5')).toThrow(/LDI is not supported/)
  })
  it('is case-insensitive', () => {
    expect(bytes('ld A,b')).toEqual([0x78])
  })
  it('tolerates Windows line endings', () => {
    expect(bytes('NOP\r\nHALT\r\n')).toEqual([0, 0x76])
  })
})

describe('errors', () => {
  it.each([
    ['', /empty/],
    ['FOO 1', /Line 1: Unknown instruction/],
    ['x: NOP\nx: NOP', /Line 2: Label "x" is defined twice/],
    ['EQU 5', /EQU needs a label/],
    ['x EQU y\ny EQU x', /Cannot resolve/],
    ['LD A,300', /does not fit in 8 bits/],
    ['LD HL,70000', /does not fit in 16 bits/],
    ['DB 300', /does not fit in a byte/],
    ['DB "abc', /Bad string|Cannot parse/],
    ['LD A', /needs 2 operands/],
    ['NOP 1', /needs 0 operands/],
    ['INC (HL),A', /needs 1 operand/],
    ['LD (HL),(HL)', /not a valid instruction/],
    ['LD 5,A', /Invalid operands for LD/],
    ['INC 5', /Invalid operands/],
    ['ADD B,C', /Invalid operands/],
    ['ADD HL,5', /Invalid operands/],
    ['ADD A,(5)', /Invalid operands/],
    ['RLC 5', /Invalid operands/],
    ['BIT 8,A', /Bit number/],
    ['BIT A,A', /Invalid operands/],
    ['JP A', /Invalid operands/],
    ['JP 1,2', /Invalid operands/],
    ['JR PO,0', /JR only supports/],
    ['JR (HL)', /Invalid operands/],
    ['DJNZ HL', /Invalid operands/],
    ['CALL A', /Invalid operands/],
    ['CALL 1,2', /Invalid operands/],
    ['PUSH SP', /Invalid operands/],
    ['RET 5', /Invalid operands/],
    ['RST 5', /RST target/],
    ['OUT (0),B', /Invalid operands/],
    ['IN B,(0)', /Invalid operands/],
    ['EX AF,AF\'', /Only EX DE,HL/],
    ['top: NOP\n DS 200\n JR top', /out of range/],
    ['JR nowhere', /Unknown symbol/],
    ['DS nowhere', /Unknown symbol/],
  ])('%j', (src, pattern) => {
    const e = err(src)
    expect(e).toBeInstanceOf(AsmError)
    expect(e.message).toMatch(pattern)
  })
})
