import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheckboxGroup, RadioGroup, Questionnaire } from '../ProfileSheet.jsx'
import React from 'react'
import { RRProvider, useRR } from '../store/RRContext.tsx'
import { LanguageProvider, useLang } from '../i18n.jsx'

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

describe('Questionnaire save flow', () => {
  beforeEach(() => localStorage.clear())

  function Host() {
    const { profile, setProfile } = useLang()
    return <Questionnaire profile={profile} setProfile={setProfile} />
  }

  test('clicking Save shows the completion card', () => {
    render(
      <RRProvider>
        <LanguageProvider>
          <Host />
        </LanguageProvider>
      </RRProvider>
    )
    expect(screen.queryByText(/Vragenlijst ingevuld|Questionnaire completed/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Opslaan|Save/ }))
    expect(screen.getByText(/Vragenlijst ingevuld|Questionnaire completed/)).toBeInTheDocument()
  })

  test('awards the reward only once across repeated saves', () => {
    function HostWithBalance() {
      const { profile, setProfile } = useLang()
      const { balance } = useRR()
      return (
        <>
          <div data-testid="bal">{balance}</div>
          <Questionnaire profile={profile} setProfile={setProfile} />
        </>
      )
    }
    render(
      <RRProvider>
        <LanguageProvider>
          <HostWithBalance />
        </LanguageProvider>
      </RRProvider>
    )
    const bal = () => Number(screen.getByTestId('bal').textContent)
    const before = bal()
    const saveBtn = () => screen.getByRole('button', { name: /Opslaan|Save/ })

    fireEvent.click(saveBtn())
    const afterFirst = bal()
    expect(afterFirst).toBeGreaterThan(before)   // first save awarded seeds

    fireEvent.click(saveBtn())
    expect(bal()).toBe(afterFirst)               // second save does NOT re-award
  })
})
