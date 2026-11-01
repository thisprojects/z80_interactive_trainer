import { StreamLanguage } from '@codemirror/language'

const MNEMONICS = new Set((
  'ld push pop ex exx ldi ldir ldd lddr add adc sub sbc and or xor cp inc dec daa cpl neg ccf scf nop halt di ei ' +
  'rlca rla rrca rra rlc rl rrc rr sla sra srl sll bit set res jp jr djnz call ret reti rst in out'
).split(' '))
const DIRECTIVES = new Set('org equ db defb dw defw ds defs end include'.split(' '))
const REGISTERS = new Set("a b c d e h l af bc de hl sp ix iy i r af'".split(' '))
const CONDITIONS = new Set('nz z nc po pe p m'.split(' '))

// Tokeniser for the CodeMirror stream language.
export const z80Parser = {
  name: 'z80',
  startState: () => ({}),
  token(stream) {
    if (stream.eatSpace()) return null
    if (stream.match(';')) {
      stream.skipToEnd()
      return 'comment'
    }
    if (stream.match(/^"(?:[^"\\]|\\.)*"?/) || stream.match(/^'(?:[^'\\]|\\.)'?/)) return 'string'
    if (stream.match(/^(?:0x[0-9a-f]+|\$[0-9a-f]+|[0-9][0-9a-f]*h\b|0b[01]+|%[01]+|[0-9]+)/i)) return 'number'
    if (stream.match(/^[A-Za-z_.][\w.]*:?/)) {
      const word = stream.current().toLowerCase()
      if (word.endsWith(':')) return 'labelName'
      if (MNEMONICS.has(word)) return 'keyword'
      if (DIRECTIVES.has(word)) return 'meta'
      if (REGISTERS.has(word)) return 'atom'
      if (CONDITIONS.has(word)) return 'atom'
      return 'variableName'
    }
    stream.next()
    return null
  },
}

export const z80Language = StreamLanguage.define(z80Parser)
