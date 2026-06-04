import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'POST') {
      const body = req.body ?? {}
      const user: string = body.user || 'Customer'
      const seeds: number = Number(body.seeds) || 0
      const label: string = body.label || ''
      const labelEn: string = body.labelEn || ''

      if (seeds <= 0) return res.status(400).json({ error: 'invalid seeds' })

      const event = { user, seeds, label, labelEn, ts: Date.now() }
      await kv.lpush('rr:events', JSON.stringify(event))
      await kv.ltrim('rr:events', 0, 199)
      await kv.incrby('rr:total', seeds)
      await kv.sadd('rr:users', user)
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'GET') {
      const rawEvents = await kv.lrange('rr:events', 0, 29)
      const total = await kv.get<number>('rr:total')
      const userCount = await kv.scard('rr:users')
      const events = (rawEvents ?? []).map(e =>
        typeof e === 'string' ? JSON.parse(e) : e
      )
      return res.status(200).json({ events, total: total ?? 0, userCount: userCount ?? 0 })
    }

    if (req.method === 'DELETE') {
      await kv.del('rr:events')
      await kv.del('rr:total')
      await kv.del('rr:users')
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'method not allowed' })

  } catch (err: unknown) {
    console.error('[api/live]', err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message })
  }
}
