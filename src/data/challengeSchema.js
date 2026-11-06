// Schema for a challenge object. To add a challenge, append an object of this
// shape to the array exported from challenges.js. Full guide: docs/challenges.md.
//
// THE RULE: description, task and explanation say WHAT to do, never HOW. Method-level
// help (instruction names, techniques) belongs in `hints`, which stay hidden until opened.
//
// difficulty: beginner = one idea in a few instructions; intermediate = loops over memory
// or several ideas combined; advanced = a small complete program.
//
// {
//   id:          'unique-slug',
//   title:       'Human readable title',
//   difficulty:  'beginner' | 'intermediate' | 'advanced',
//   category:    'basics' | 'arithmetic' | 'conditionals' | 'loops' | 'memory' | 'subroutines' | 'output',
//   description: 'What the task is and why it matters (never how to solve it)',
//   task:        ['Each requirement as a short sentence', ...],
//   explanation: 'Background on the concept, without giving the answer',
//   starterCode: 'Z80 source shown in the editor',
//   hints:       [{ title: 'Hint 1', body: '...' }, ...,  // hidden until opened; nudge first, near-answer last
//                 { title: 'Spoiler: full solution', spoiler: true, body: '...', code: '...' }],
//                                                        // the last hint is a spoiler: it shows a complete answer
//   uses:        ['lesson-id', ...],                      // the lessons it builds on (shown in the pane; ids must exist)
//   requires:    { call: { label: 'double', min: 3 } },  // optional: the program must define this
//                                                        // label and CALL it at least `min` times
//   tests: [{
//     name:   'test case name',
//     setup:  { registers: { A: 5 }, memory: { 0x9000: [1, 2, 3] } },   // optional
//     expect: { output: 'text', registers: { A: 10 }, memory: { 0x9000: [3] } },
//   // a memory key may also be a label the learner's program defines: memory: { scores: [1, 2, 3] }
//   }],
// }
//
// Every challenge also needs a working Z80 solution in solutions.js under the same
// id. That file is used by the unit tests only and is not imported by the app. The
// spoiler hint's `code` is shipped (hidden until the learner opens it); a test runs it.

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
export const CATEGORIES = ['basics', 'arithmetic', 'conditionals', 'loops', 'memory', 'subroutines', 'output']

export const isString = (v) => typeof v === 'string' && v.trim() !== ''

// The fields a lesson and a challenge share: id, title, starter code, task, hints, tests and
// requires. Pushes any problems onto `errors`.
export function validateTaskFields(c, errors) {
  for (const key of ['id', 'title', 'starterCode']) {
    if (!isString(c[key])) errors.push(`${key} must be a non-empty string`)
  }
  if (isString(c.id) && !/^[a-z0-9-]+$/.test(c.id)) errors.push('id must be lowercase letters, digits and dashes')
  if (isString(c.starterCode) && !/^\s*ORG\s+0x8000\b/i.test(c.starterCode)) errors.push('starterCode must begin with ORG 0x8000')
  if (c.requires !== undefined) {
    const call = c.requires?.call
    if (!call || !isString(call.label) || !Number.isInteger(call.min) || call.min < 1) {
      errors.push('requires.call must be { label: string, min: positive integer }')
    }
  }
  if (!Array.isArray(c.task) || c.task.length === 0 || !c.task.every(isString)) {
    errors.push('task must be a non-empty array of strings')
  }
  if (!Array.isArray(c.hints) || c.hints.length === 0 || !c.hints.every((h) => h && isString(h.title) && isString(h.body))) {
    errors.push('hints must be a non-empty array of { title, body }')
  } else {
    c.hints.forEach((h, i) => {
      if (h.spoiler !== undefined && typeof h.spoiler !== 'boolean') errors.push(`hints[${i}].spoiler must be a boolean`)
      if (h.spoiler && !isString(h.code)) errors.push(`hints[${i}] is a spoiler, so it needs a code string`)
      if (!h.spoiler && h.code !== undefined) errors.push(`hints[${i}].code is only allowed on a spoiler hint`)
      if (h.spoiler && i !== c.hints.length - 1) errors.push(`hints[${i}]: a spoiler must be the last hint`)
      if (h.spoiler && !/spoiler/i.test(h.title)) errors.push(`hints[${i}]: a spoiler's title must say "Spoiler"`)
    })
  }
  if (!Array.isArray(c.tests) || c.tests.length === 0) errors.push('tests must be a non-empty array')
  else {
    c.tests.forEach((t, i) => {
      if (!isString(t?.name)) errors.push(`tests[${i}].name must be a non-empty string`)
      if (!t?.expect || typeof t.expect !== 'object' || Object.keys(t.expect).length === 0) {
        errors.push(`tests[${i}].expect must define output, registers or memory`)
      }
    })
  }
}

// Reports ids that appear more than once across one or more lists of items.
export function duplicateIds(...lists) {
  const seen = new Set()
  const errors = []
  for (const list of lists) {
    for (const c of list) {
      if (seen.has(c?.id)) errors.push(`duplicate id "${c.id}"`)
      seen.add(c?.id)
    }
  }
  return errors
}

// Returns a list of problems with a challenge (empty when valid).
export function validateChallenge(c) {
  const errors = []
  if (!c || typeof c !== 'object') return ['challenge must be an object']
  validateTaskFields(c, errors)
  for (const key of ['category', 'description', 'explanation']) {
    if (!isString(c[key])) errors.push(`${key} must be a non-empty string`)
  }
  if (isString(c.category) && !CATEGORIES.includes(c.category)) errors.push(`category must be one of ${CATEGORIES.join(', ')}`)
  if (c.uses !== undefined && !(Array.isArray(c.uses) && c.uses.length > 0 && c.uses.every(isString))) errors.push('uses must be a non-empty array of lesson ids')
  if (!DIFFICULTIES.includes(c.difficulty)) errors.push(`difficulty must be one of ${DIFFICULTIES.join(', ')}`)
  return errors
}

// Validates a whole array, including id uniqueness.
export function validateChallenges(list) {
  const errors = []
  list.forEach((c, i) => {
    validateChallenge(c).forEach((e) => errors.push(`challenge ${c?.id ?? i}: ${e}`))
  })
  return [...errors, ...duplicateIds(list)]
}
