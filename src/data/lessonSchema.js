// Schema for a lesson. Lessons live in lessons.js, in the order they are taught.
//
// A lesson teaches ONE idea in the left pane, then sets a small coding task in the editor.
// Unlike a challenge, a lesson may (and should) say how: the task is checked with the same
// tests as a challenge, but it must only need what has been taught up to and including
// this lesson. Full guide: docs/lessons.md.
//
// {
//   id:          'unique-slug',                // lowercase letters, digits, dashes; unique across lessons AND challenges
//   title:       'Human readable title',
//   module:      'Values and registers',       // the section this lesson belongs to (lessons are grouped by it)
//   intro:       'One sentence on what you will learn',
//   content: [                                  // the teaching, shown in order
//     { type: 'text', text: 'Paragraph. `inline code` is allowed.' },
//     { type: 'code', code: '...', caption: 'optional', prints: 'optional output' },   // a complete program: it must run to HALT
//     { type: 'code', code: 'LD A,5', fragment: true },                                // a snippet: it must still assemble
//     { type: 'compare', high: 'x = 5', z80: 'LD A,5' },                                // high-level language beside Z80
//     { type: 'tip', text: '...' },
//     { type: 'table', head: ['a', 'b'], rows: [['1', '2']] },
//   ],
//   task:        ['What the learner must do', ...],
//   starterCode: 'Z80 source shown in the editor (starts with ORG 0x8000, fails the tests)',
//   hints:       [...],                         // same shape as a challenge; the last one is a spoiler with the full solution
//   requires:    { call: { label, min } },      // optional, as for challenges
//   tests:       [{ name, setup, expect }],     // as for challenges
// }

import { isString, validateTaskFields, duplicateIds } from './challengeSchema.js'

export const BLOCK_TYPES = ['text', 'code', 'compare', 'tip', 'table']

function validateBlock(b, i, errors) {
  const at = `content[${i}]`
  if (!b || typeof b !== 'object' || !BLOCK_TYPES.includes(b.type)) {
    errors.push(`${at}.type must be one of ${BLOCK_TYPES.join(', ')}`)
    return
  }
  if ((b.type === 'text' || b.type === 'tip') && !isString(b.text)) errors.push(`${at}.text must be a non-empty string`)
  if (b.type === 'code') {
    if (!isString(b.code)) errors.push(`${at}.code must be a non-empty string`)
    if (b.fragment !== undefined && typeof b.fragment !== 'boolean') errors.push(`${at}.fragment must be a boolean`)
    if (b.prints !== undefined && typeof b.prints !== 'string') errors.push(`${at}.prints must be a string`)
    if (b.prints !== undefined && b.fragment) errors.push(`${at}.prints needs a complete program, not a fragment`)
  }
  if (b.type === 'compare' && (!isString(b.high) || !isString(b.z80))) errors.push(`${at} needs high and z80 strings`)
  if (b.type === 'table') {
    const ok = Array.isArray(b.rows) && b.rows.length > 0 && b.rows.every((r) => Array.isArray(r) && r.every(isString))
    if (!ok) errors.push(`${at}.rows must be a non-empty array of string arrays`)
    if (b.head !== undefined && !(Array.isArray(b.head) && b.head.every(isString))) errors.push(`${at}.head must be an array of strings`)
  }
}

// Returns a list of problems with a lesson (empty when valid).
export function validateLesson(l) {
  const errors = []
  if (!l || typeof l !== 'object') return ['lesson must be an object']
  validateTaskFields(l, errors)
  for (const key of ['module', 'intro']) {
    if (!isString(l[key])) errors.push(`${key} must be a non-empty string`)
  }
  if (!Array.isArray(l.content) || l.content.length === 0) errors.push('content must be a non-empty array')
  else {
    l.content.forEach((b, i) => validateBlock(b, i, errors))
    if (!l.content.some((b) => b?.type === 'code' || b?.type === 'compare')) errors.push('content needs at least one worked example (a code or compare block)')
  }
  return errors
}

// Validates the whole curriculum. `others` are other lists whose ids must not clash (the challenges).
export function validateLessons(list, ...others) {
  const errors = []
  list.forEach((l, i) => {
    validateLesson(l).forEach((e) => errors.push(`lesson ${l?.id ?? i}: ${e}`))
  })
  return [...errors, ...duplicateIds(list, ...others)]
}
