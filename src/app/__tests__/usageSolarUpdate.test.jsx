import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// RRProvider broadcasts to /api/live; stub it out.
beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }))
  if (!globalThis.crypto?.randomUUID) {
    globalThis.crypto = { ...globalThis.crypto, randomUUID: () => 'test-uuid' }
  }
})

/** Highest numeric value across all StatCards with the given label (daily + monthly). */
function maxStatValue(labelText) {
  const labels = screen.queryAllByText(labelText)
  if (labels.length === 0) return null
  return Math.max(...labels.map(label => {
    const valueSpan = label.parentElement.querySelector('span')
    return valueSpan ? parseFloat(valueSpan.textContent) : 0
  }))
}

test('enabling solar updates the graph to show production', async () => {
  // Onboarded customer WITH electricity, WITHOUT solar.
  localStorage.setItem('rr-name', 'Test')
  localStorage.setItem('rr-lang', 'nl')
  // Monthly meter readings on, so the consumption graph is shown (not gated).
  localStorage.setItem('rr-config', JSON.stringify({ catalogue: [{ name: 'Maandelijkse meterstand', status: 'claimed' }] }))
  localStorage.setItem('rr-profile', JSON.stringify({
    products: ['electricity'], solarPanels: false, homeBattery: false, householdSize: 2, customerYears: 0,
  }))

  const { LanguageProvider, useLang } = await import('../i18n.jsx')
  const { RRProvider } = await import('../store/RRContext.tsx')
  const { Usage } = await import('../screens/usage.jsx')

  function EnableSolar() {
    const { profile, setProfile } = useLang()
    return <button onClick={() => setProfile({ ...profile, solarPanels: true })}>enable-solar</button>
  }

  render(
    <LanguageProvider>
      <RRProvider>
        <EnableSolar />
        <Usage />
      </RRProvider>
    </LanguageProvider>
  )

  // Electricity is on → consumption graph shows, but no production yet (no solar).
  expect(screen.getAllByText('Verbruik').length).toBeGreaterThan(0) // title + consumption legend
  expect(screen.queryByText('Opwek')).toBeNull()           // no production legend
  expect(maxStatValue('Totaal opwek')).toBeNull()          // no production stat card

  // Enable solar.
  fireEvent.click(screen.getByText('enable-solar'))

  // Production legend appears (showProduction flipped on) ...
  await waitFor(() => expect(screen.queryByText('Opwek')).not.toBeNull())
  // ... and the day re-simulates so production is actually non-zero.
  await waitFor(() => expect(maxStatValue('Totaal opwek')).toBeGreaterThan(0))
})

test('navigating to Usage with solar already on shows production (mount re-simulate)', async () => {
  // Mimics: enable solar elsewhere, then open the Usage tab fresh. The seed day
  // was generated without solar, so the screen must re-simulate it on mount.
  localStorage.setItem('rr-name', 'Test')
  localStorage.setItem('rr-lang', 'nl')
  // Monthly meter readings on, so the consumption graph is shown (not gated).
  localStorage.setItem('rr-config', JSON.stringify({ catalogue: [{ name: 'Maandelijkse meterstand', status: 'claimed' }] }))
  localStorage.setItem('rr-profile', JSON.stringify({
    products: ['electricity'], solarPanels: true, homeBattery: false, householdSize: 2, customerYears: 0,
  }))

  const { LanguageProvider } = await import('../i18n.jsx')
  const { RRProvider } = await import('../store/RRContext.tsx')
  const { Usage } = await import('../screens/usage.jsx')

  render(
    <LanguageProvider><RRProvider><Usage /></RRProvider></LanguageProvider>
  )

  // hasSolar is true from the start → production legend shows immediately.
  expect(screen.queryByText('Opwek')).not.toBeNull()
  // The seed day had no production; the mount effect must re-simulate to fill it.
  await waitFor(() => expect(maxStatValue('Totaal opwek')).toBeGreaterThan(0))
})
