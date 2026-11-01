import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavBar from './NavBar.jsx'
import HintList, { Hint } from './Hint.jsx'
import InstructionPane from './InstructionPane.jsx'
import OutputPanel from './OutputPanel.jsx'
import EditorPane from './EditorPane.jsx'

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
    expect(screen.getByRole('option', { name: '1. Alpha' })).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Select challenge'), 'b')
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
