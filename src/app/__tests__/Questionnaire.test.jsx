import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheckboxGroup, RadioGroup } from '../ProfileSheet.jsx'

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
