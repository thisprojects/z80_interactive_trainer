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
//   hints:       [{ title: 'Hint 1', body: '...' }],      // hidden until opened
//   requires:    { call: { label: 'double', min: 3 } },  // optional: the program must define this
//                                                        // label and CALL it at least `min` times
//   tests: [{
//     name:   'test case name',
//     setup:  { registers: { A: 5 }, memory: { 0x9000: [1, 2, 3] } },   // optional
//     expect: { output: 'text', registers: { A: 10 }, memory: { 0x9000: [3] } },
//   }],
// }
//
// Every challenge also needs a working Z80 solution in solutions.js under the same
// id. It is used by the unit tests only and is not shipped in the app bundle.

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
export const CATEGORIES = ['basics', 'arithmetic', 'conditionals', 'loops', 'memory', 'subroutines', 'output']

const isString = (v) => typeof v === 'string' && v.trim() !== ''

// Returns a list of problems with a challenge (empty when valid).
export function validateChallenge(c) {
  const errors = []
  if (!c || typeof c !== 'object') return ['challenge must be an object']
  for (const key of ['id', 'title', 'category', 'description', 'explanation', 'starterCode']) {
    if (!isString(c[key])) errors.push(`${key} must be a non-empty string`)
  }
  if (isString(c.id) && !/^[a-z0-9-]+$/.test(c.id)) errors.push('id must be lowercase letters, digits and dashes')
  if (isString(c.starterCode) && !/^\s*ORG\s+0x8000\b/i.test(c.starterCode)) errors.push('starterCode must begin with ORG 0x8000')
  if (isString(c.category) && !CATEGORIES.includes(c.category)) errors.push(`category must be one of ${CATEGORIES.join(', ')}`)
  if (c.requires !== undefined) {
    const call = c.requires?.call
    if (!call || !isString(call.label) || !Number.isInteger(call.min) || call.min < 1) {
      errors.push('requires.call must be { label: string, min: positive integer }')
    }
  }
  if (!DIFFICULTIES.includes(c.difficulty)) errors.push(`difficulty must be one of ${DIFFICULTIES.join(', ')}`)
  if (!Array.isArray(c.task) || c.task.length === 0 || !c.task.every(isString)) {
    errors.push('task must be a non-empty array of strings')
  }
  if (!Array.isArray(c.hints) || c.hints.length === 0 || !c.hints.every((h) => h && isString(h.title) && isString(h.body))) {
    errors.push('hints must be a non-empty array of { title, body }')
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
  return errors
}

// Validates a whole array, including id uniqueness.
export function validateChallenges(list) {
  const errors = []
  const seen = new Set()
  list.forEach((c, i) => {
    validateChallenge(c).forEach((e) => errors.push(`challenge ${c?.id ?? i}: ${e}`))
    if (seen.has(c?.id)) errors.push(`duplicate id "${c.id}"`)
    seen.add(c?.id)
  })
  return errors
}
