import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from 'redis'

/* The connected database is a Vercel Marketplace "Redis" store, which exposes a
   TCP connection string in REDIS_URL (redis:// or rediss://) — not the Upstash
   REST API. So this uses node-redis, which speaks the Redis wire protocol.
   node-redis uses camelCase command names (lPush, not lpush). */

/** Presence (never values) of the env vars a Redis client might use. */
function envPresence() {
  const keys = [
    'REDIS_URL', 'KV_URL', 'KV_REST_API_URL', 'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
  ]
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
      error: 'REDIS_URL missing — no Redis database is connected to this project/environment.',
      env: envPresence(),
    })
  }

  const client = createClient({ url })
  client.on('error', err => console.error('[api/live] redis client error', err))

  try {
    await client.connect()

    /* ── POST: record a seed event ─────────────────────────────── */
    if (req.method === 'POST') {
      const body = req.body ?? {}
      const user: string = body.user || 'Customer'
      const seeds: number = Number(body.seeds) || 0
      const label: string = body.label || ''
      const labelEn: string = body.labelEn || ''
      if (seeds <= 0) return res.status(400).json({ error: 'invalid seeds' })

      const event = { user, seeds, label, labelEn, ts: Date.now() }
      await Promise.all([
        client.lPush('rr:events', JSON.stringify(event)),
        client.lTrim('rr:events', 0, 199),
        client.incrBy('rr:total', seeds),
        client.sAdd('rr:users', user),
        client.zIncrBy('rr:leaderboard', seeds, user),
      ])
      return res.status(200).json({ ok: true })
    }

    /* ── GET: fetch aggregated state ───────────────────────────── */
    if (req.method === 'GET') {
      const [rawEvents, total, userCount, topRaw] = await Promise.all([
        client.lRange('rr:events', 0, 29),
        client.get('rr:total'),
        client.sCard('rr:users'),
        client.zRangeWithScores('rr:leaderboard', 0, 4, { REV: true }),
      ])
      const events = (rawEvents ?? []).map(e => {
        try { return JSON.parse(e) } catch { return e }
      })
      const leaderboard = (topRaw ?? []).map(entry => ({
        user: entry.value,
        seeds: Number(entry.score),
      }))
      return res.status(200).json({
        events,
        total: Number(total) || 0,
        userCount: Number(userCount) || 0,
        leaderboard,
      })
    }

    /* ── DELETE: reset for a fresh session ─────────────────────── */
    if (req.method === 'DELETE') {
      await Promise.all([
        client.del('rr:events'),
        client.del('rr:total'),
        client.del('rr:users'),
        client.del('rr:leaderboard'),
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
    // Close the connection so the serverless invocation can exit cleanly.
    try { await client.quit() } catch { /* already closed */ }
  }
}
