import type { VercelRequest, VercelResponse } from '@vercel/node'

// Lazy-import kv so missing env vars surface as a handled error, not a crash
async function getKv() {
  const { kv } = await import('@vercel/kv')
  return kv
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const kv = await getKv()

    /* ── POST: record a seed event ───────────────────────────── */
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

    /* ── GET: fetch aggregated state ─────────────────────────── */
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

    /* ── DELETE: reset for a fresh session ───────────────────── */
    if (req.method === 'DELETE') {
      await Promise.all([kv.del('rr:events'), kv.del('rr:total'), kv.del('rr:users')])
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const isKvConfig = msg.includes('KV_REST_API') || msg.includes('token') || msg.includes('url')
    return res.status(503).json({
      error: isKvConfig
        ? 'Vercel KV not connected. Go to Vercel dashboard → Storage → Create KV → connect to project, then redeploy.'
        : msg,
    })
  }
}
