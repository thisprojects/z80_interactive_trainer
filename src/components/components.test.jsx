import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavBar from './NavBar.jsx'
import HintList, { Hint } from './Hint.jsx'
import InstructionPane from './InstructionPane.jsx'
import OutputPanel from './OutputPanel.jsx'
import EditorPane from './EditorPane.jsx'
import CheatSheet from './CheatSheet.jsx'
import ChallengeMenu from './ChallengeMenu.jsx'

vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange }) => (
    <textarea aria-label="editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

const challenge = {
  id: 'c1', title: 'First', difficulty: 'beginner', category: 'basics',
  description: 'Do the thing.', task: ['Step one', 'Step two'], explanation: 'Some background.',
  hints: [{ title: 'Hint 1', body: 'secret one' }, { title: 'Hint 2', body: 'secret two' }],
}

describe('NavBar', () => {
  const list = [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }]
  it('lists challenges and reports changes and clicks', async () => {
    const onSelect = vi.fn(); const onRun = vi.fn(); const onReset = vi.fn()
    render(<NavBar challenges={list} selectedId="a" onSelect={onSelect} onRun={onRun} onReset={onReset} />)
    await userEvent.click(screen.getByRole('button', { name: /Select challenge/ }))
    expect(screen.getByRole('option', { name: '1. Alpha' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option', { name: '2. Beta' }))
    expect(onSelect).toHaveBeenCalledWith('b')
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onRun).toHaveBeenCalled()
    expect(onReset).toHaveBeenCalled()
  })
})

describe('Hint accordion', () => {
  it('hides hint text until opened and toggles closed again', async () => {
    render(<HintList hints={challenge.hints} />)
    expect(screen.queryByText('secret one')).not.toBeInTheDocument()
    const btn = screen.getByRole('button', { name: /Hint 1/ })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(btn)
    expect(screen.getByText('secret one')).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByText('secret two')).not.toBeInTheDocument()
    await userEvent.click(btn)
    expect(screen.queryByText('secret one')).not.toBeInTheDocument()
  })
  it('renders a single hint', () => {
    render(<Hint title="T" body="B" />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })
})

describe('InstructionPane', () => {
  it('shows the task and explanation but no hint text', () => {
    render(<InstructionPane challenge={challenge} />)
    expect(screen.getByRole('heading', { name: 'First' })).toBeInTheDocument()
    expect(screen.getByText('Do the thing.')).toBeInTheDocument()
    expect(screen.getByText('Step two')).toBeInTheDocument()
    expect(screen.getByText('Some background.')).toBeInTheDocument()
    expect(screen.queryByText('secret one')).not.toBeInTheDocument()
    expect(screen.getByText(/prints a newline/)).toBeInTheDocument()
  })
})

describe('OutputPanel', () => {
  it('prompts before the first run', () => {
    render(<OutputPanel result={null} />)
    expect(screen.getByText(/Press Run/)).toBeInTheDocument()
  })
  it('shows assembly errors', () => {
    render(<OutputPanel result={{ ok: false, error: 'Line 2: nope' }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Line 2: nope')
  })
  it('shows passes, failures and runtime errors', () => {
    const result = {
      ok: true, passed: false,
      results: [
        { name: 'good', passed: true, failures: [] },
        { name: 'bad', passed: false, failures: [{ what: 'register A', expected: '1', actual: '2' }] },
        { name: 'boom', passed: false, error: 'it broke', failures: [] },
      ],
    }
    render(<OutputPanel result={result} />)
    expect(screen.getByText('Some tests failed.')).toBeInTheDocument()
    expect(screen.getByText(/✓ good/)).toBeInTheDocument()
    expect(screen.getByText(/expected: 1/)).toBeInTheDocument()
    expect(screen.getByText(/actual: 2/)).toBeInTheDocument()
    expect(screen.getByText('it broke')).toBeInTheDocument()
  })
  it('congratulates when all pass', () => {
    render(<OutputPanel result={{ ok: true, passed: true, results: [{ name: 'g', passed: true, failures: [] }] }} />)
    expect(screen.getByText(/All tests passed/)).toBeInTheDocument()
  })
})

describe('EditorPane', () => {
  it('shows the code and reports edits', () => {
    const onChange = vi.fn()
    render(<EditorPane code="NOP" onChange={onChange} />)
    const ed = screen.getByLabelText('editor')
    expect(ed).toHaveValue('NOP')
    fireEvent.change(ed, { target: { value: 'HALT' } })
    expect(onChange).toHaveBeenCalledWith('HALT')
  })
})

describe('accessibility and styling', () => {
  it('announces results politely', () => {
    render(<OutputPanel result={null} />)
    expect(screen.getByRole('region', { name: 'Results' })).toHaveAttribute('aria-live', 'polite')
  })
  it('colours the difficulty badge by level and tolerates duplicate task lines', () => {
    const { rerender } = render(<InstructionPane challenge={{ ...challenge, task: ['same', 'same'], difficulty: 'advanced' }} />)
    expect(screen.getByText('advanced').className).toContain('rose')
    expect(screen.getAllByText('same')).toHaveLength(2)
    rerender(<InstructionPane challenge={{ ...challenge, difficulty: 'mystery' }} />)
    expect(screen.getByText('mystery').className).toContain('emerald')
  })
})

describe('NavBar cheat sheet toggle', () => {
  it('toggles the cheat sheet and hides the run controls while it is open', async () => {
    const onToggle = vi.fn()
    const props = { challenges: [{ id: 'a', title: 'Alpha' }], selectedId: 'a', onSelect: vi.fn(), onRun: vi.fn(), onReset: vi.fn(), onToggleCheatSheet: onToggle }
    const { rerender } = render(<NavBar {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cheat sheet' }))
    expect(onToggle).toHaveBeenCalled()
    rerender(<NavBar {...props} showCheatSheet />)
    expect(screen.getByRole('button', { name: 'Back to challenges' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Select challenge/ })).not.toBeInTheDocument()
  })
})

describe('CheatSheet', () => {
  it('shows instructions and patterns, and filters instructions', async () => {
    render(<CheatSheet />)
    expect(screen.getByRole('article', { name: 'Counted loop with DJNZ' })).toBeInTheDocument()
    expect(screen.getByText('DJNZ e')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Filter instructions'), 'ldir')
    expect(screen.queryByText('DJNZ e')).not.toBeInTheDocument()
    expect(screen.getAllByText(/^LDIR$/).length).toBeGreaterThan(0)
    await userEvent.clear(screen.getByLabelText('Filter instructions'))
    await userEvent.type(screen.getByLabelText('Filter instructions'), 'zzzz')
    expect(screen.getByText(/No instructions match/)).toBeInTheDocument()
  })
})

describe('Spoiler hint', () => {
  it('hides the code until opened, then shows it', async () => {
    render(<Hint title="Spoiler: full solution" body="How it works" spoiler code={'LD A,42\nHALT'} />)
    expect(screen.queryByText(/LD A,42/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Spoiler: full solution/ }))
    expect(screen.getByText('How it works')).toBeInTheDocument()
    expect(screen.getByText(/LD A,42/)).toBeInTheDocument()
  })
})

describe('ChallengeMenu', () => {
  const list = [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }, { id: 'c', title: 'Gamma' }]
  const setup = () => {
    const onSelect = vi.fn()
    render(<><span>outside</span><ChallengeMenu challenges={list} selectedId="b" onSelect={onSelect} /></>)
    return { onSelect, button: screen.getByRole('button', { name: 'Select challenge: 2. Beta' }) }
  }

  it('opens below the button, marks the current challenge, and closes on an outside click or Escape', async () => {
    const { button } = setup()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await userEvent.click(button)
    expect(screen.getByRole('listbox').className).toContain('top-full')
    expect(screen.getByRole('option', { name: '2. Beta' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByText('outside'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await userEvent.click(button)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await userEvent.click(button)
    await userEvent.click(button)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('works from the keyboard', async () => {
    const { onSelect, button } = setup()
    button.focus()
    await userEvent.keyboard('{ArrowDown}') // opens on the current item
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}') // clamps at the last item
    expect(onSelect).toHaveBeenLastCalledWith('c')
    await userEvent.keyboard('{Enter}{Home}{Enter}')
    expect(onSelect).toHaveBeenLastCalledWith('a')
    await userEvent.keyboard(' {End}{ArrowUp}{ArrowUp}{ArrowUp}{Enter}')
    expect(onSelect).toHaveBeenLastCalledWith('a')
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await userEvent.keyboard('{Tab}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}{Home}') // harmless while closed
  })

  it('selects with the mouse', async () => {
    const { onSelect, button } = setup()
    await userEvent.click(button)
    await userEvent.hover(screen.getByRole('option', { name: '3. Gamma' }))
    await userEvent.click(screen.getByRole('option', { name: '3. Gamma' }))
    expect(onSelect).toHaveBeenCalledWith('c')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
