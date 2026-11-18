import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'
import challenges from './data/challenges.js'
import lessons from './data/lessons.js'
import solutions from './data/solutions.js'

vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange }) => (
    <textarea aria-label="editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

const openChallenges = () => userEvent.click(screen.getByRole('tab', { name: 'Challenges' }))

describe('App: challenges', () => {
  it('uses a 30/70 split with instructions on the left and the editor on the right', async () => {
    const { container } = render(<App />)
    await openChallenges()
    const main = container.querySelector('main')
    expect(main.className).toContain('grid-cols-[3fr_7fr]')
    expect(main.children[0]).toBe(screen.getByRole('complementary', { name: 'Instructions' }))
    expect(within(main.children[1]).getByLabelText('editor')).toBeInTheDocument()
  })

  it('lists every challenge in the dropdown and switches between them', async () => {
    render(<App />)
    await openChallenges()
    await userEvent.click(screen.getByRole('button', { name: /Select challenge/ }))
    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(challenges.length)
    await userEvent.click(screen.getByRole('option', { name: `2. ${challenges[1].title}` }))
    expect(screen.getByRole('heading', { name: challenges[1].title, level: 2 })).toBeInTheDocument()
    expect(screen.getByLabelText('editor')).toHaveValue(challenges[1].starterCode)
  })

  it('names the lessons a challenge builds on', async () => {
    render(<App />)
    await openChallenges()
    const first = challenges[0]
    const titles = first.uses.map((id) => lessons.find((l) => l.id === id).title)
    expect(screen.getByText(`Builds on: ${titles.join(', ')}`)).toBeInTheDocument()
  })

  it.each(challenges.map((c) => [c.id, c]))('never shows the solution or hint text up front (%s)', async (id, challenge) => {
    render(<App />)
    await openChallenges()
    await userEvent.click(screen.getByRole('button', { name: /Select challenge/ }))
    await userEvent.click(screen.getByRole('option', { name: `${challenges.findIndex((c) => c.id === id) + 1}. ${challenge.title}` }))
    for (const hint of challenge.hints) {
      expect(screen.queryByText(hint.body)).not.toBeInTheDocument()
    }
    expect(document.body.textContent).not.toContain(solutions[id])
  })

  it('fails the starter code and passes the reference solution, then ticks the challenge', async () => {
    render(<App />)
    await openChallenges()
    const run = screen.getByRole('button', { name: 'Run' })
    await userEvent.click(run)
    expect(screen.getByText('Some tests failed.')).toBeInTheDocument()
    expect(screen.queryByText('✓ Done')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('editor'), { target: { value: solutions[challenges[0].id] } })
    await userEvent.click(run)
    expect(screen.getByText(/All tests passed/)).toBeInTheDocument()
    expect(screen.getByText('✓ Done')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('z80_trainer:done'))).toEqual([challenges[0].id])
  })
})

describe('App: lessons', () => {
  it('opens on the first lesson with the lesson pane on the left', () => {
    const { container } = render(<App />)
    expect(screen.getByRole('tab', { name: 'Learn' })).toHaveAttribute('aria-selected', 'true')
    const main = container.querySelector('main')
    expect(main.className).toContain('grid-cols-[3fr_7fr]')
    expect(main.children[0]).toBe(screen.getByRole('complementary', { name: 'Lesson' }))
    expect(screen.getByRole('heading', { name: lessons[0].title, level: 2 })).toBeInTheDocument()
    expect(screen.getByLabelText('editor')).toHaveValue(lessons[0].starterCode)
  })

  it('walks forward and back with Next and Previous', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByRole('heading', { name: lessons[1].title, level: 2 })).toBeInTheDocument()
    expect(screen.getByLabelText('editor')).toHaveValue(lessons[1].starterCode)
    await userEvent.click(screen.getByRole('button', { name: /Previous/ }))
    expect(screen.getByRole('heading', { name: lessons[0].title, level: 2 })).toBeInTheDocument()
  })

  it('goes to the Challenges tab after the last lesson', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /Select lesson/ }))
    await userEvent.click(screen.getByRole('option', { name: new RegExp(`^${lessons.length}\\. `) }))
    await userEvent.click(screen.getByRole('button', { name: 'Go to Challenges →' }))
    expect(screen.getByRole('tab', { name: 'Challenges' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: challenges[0].title, level: 2 })).toBeInTheDocument()
  })

  it('ticks a lesson when its task passes and remembers it', async () => {
    const { unmount } = render(<App />)
    fireEvent.change(screen.getByLabelText('editor'), { target: { value: solutions[lessons[0].id] } })
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(screen.getByText(/All tests passed/)).toBeInTheDocument()
    expect(screen.getByText('✓ Done')).toBeInTheDocument()
    unmount()
    render(<App />)
    expect(screen.getByText('✓ Done')).toBeInTheDocument()
  })

  it('keeps each tab\'s place when switching between them', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /Next/ }))
    await openChallenges()
    await userEvent.click(screen.getByRole('button', { name: /Select challenge/ }))
    await userEvent.click(screen.getByRole('option', { name: `3. ${challenges[2].title}` }))
    await userEvent.click(screen.getByRole('tab', { name: 'Learn' }))
    expect(screen.getByRole('heading', { name: lessons[1].title, level: 2 })).toBeInTheDocument()
    await openChallenges()
    expect(screen.getByRole('heading', { name: challenges[2].title, level: 2 })).toBeInTheDocument()
  })

  it('opens the cheat sheet over either tab and leaves it when a tab is chosen', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Cheat sheet' }))
    expect(screen.getByRole('heading', { name: 'Z80 cheat sheet' })).toBeInTheDocument()
    await openChallenges()
    expect(screen.queryByRole('heading', { name: 'Z80 cheat sheet' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: challenges[0].title, level: 2 })).toBeInTheDocument()
  })
})

