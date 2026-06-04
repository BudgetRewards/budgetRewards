import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { LanguageProvider, useLang } from '../i18n.jsx'

function Editor() {
  const { profile, setProfile } = useLang()
  return (
    <button onClick={() => setProfile(prev => ({ ...prev, questionnaireCompleted: true }))}>
      save {String(profile.questionnaireCompleted)}
    </button>
  )
}

describe('setProfile persistence with a function updater', () => {
  beforeEach(() => localStorage.clear())

  test('persists valid JSON (not the string "undefined") to localStorage', () => {
    render(<LanguageProvider><Editor /></LanguageProvider>)
    fireEvent.click(screen.getByRole('button'))
    const raw = localStorage.getItem('rr-profile')
    expect(raw).not.toBe('undefined')          // the bug wrote the literal string "undefined"
    const parsed = JSON.parse(raw)              // must be valid JSON
    expect(parsed.questionnaireCompleted).toBe(true)
  })
})
