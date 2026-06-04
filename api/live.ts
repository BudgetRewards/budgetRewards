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
      const uid     = String(body.uid  || body.user || 'anon')
      const name    = String(body.user || 'Customer')
      const seeds   = Number(body.seeds)   || 0   // event delta for global total
      const balance = Number(body.balance) || 0   // current balance for leaderboard
      const label   = String(body.label    || '')
      const labelEn = String(body.labelEn  || '')

      const ops: Promise<unknown>[] = [
        client.sAdd('rr:users', uid),
        client.hSet('rr:names', uid, name),
        // ZADD sets the score absolutely — no double-count when balance is re-synced
        client.zAdd('rr:leaderboard', [{ score: balance, value: uid }]),
      ]
      if (seeds > 0) {
        // Only log the event and increment global total for real seed events
        const event = { name, seeds, label, labelEn, ts: Date.now() }
        ops.push(client.lPush('rr:events', JSON.stringify(event)))
        ops.push(client.lTrim('rr:events', 0, 199))
        ops.push(client.incrBy('rr:total', seeds))
      }
      await Promise.all(ops)
      return res.status(200).json({ ok: true })
    }

    /* ── GET: fetch aggregated state ─────────────────────────── */
    if (req.method === 'GET') {
      const [rawEvents, total, userCount, allEntries] = await Promise.all([
        client.lRange('rr:events', 0, 29),
        client.get('rr:total'),
        client.sCard('rr:users'),
        client.zRangeWithScores('rr:leaderboard', '+inf', '-inf', {
          BY: 'SCORE', REV: true, LIMIT: { offset: 0, count: 500 },
        }),
      ])

      const events = (rawEvents ?? []).map(e => {
        try { return JSON.parse(e) } catch { return e }
      })

      // Resolve UIDs → names, deduplicate by name (keep highest score per name)
      let all: { user: string; seeds: number }[] = []
      if (allEntries.length > 0) {
        const uids  = allEntries.map(e => e.value)
        const names = await client.hmGet('rr:names', uids)
        const seen  = new Map<string, number>()
        for (let i = 0; i < allEntries.length; i++) {
          const name  = names[i] || uids[i]
          const seeds = Number(allEntries[i].score)
          if (!seen.has(name) || seen.get(name)! < seeds) seen.set(name, seeds)
        }
        all = [...seen.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([user, seeds]) => ({ user, seeds }))
      }

      return res.status(200).json({
        events,
        total:       Number(total) || 0,
        userCount:   Number(userCount) || 0,
        leaderboard: all.slice(0, 5),
        all,
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
