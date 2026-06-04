import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TierUpCelebrationView } from '../TierUpCelebration.jsx'

describe('TierUpCelebrationView', () => {
  test('renders title + subtitle and calls onDismiss when Continue is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <TierUpCelebrationView
        to="tree"
        title="You've grown to Tree!"
        subtitle="Your multiplier is now 1.5×"
        continueLabel="Continue"
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByText("You've grown to Tree!")).toBeInTheDocument()
    expect(screen.getByText('Your multiplier is now 1.5×')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  test('renders three trees for the forest crossing', () => {
    const { container } = render(
      <TierUpCelebrationView
        to="forest"
        title="You've grown to Forest!"
        subtitle="Your multiplier is now 2×"
        continueLabel="Continue"
        onDismiss={() => {}}
      />
    )
    expect(container.querySelectorAll('svg').length).toBe(3)
  })
})
