import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { recordSeeds, fetchLive } from '../live.ts'

describe('live client', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })
  afterEach(() => vi.restoreAllMocks())

  test('recordSeeds POSTs the event with the stored user name', async () => {
    localStorage.setItem('rr-name', 'Jan')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await recordSeeds({ seeds: 20, label: 'Test', labelEn: 'Test EN' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/live')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ user: 'Jan', seeds: 20, label: 'Test', labelEn: 'Test EN' })
  })

  test('recordSeeds is a no-op without a user name', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await recordSeeds({ seeds: 20, label: 'Test' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('recordSeeds is a no-op for non-positive seeds', async () => {
    localStorage.setItem('rr-name', 'Jan')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await recordSeeds({ seeds: 0, label: 'Test' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('recordSeeds swallows network errors (does not throw)', async () => {
    localStorage.setItem('rr-name', 'Jan')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(recordSeeds({ seeds: 5, label: 'X' })).resolves.toBeUndefined()
  })

  test('fetchLive returns parsed state on success', async () => {
    const state = { events: [{ user: 'Jan', seeds: 10, label: 'A', ts: 1 }], total: 10, userCount: 1 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => state }))
    expect(await fetchLive()).toEqual(state)
  })

  test('fetchLive returns null on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    expect(await fetchLive()).toBeNull()
  })
})
