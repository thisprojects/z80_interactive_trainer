import { describe, it, expect } from 'vitest'
import lessons from './lessons.js'
import challenges from './challenges.js'
import solutions from './solutions.js'
import { validateLessons } from './lessonSchema.js'
import { runChallenge, runProgram } from '../z80/runner.js'
import { assemble } from '../z80/assembler.js'

describe('lessons data', () => {
  it('follows the schema, with ids that are unique across lessons and challenges', () => {
    expect(validateLessons(lessons, challenges)).toEqual([])
  })

  it('has at least one lesson in each module, grouped together in order', () => {
    const modules = lessons.map((l) => l.module)
    const order = [...new Set(modules)]
    expect(modules).toEqual([...modules].sort((a, b) => order.indexOf(a) - order.indexOf(b)))
  })

  describe.each(lessons.map((l) => [l.id, l]))('%s', (_id, lesson) => {
    it('its reference solution passes every test', () => {
      const result = runChallenge(lesson, solutions[lesson.id])
      expect(result.error).toBeUndefined()
      expect(result.results.filter((r) => !r.passed)).toEqual([])
      expect(result.passed).toBe(true)
    })

    it('the starter code does not already pass', () => {
      expect(runChallenge(lesson, lesson.starterCode).passed).toBe(false)
    })

    it('ends with a spoiler hint whose code is a working solution', () => {
      const last = lesson.hints.at(-1)
      expect(last.spoiler).toBe(true)
      expect(lesson.hints.length).toBeGreaterThanOrEqual(2)
      expect(runChallenge(lesson, last.code).passed).toBe(true)
    })

    it('every worked example runs, or at least assembles', () => {
      for (const block of lesson.content.filter((b) => b.type === 'code' || b.type === 'compare')) {
        const source = block.type === 'compare' ? block.z80 : block.code
        const fragment = block.type === 'compare' || block.fragment
        if (fragment) {
          expect(() => assemble(`        ORG 0x8000\n${source}\n        HALT`), source).not.toThrow()
        } else {
          const run = runProgram(source)
          expect(run.halted, source).toBe(true)
          if (block.prints !== undefined) expect(run.output, source).toBe(block.prints)
        }
      }
    })
  })
})
