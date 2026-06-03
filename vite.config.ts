/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
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
          next()
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app/index.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/app/test-setup.ts',
  },
})
