import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@vercel/kv'

/* The KV client is built explicitly from whichever REST credentials the
   connected database provides. A first-party Vercel KV exposes
   KV_REST_API_URL / KV_REST_API_TOKEN; a Marketplace "Upstash for Redis"
   database exposes UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Both
   speak the same Upstash REST protocol, so createClient works with either. */
const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

/** Presence (never values) of the env vars a REST KV/Redis client might need. */
function envPresence() {
  const keys = [
    'KV_URL', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'KV_REST_API_READ_ONLY_TOKEN',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_URL',
  ]
  return Object.fromEntries(keys.map(k => [k, !!process.env[k]]))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // No REST credentials → the database isn't a REST-capable KV/Upstash store
  // (or isn't connected to this project). Surface a clear, secret-free diagnostic.
  if (!REST_URL || !REST_TOKEN) {
    return res.status(500).json({
      error: 'KV REST credentials missing: expected KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN.',
      env: envPresence(),
    })
  }

  const kv = createClient({ url: REST_URL, token: REST_TOKEN })

  try {
    /* ── POST: record a seed event ─────────────────────────────── */
    if (req.method === 'POST') {
      const { user, seeds, label, labelEn } = req.body as {
        user: string; seeds: number; label: string; labelEn?: string
      }
      if (!user || !seeds || seeds <= 0) return res.status(400).json({ error: 'invalid' })

      const event = { user, seeds, label, labelEn, ts: Date.now() }
      await Promise.all([
        kv.lpush('rr:events', JSON.stringify(event)),
        kv.ltrim('rr:events', 0, 199),
        kv.incrby('rr:total', seeds),
        kv.sadd('rr:users', user),
      ])
      return res.status(200).json({ ok: true })
    }

    /* ── GET: fetch aggregated state ───────────────────────────── */
    if (req.method === 'GET') {
      const [rawEvents, total, userCount] = await Promise.all([
        kv.lrange('rr:events', 0, 29),
        kv.get<number>('rr:total'),
        kv.scard('rr:users'),
      ])
      const events = (rawEvents ?? []).map(e =>
        typeof e === 'string' ? JSON.parse(e) : e
      )
      return res.status(200).json({ events, total: total ?? 0, userCount: userCount ?? 0 })
    }

    /* ── DELETE: reset for a fresh session ─────────────────────── */
    if (req.method === 'DELETE') {
      await Promise.all([kv.del('rr:events'), kv.del('rr:total'), kv.del('rr:users')])
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    // Turn an opaque 500 into something actionable (message + which env vars exist).
    return res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
      env: envPresence(),
    })
  }
}
