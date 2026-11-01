import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'
import challenges from './data/challenges.js'
import solutions from './data/solutions.js'

vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange }) => (
    <textarea aria-label="editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

describe('App', () => {
  it('uses a 30/70 split with instructions on the left and the editor on the right', () => {
    const { container } = render(<App />)
    const main = container.querySelector('main')
    expect(main.className).toContain('grid-cols-[3fr_7fr]')
    expect(main.children[0]).toBe(screen.getByRole('complementary', { name: 'Instructions' }))
    expect(within(main.children[1]).getByLabelText('editor')).toBeInTheDocument()
  })

  it('lists every challenge in the dropdown and switches between them', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /Select challenge/ }))
    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(challenges.length)
    await userEvent.click(screen.getByRole('option', { name: `2. ${challenges[1].title}` }))
    expect(screen.getByRole('heading', { name: challenges[1].title, level: 2 })).toBeInTheDocument()
    expect(screen.getByLabelText('editor')).toHaveValue(challenges[1].starterCode)
  })

  it.each(challenges.map((c) => [c.id, c]))('never shows the solution or hint text up front (%s)', async (id, challenge) => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /Select challenge/ }))
    await userEvent.click(screen.getByRole('option', { name: `${challenges.findIndex((c) => c.id === id) + 1}. ${challenge.title}` }))
    for (const hint of challenge.hints) {
      expect(screen.queryByText(hint.body)).not.toBeInTheDocument()
    }
    expect(document.body.textContent).not.toContain(solutions[id])
  })

  it.each([['Ctrl', { ctrlKey: true }], ['Cmd', { metaKey: true }]])('%s+Enter runs the program from the editor', (_name, mods) => {
    render(<App />)
    expect(screen.getByText('Press Run to test your program.')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByLabelText('editor'), { key: 'Enter', ...mods })
    expect(screen.getByText('Some tests failed.')).toBeInTheDocument()
  })

  it('does not run on a plain Enter, and the editor never sees the shortcut', () => {
    render(<App />)
    const editor = screen.getByLabelText('editor')
    const seen = vi.fn()
    editor.addEventListener('keydown', seen)
    fireEvent.keyDown(editor, { key: 'Enter' })
    expect(screen.getByText('Press Run to test your program.')).toBeInTheDocument()
    expect(seen).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true })
    expect(seen).toHaveBeenCalledTimes(1) // swallowed before it reached the editor
  })

  it('rebuilds the editor on Reset even if the typing and the click arrive together', async () => {
    render(<App />)
    const first = screen.getByLabelText('editor')
    fireEvent.change(first, { target: { value: 'my work' } })
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    const after = screen.getByLabelText('editor')
    expect(after).not.toBe(first) // a fresh editor, so it cannot keep stale text
    expect(after).toHaveValue(challenges[0].starterCode)
  })

  it('fails the starter code and passes the reference solution', async () => {
    render(<App />)
    const run = screen.getByRole('button', { name: 'Run' })
    await userEvent.click(run)
    expect(screen.getByText('Some tests failed.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('editor'), { target: { value: solutions[challenges[0].id] } })
    await userEvent.click(run)
    expect(screen.getByText(/All tests passed/)).toBeInTheDocument()
  })

  it('shows assembly errors and resets to the starter code', async () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('editor'), { target: { value: '  BOGUS' } })
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/Unknown instruction/)
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByLabelText('editor')).toHaveValue(challenges[0].starterCode)
  })
})
