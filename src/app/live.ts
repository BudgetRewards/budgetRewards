import { useEffect, useRef } from 'react'
import { useRR } from './store/RRContext.tsx'

/* ─── Live community store (Vercel KV via /api/live) ───────────────
   The serverless function at api/live.ts owns the KV connection. This
   module is the browser client: it records seed earnings and reads the
   aggregated global state. Every call is best-effort — when the API is
   absent (plain `vite dev`) or offline, failures are swallowed so the
   app keeps working normally.                                        */

const ENDPOINT = '/api/live'

export type LiveEvent = { user: string; seeds: number; label: string; labelEn?: string; ts: number }
export type LiveState = { events: LiveEvent[]; total: number; userCount: number }

/** POST a single seed earning to the live store. No-op without a user name or non-positive seeds. */
export async function recordSeeds(input: { seeds: number; label: string; labelEn?: string }): Promise<void> {
  const user = (localStorage.getItem('rr-name') || '').trim()
  if (!user || !input.seeds || input.seeds <= 0) return
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, seeds: input.seeds, label: input.label, labelEn: input.labelEn }),
    })
  } catch {
    /* offline or no API in local dev — ignore */
  }
}

/** GET the aggregated global state, or null if unavailable. */
export async function fetchLive(): Promise<LiveState | null> {
  try {
    const res = await fetch(ENDPOINT)
    if (!res.ok) return null
    return (await res.json()) as LiveState
  } catch {
    return null
  }
}

/**
 * Records each new positive ledger entry to the live store exactly once.
 * Baselines to the newest entry on mount so the onboarding history is not
 * re-sent; thereafter every fresh `pos` entry is POSTed (oldest first).
 */
export function useLiveSync(): void {
  const { ledger } = useRR()
  const lastSeen = useRef<number | null>(null)

  useEffect(() => {
    const topId = ledger.length ? ledger[0].id : 0
    if (lastSeen.current === null) {
      lastSeen.current = topId // baseline — don't resend existing history
      return
    }
    if (topId <= lastSeen.current) return
    const since = lastSeen.current
    // Ledger is newest-first; reverse so the feed receives them oldest-first.
    const fresh = ledger.filter(e => e.id > since && e.kind === 'pos').reverse()
    for (const e of fresh) {
      recordSeeds({ seeds: e.amount, label: e.name, labelEn: e.nameEn })
    }
    lastSeen.current = topId
  }, [ledger])
}
