import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from 'redis'

function envPresence() {
  const keys = ['REDIS_URL','KV_URL','KV_REST_API_URL','KV_REST_API_TOKEN']
  return Object.fromEntries(keys.map(k => [k, !!process.env[k]]))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const url = process.env.REDIS_URL
  if (!url) {
    return res.status(500).json({
      error: 'REDIS_URL missing — connect a Redis database in Vercel dashboard → Storage.',
      env: envPresence(),
    })
  }

  const client = createClient({ url })
  client.on('error', err => console.error('[api/live] redis error', err))

  try {
    await client.connect()

    /* ── POST: record a seed event ───────────────────────────── */
    if (req.method === 'POST') {
      const body   = req.body ?? {}
      const uid    = String(body.uid  || body.user || 'anon')
      const name   = String(body.user || 'Customer')
      const seeds  = Number(body.seeds)  || 0
      const label  = String(body.label   || '')
      const labelEn = String(body.labelEn || '')

      if (seeds <= 0) return res.status(400).json({ error: 'invalid seeds' })

      const event = { name, seeds, label, labelEn, ts: Date.now() }
      await Promise.all([
        client.lPush('rr:events',   JSON.stringify(event)),
        client.lTrim('rr:events',   0, 199),
        client.incrBy('rr:total',   seeds),
        client.sAdd('rr:users',     uid),
        client.zIncrBy('rr:leaderboard', seeds, uid),
        client.hSet('rr:names',     uid, name),   // uid → display name
      ])
      return res.status(200).json({ ok: true })
    }

    /* ── GET: fetch aggregated state ─────────────────────────── */
    if (req.method === 'GET') {
      const [rawEvents, total, userCount, topEntries] = await Promise.all([
        client.lRange('rr:events', 0, 29),
        client.get('rr:total'),
        client.sCard('rr:users'),
        // BYSCORE REV LIMIT gives the highest-scoring UIDs, sorted descending
        client.zRangeWithScores('rr:leaderboard', '+inf', '-inf', {
          BY: 'SCORE', REV: true, LIMIT: { offset: 0, count: 20 },
        }),
      ])

      const events = (rawEvents ?? []).map(e => {
        try { return JSON.parse(e) } catch { return e }
      })

      // Resolve UIDs → display names, then deduplicate by name (keep highest
      // score per name so the same person on two devices appears only once).
      let leaderboard: { user: string; seeds: number }[] = []
      if (topEntries.length > 0) {
        const uids  = topEntries.map(e => e.value)
        const names = await client.hmGet('rr:names', uids)
        const seen  = new Map<string, number>() // name → seeds
        for (let i = 0; i < topEntries.length; i++) {
          const name  = names[i] || uids[i]
          const seeds = Number(topEntries[i].score)
          if (!seen.has(name) || seen.get(name)! < seeds) seen.set(name, seeds)
        }
        leaderboard = [...seen.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([user, seeds]) => ({ user, seeds }))
      }

      return res.status(200).json({
        events,
        total:      Number(total) || 0,
        userCount:  Number(userCount) || 0,
        leaderboard,
      })
    }

    /* ── DELETE: reset for a fresh session ───────────────────── */
    if (req.method === 'DELETE') {
      await Promise.all([
        client.del('rr:events'),
        client.del('rr:total'),
        client.del('rr:users'),
        client.del('rr:leaderboard'),
        client.del('rr:names'),
      ])
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (err) {
    console.error('[api/live]', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
      env: envPresence(),
    })
  } finally {
    try { await client.quit() } catch { /* already closed */ }
  }
}
