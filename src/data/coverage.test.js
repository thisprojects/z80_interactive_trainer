import { describe, it, expect } from 'vitest'
import lessons from './lessons.js'
import challenges from './challenges.js'
import solutions from './solutions.js'
import { MNEMONICS } from '../z80/assembler.js'

// A learner can only be asked to use an instruction a lesson has already shown. This reads the
// instruction "forms" out of every lesson's worked examples and text, and checks that each
// lesson's task and each challenge only needs forms taught by then. A form is a mnemonic
// (LD, ADD ...) plus, where the operands change what it is, a tag for them: ADD IX is not ADD A,
// and LD A,(IX+d) is not LD A,(HL).

const DIRECTIVES = new Set(['ORG', 'DB', 'DW', 'DS', 'EQU', 'END', 'DEFB', 'DEFW', 'DEFS'])
const word = (s) => /^[A-Za-z]{2,4}$/.test(s)

function formsFor(mnemonic, operands) {
  const forms = [mnemonic]
  const ops = operands.toUpperCase()
  if (/\(\s*(IX|IY)/.test(ops)) forms.push(`${mnemonic} (IX)`)
  else if (/\b(IX|IY)\b/.test(ops)) forms.push(`${mnemonic} IX`)
  if ((mnemonic === 'ADC' || mnemonic === 'SBC') && /^HL\b/.test(ops)) forms.push(`${mnemonic} HL`)
  if (mnemonic === 'EX' && ops.includes("AF'")) forms.push("EX AF'")
  if (mnemonic === 'EX' && ops.includes('(SP)')) forms.push('EX (SP)')
  if (mnemonic === 'OUT' && /^\(C\)/.test(ops)) forms.push('OUT (C)')
  return forms
}

function formsOfCode(code) {
  const found = new Set()
  for (const raw of code.split('\n')) {
    let line = raw.replace(/;.*$/, '').trim()
    if (!line) continue
    line = line.replace(/^[A-Za-z_.][\w.]*:\s*/, '')
    const tokens = line.split(/\s+/).filter(Boolean)
    if (!tokens.length) continue
    // a label written without a colon, such as `WIDTH EQU 4` or `loop LD A,1`
    if (!MNEMONICS.has(tokens[0].toLowerCase()) && !DIRECTIVES.has(tokens[0].toUpperCase())) tokens.shift()
    const first = tokens[0]?.toUpperCase()
    if (!first || !word(first) || DIRECTIVES.has(first)) continue
    formsFor(first, tokens.slice(1).join(' ')).forEach((f) => found.add(f))
  }
  return found
}

// instruction names written in `backticks`, and the forms they show
function formsOfText(text) {
  const found = new Set()
  for (const span of text.match(/`[^`]+`/g) ?? []) {
    const body = span.slice(1, -1)
    for (const part of body.split(/[\s,()]+/)) if (word(part) && part === part.toUpperCase()) found.add(part)
    const [first, ...rest] = body.split(/\s+/)
    if (word(first) && first === first.toUpperCase()) formsFor(first, rest.join(' ')).forEach((f) => found.add(f))
  }
  return found
}

function taughtBy(lesson) {
  const found = new Set()
  const add = (set) => set.forEach((m) => found.add(m))
  add(formsOfText(lesson.intro))
  for (const b of lesson.content) {
    if (b.type === 'code') add(formsOfCode(b.code))
    if (b.type === 'compare') add(formsOfCode(b.z80))
    if (b.type === 'text' || b.type === 'tip') add(formsOfText(b.text))
    if (b.type === 'table') {
      for (const cell of b.rows.flat()) {
        add(formsOfText(cell))
        const [first, ...rest] = cell.split(/\s+/)
        if (word(first) && first === first.toUpperCase()) formsFor(first, rest.join(' ')).forEach((f) => found.add(f))
      }
    }
  }
  return found
}

const taughtUpTo = (index) => {
  const all = new Set()
  lessons.slice(0, index + 1).forEach((l) => taughtBy(l).forEach((m) => all.add(m)))
  return all
}
const missing = (code, taught) => [...formsOfCode(code)].filter((m) => !taught.has(m))

describe('instruction coverage', () => {
  it('finds instruction forms in code, ignoring labels, directives and comments', () => {
    expect([...formsOfCode("start:  LD A,5 ; comment\nSIZE EQU 4\n        DB 1,2\nloop: DJNZ loop\ndata DB 1\nagain LD B,2\n   ")].sort()).toEqual(['DJNZ', 'LD'])
  })

  it('tells operand forms apart', () => {
    expect([...formsOfCode("ADD A,B\nADD HL,DE\nADD IX,DE\nADD A,(IX+1)\nADC HL,BC\nEX AF,AF'\nEX (SP),HL\nOUT (C),A\nJP (IX)")].sort()).toEqual(
      ["ADC", 'ADC HL', 'ADD', 'ADD (IX)', 'ADD IX', 'EX', "EX AF'", 'EX (SP)', 'JP', 'JP (IX)', 'OUT', 'OUT (C)'].sort(),
    )
  })

  it('notices an instruction or a form that has not been taught yet', () => {
    expect(missing('        DAA', taughtUpTo(0))).toEqual(['DAA'])
    expect(missing('        LD A,1\n        DAA', taughtUpTo(lessons.length - 1))).toEqual([])
    const ixLesson = lessons.findIndex((l) => l.id === 'index-registers')
    expect(missing('        ADD IX,DE', taughtUpTo(ixLesson - 1))).toContain('ADD IX')
    expect(missing('        ADD IX,DE', taughtUpTo(ixLesson))).toEqual([])
  })

  it.each(lessons.map((l, i) => [l.id, i]))('lesson %s only asks for instructions taught so far', (id, index) => {
    expect(missing(solutions[id], taughtUpTo(index)), `${id} needs instructions that no earlier lesson shows`).toEqual([])
  })

  it.each(challenges.map((c) => [c.id, c]))('challenge %s only needs instructions from the lessons it builds on', (id, challenge) => {
    const ids = lessons.map((l) => l.id)
    const last = Math.max(...challenge.uses.map((u) => ids.indexOf(u)))
    expect(last, `${id} lists a lesson that does not exist`).toBeGreaterThanOrEqual(0)
    expect(challenge.uses.every((u) => ids.includes(u))).toBe(true)
    expect(missing(solutions[id], taughtUpTo(last)), `${id} needs instructions not taught by "${ids[last]}" or earlier`).toEqual([])
  })
})
