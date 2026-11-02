import { describe, it, expect } from 'vitest'
import lessons from './lessons.js'
import { validateLesson, validateLessons } from './lessonSchema.js'

const good = () => structuredClone(lessons[0])

describe('validateLesson', () => {
  it('accepts a valid lesson', () => {
    expect(validateLesson(good())).toEqual([])
  })
  it('rejects non-objects', () => {
    expect(validateLesson(null)).toEqual(['lesson must be an object'])
  })
  it('reports missing module, intro and content', () => {
    const l = good()
    delete l.module
    l.intro = ''
    l.content = []
    const errors = validateLesson(l).join('\n')
    expect(errors).toContain('module must be')
    expect(errors).toContain('intro must be')
    expect(errors).toContain('content must be a non-empty array')
  })
  it('reports bad content blocks', () => {
    const l = good()
    l.content = [
      { type: 'mystery' }, null, { type: 'text' }, { type: 'tip', text: ' ' },
      { type: 'code', code: '' }, { type: 'code', code: 'LD A,1', fragment: 'yes', prints: 5 },
      { type: 'code', code: 'LD A,1', fragment: true, prints: 'x' },
      { type: 'compare', high: 'x' },
      { type: 'table', rows: [] }, { type: 'table', rows: [['a']], head: [1] },
    ]
    const errors = validateLesson(l).join('\n')
    for (const part of ['content[0].type', 'content[1].type', 'content[2].text', 'content[3].text', 'content[4].code',
      'content[5].fragment', 'content[5].prints must be a string', 'content[6].prints needs a complete program',
      'content[7] needs high and z80', 'content[8].rows', 'content[9].head']) {
      expect(errors).toContain(part)
    }
  })
  it('wants at least one worked example', () => {
    const l = good()
    l.content = [{ type: 'text', text: 'only words' }]
    expect(validateLesson(l).join()).toContain('worked example')
  })
  it('applies the shared task rules too', () => {
    const l = good()
    l.starterCode = 'LD A,1'
    l.hints = []
    expect(validateLesson(l).join('\n')).toContain('starterCode must begin with ORG 0x8000')
  })
})

describe('validateLessons', () => {
  it('prefixes each problem with the lesson id and finds duplicates, including against challenges', () => {
    const a = good()
    const bad = { ...good(), id: 'other', module: '' }
    const errors = validateLessons([a, bad, { ...good() }], [{ id: 'other' }]).join('\n')
    expect(errors).toContain('lesson other: module must be')
    expect(errors).toContain(`duplicate id "${a.id}"`)
    expect(errors).toContain('duplicate id "other"')
  })
  it('accepts the real curriculum', () => {
    expect(validateLessons(lessons)).toEqual([])
  })
})
