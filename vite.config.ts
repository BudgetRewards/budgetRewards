/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-live-mock',
      configureServer(server) {
        // In-memory store — mimics Vercel KV for local dev
        const store: {
          events: object[]; total: number;
          users: Set<string>;
          uidSeeds: Map<string, number>;
          uidNames: Map<string, string>;
        } = { events: [], total: 0, users: new Set(), uidSeeds: new Map(), uidNames: new Map() }

        server.middlewares.use('/api/live', (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Content-Type', 'application/json')

          if (req.method === 'GET') {
            // Deduplicate by name — keep highest score per name
            const byName = new Map<string, number>()
            for (const [uid, seeds] of store.uidSeeds) {
              const name = store.uidNames.get(uid) || uid
              if (!byName.has(name) || byName.get(name)! < seeds) byName.set(name, seeds)
            }
            const leaderboard = [...byName.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([user, seeds]) => ({ user, seeds }))
            res.end(JSON.stringify({
              events: store.events.slice(0, 30),
              total: store.total,
              userCount: store.users.size,
              leaderboard,
            }))
          } else if (req.method === 'POST') {
            let body = ''
            req.on('data', (c: Buffer) => { body += c })
            req.on('end', () => {
              try {
                const { uid, user, seeds, balance, label, labelEn } = JSON.parse(body)
                const id   = uid || user || 'anon'
                const name = user || 'Customer'
                store.users.add(id)
                store.uidNames.set(id, name)
                // ZADD: set absolute balance on leaderboard
                if (balance > 0) store.uidSeeds.set(id, balance)
                if (seeds > 0) {
                  store.events.unshift({ name, seeds, label, labelEn, ts: Date.now() })
                  store.events = store.events.slice(0, 200)
                  store.total += seeds
                }
              } catch { /* ignore */ }
              res.end(JSON.stringify({ ok: true }))
            })
          } else if (req.method === 'DELETE') {
            store.events = []; store.total = 0
            store.users.clear(); store.uidSeeds.clear(); store.uidNames.clear()
            res.end(JSON.stringify({ ok: true }))
          } else {
            res.end('{}')
          }
        })
      },
    },
    {
      name: 'app-page',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/app' || req.url === '/app/') {
            const html = fs.readFileSync(resolve(__dirname, 'app/index.html'), 'utf-8')
            const transformed = await server.transformIndexHtml('/app/', html)
            res.setHeader('Content-Type', 'text/html')
            res.end(transformed)
            return
          }
          if (req.url === '/config' || req.url === '/config/') {
            const html = fs.readFileSync(resolve(__dirname, 'config/index.html'), 'utf-8')
            const transformed = await server.transformIndexHtml('/config/', html)
            res.setHeader('Content-Type', 'text/html')
            res.end(transformed)
            return
          }
          if (req.url === '/live' || req.url === '/live/') {
            const html = fs.readFileSync(resolve(__dirname, 'live/index.html'), 'utf-8')
            const transformed = await server.transformIndexHtml('/live/', html)
            res.setHeader('Content-Type', 'text/html')
            res.end(transformed)
            return
          }
          next()
        })
      },
    },
  ],
  server: {
    watch: {
      // Visual Studio locks files under .vs/ (e.g. *.vsidx), which makes
      // chokidar throw EBUSY. Exclude it and other generated dirs.
      ignored: ['**/.vs/**', '**/node_modules/**', '**/dist/**'],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        app:    resolve(__dirname, 'app/index.html'),
        config: resolve(__dirname, 'config/index.html'),
        live:   resolve(__dirname, 'live/index.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/app/test-setup.ts',
  },
})