describe('App: editor', () => {
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

  it('does not run while the cheat sheet is showing', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Cheat sheet' }))
    fireEvent.keyDown(document.body.firstChild, { key: 'Enter', ctrlKey: true })
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Press Run to test your program.')).toBeInTheDocument()
  })

  it('rebuilds the editor on Reset even if the typing and the click arrive together', async () => {
    render(<App />)
    const first = screen.getByLabelText('editor')
    fireEvent.change(first, { target: { value: 'my work' } })
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    const after = screen.getByLabelText('editor')
    expect(after).not.toBe(first) // a fresh editor, so it cannot keep stale text
    expect(after).toHaveValue(lessons[0].starterCode)
  })

  it('shows assembly errors and resets to the starter code', async () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('editor'), { target: { value: '  BOGUS' } })
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/Unknown instruction/)
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByLabelText('editor')).toHaveValue(lessons[0].starterCode)
  })
})

describe('App: sandbox', () => {
  const openSandbox = () => userEvent.click(screen.getByRole('tab', { name: 'Sandbox' }))
  const type = (value) => fireEvent.change(screen.getByLabelText('editor'), { target: { value } })

  it('shows the cheat sheet on the left, the editor on the right and an output box under it', async () => {
    const { container } = render(<App />)
    await openSandbox()
    const main = container.querySelector('main')
    expect(main.children[0]).toContainElement(screen.getByRole('region', { name: 'Cheat sheet' }))
    expect(main.children[1]).toContainElement(screen.getByLabelText('editor'))
    const output = within(main.children[1]).getByRole('region', { name: 'Output' })
    expect(output).toHaveTextContent('Press Run')
    expect(screen.queryByRole('button', { name: /Select/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cheat sheet' })).not.toBeInTheDocument()
  })

  it('runs the starter program and shows what RST 0x10 printed', async () => {
    render(<App />)
    await openSandbox()
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(screen.getByRole('img', { name: 'Screen output: Hi' })).toBeInTheDocument()
    expect(screen.getByText(/Finished/)).toBeInTheDocument()
  })

  it('shows numbers printed by the ROM print routines', async () => {
    render(<App />)
    await openSandbox()
    type('  ORG 0x8000\n  LD A,2\n  CALL 0x1601\n  LD BC,1234\n  CALL 0x2D2B\n  CALL 0x2DE3\n  HALT\n')
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(screen.getByRole('img', { name: 'Screen output: 1234' })).toBeInTheDocument()
  })

  it('reports assembly errors, endless loops and Reset', async () => {
    render(<App />)
    await openSandbox()
    type('  BOGUS')
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/Unknown instruction/)
    type('  ORG 0x8000\nloop: JP loop\n')
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(screen.getByText(/ran too long/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByLabelText('editor').value).toContain("LD A,'H'")
    expect(screen.getByText(/Press Run/)).toBeInTheDocument()
  })

  it('still shows what was printed before the program failed, with the error', async () => {
    render(<App />)
    await openSandbox()
    type("  ORG 0x8000\n  LD A,2\n  CALL 0x1601\n  LD A,'H'\n  RST 0x10\n  LD A,3\n  CALL 0x1601\n  HALT\n")
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(screen.getByRole('img', { name: 'Screen output: H' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('runs with Ctrl+Enter and remembers the code after a reload', async () => {
    const { unmount } = render(<App />)
    await openSandbox()
    type("  ORG 0x8000\n  LD A,2\n  CALL 0x1601\n  LD A,'Z'\n  RST 0x10\n  HALT\n")
    fireEvent.keyDown(screen.getByLabelText('editor'), { key: 'Enter', ctrlKey: true })
    expect(screen.getByRole('img', { name: 'Screen output: Z' })).toBeInTheDocument()
    unmount()
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Sandbox' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('editor').value).toContain("LD A,'Z'")
  })
})
