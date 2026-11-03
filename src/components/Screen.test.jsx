import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Screen, { COLS, ROWS, layoutScreen } from './Screen.jsx'

describe('Screen', () => {
  it('shows printed lines', () => {
    render(<Screen output={'Hi\nthere'} />)
    expect(screen.getByRole('img').textContent).toBe('Hi\nthere')
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Hi')
  })
  it('wraps long lines at the screen width', () => {
    expect(layoutScreen('x'.repeat(COLS + 5))).toEqual(['x'.repeat(COLS), 'xxxxx'])
  })
  it('keeps blank lines and scrolls old lines off the top', () => {
    expect(layoutScreen('a\n\nb')).toEqual(['a', '', 'b'])
    const many = Array.from({ length: ROWS + 3 }, (_, i) => `l${i}`).join('\n')
    const lines = layoutScreen(many)
    expect(lines).toHaveLength(ROWS)
    expect(lines.at(-1)).toBe(`l${ROWS + 2}`)
  })
})
