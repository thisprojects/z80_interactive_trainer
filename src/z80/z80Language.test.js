import { describe, it, expect } from 'vitest'
import { z80Parser, z80Language } from './z80Language.js'

// Minimal stand-in for CodeMirror's StringStream.
function tokenize(line) {
  let pos = 0
  let start = 0
  const stream = {
    eatSpace() {
      const s = pos
      while (pos < line.length && /\s/.test(line[pos])) pos++
      return pos > s
    },
    match(p) {
      if (typeof p === 'string') {
        if (!line.startsWith(p, pos)) return null
        pos += p.length
        return true
      }
      const m = p.exec(line.slice(pos))
      if (!m) return null
      pos += m[0].length
      return m
    },
    skipToEnd() { pos = line.length },
    next() { return line[pos++] },
    peek() { return line[pos] },
    current() { return line.slice(start, pos) },
  }
  const out = []
  while (pos < line.length) {
    start = pos
    const type = z80Parser.token(stream, {})
    if (stream.current().trim() !== '') out.push([stream.current(), type])
  }
  return out
}

describe('z80 language', () => {
  it('is a defined language', () => {
    expect(z80Language).toBeDefined()
    expect(z80Parser.startState()).toEqual({})
  })
  it('classifies tokens', () => {
    expect(tokenize('loop: LD A,0x1F ; hi')).toEqual([
      ['loop:', 'labelName'], ['LD', 'keyword'], ['A', 'atom'], [',', null], ['0x1F', 'number'], ['; hi', 'comment'],
    ])
    expect(tokenize('ORG 0x8000')[0]).toEqual(['ORG', 'meta'])
    expect(tokenize('JR NZ,top')).toEqual([['JR', 'keyword'], ['NZ', 'atom'], [',', null], ['top', 'variableName']])
    expect(tokenize('DB "hi",\'x\'').map((t) => t[1])).toEqual(['meta', 'string', null, 'string'])
    expect(tokenize("EX AF,AF' ; swap")).toEqual([['EX', 'keyword'], ['AF', 'atom'], [',', null], ["AF'", 'atom'], ['; swap', 'comment']])
    expect(tokenize('CPIR')[0]).toEqual(['CPIR', 'keyword'])
    expect(tokenize('LD A,(HL)').map((t) => t[1])).toEqual(['keyword', 'atom', null, null, 'atom', null])
  })
})
