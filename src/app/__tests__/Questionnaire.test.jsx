import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheckboxGroup, RadioGroup, ProfileSheet } from '../ProfileSheet.jsx'
import { RRProvider } from '../store/RRContext.tsx'
import { LanguageProvider } from '../i18n.jsx'

const OPTS = [
  { value: 'a', label: 'A' }, { value: 'b', label: 'B' },
  { value: 'c', label: 'C' }, { value: 'd', label: 'D' },
]

describe('CheckboxGroup (rolling top-3)', () => {
  test('adds a value when under the cap', () => {
    const onChange = vi.fn()
    render(<CheckboxGroup options={OPTS} value={['a']} max={3} onChange={onChange} />)
    fireEvent.click(screen.getByText('B'))
    expect(onChange).toHaveBeenCalledWith(['a', 'b'])
  })

  test('removes a value when toggling a selected option', () => {
    const onChange = vi.fn()
    render(<CheckboxGroup options={OPTS} value={['a', 'b']} max={3} onChange={onChange} />)
    fireEvent.click(screen.getByText('A'))
    expect(onChange).toHaveBeenCalledWith(['b'])
  })

  test('rolling: selecting a 4th drops the oldest and keeps length 3', () => {
    const onChange = vi.fn()
    render(<CheckboxGroup options={OPTS} value={['a', 'b', 'c']} max={3} onChange={onChange} />)
    fireEvent.click(screen.getByText('D'))
    expect(onChange).toHaveBeenCalledWith(['b', 'c', 'd'])
  })
})

describe('RadioGroup', () => {
  test('calls onChange with the picked value', () => {
    const onChange = vi.fn()
    render(<RadioGroup options={OPTS} value="a" onChange={onChange} />)
    fireEvent.click(screen.getByText('C'))
    expect(onChange).toHaveBeenCalledWith('c')
  })
})

describe('Profile consolidated save', () => {
  beforeEach(() => localStorage.clear())

  test('has exactly one Save button; saving shows completion and disables it', () => {
    render(
      <RRProvider>
        <LanguageProvider>
          <ProfileSheet onClose={() => {}} />
        </LanguageProvider>
      </RRProvider>
    )
    // Consolidation: a single Save button for the whole profile (was two).
    const saveButtons = screen.getAllByRole('button', { name: /^(Opslaan|Save)$/ })
    expect(saveButtons).toHaveLength(1)

    const btn = saveButtons[0]
    fireEvent.click(btn)
    // Completion card with the earned-seeds line appears.
    expect(screen.getByText(/verdiend|You earned/i)).toBeInTheDocument()
    // The single button is now disabled, so the reward can't fire twice.
    expect(btn).toBeDisabled()
  })
})
