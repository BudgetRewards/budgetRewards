import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { RRProvider, useTrigger } from '../store/RRContext.tsx'
import { LanguageProvider } from '../i18n.jsx'
import { Dashboard } from '../screens/dashboard.jsx'
import { Tiers } from '../screens/tiers.jsx'

/* Push the store to the forest (top) tier, where nextTier becomes null.
   Reproduces the blank-screen crash: screens derefed R.nextTier unconditionally. */
function PushToForest({ children }) {
  const { claimNotification } = useTrigger()
  const fired = React.useRef(false)
  React.useEffect(() => {
    if (fired.current) return
    fired.current = true
    claimNotification('Big jump', 'Big jump', 'App & Data', 6000) // 0 → 6000 → forest
  }, [claimNotification])
  return children
}

function renderAtForest(node) {
  return render(
    <RRProvider>
      <LanguageProvider>
        <PushToForest>{node}</PushToForest>
      </LanguageProvider>
    </RRProvider>
  )
}

describe('top tier (nextTier === null) renders without crashing', () => {
  test('Dashboard renders at the forest tier', () => {
    renderAtForest(<Dashboard onNav={() => {}} onProfileOpen={() => {}} />)
    // Hero balance label is present — the screen mounted without throwing.
    expect(screen.getAllByText(/seeds/i).length).toBeGreaterThan(0)
  })

  test('Tiers renders at the forest tier', () => {
    renderAtForest(<Tiers />)
    // The Forest tier card is present.
    expect(screen.getAllByText(/Bos|Forest/).length).toBeGreaterThan(0)
  })
})
