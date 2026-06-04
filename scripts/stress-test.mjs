/**
 * Stress test for /api/live
 *
 * Usage:
 *   node scripts/stress-test.mjs                        # hits localhost:5173
 *   node scripts/stress-test.mjs https://your.vercel.app  # hits production
 *
 * Simulates:
 *   - N concurrent "customers" each sending a POST when they earn seeds
 *   - 1 "presenter" screen polling GET every 2 seconds
 *
 * Reports per-second throughput, p50/p95/p99 latency, and error rate.
 */

const BASE = process.argv[2] ?? 'http://localhost:5173'
const API  = `${BASE}/api/live`

const CUSTOMERS       = 300   // concurrent simulated users
const DURATION_SEC    = 60    // how long to run
const MIN_EVENT_MS    = 8_000 // min time between a user earning seeds
const MAX_EVENT_MS    = 20_000 // max time between a user earning seeds
const POLL_INTERVAL_MS = 2_000 // how often the live page polls

const NAMES = [
  'Lucas','Emma','Lars','Sophie','Jan','Anna','Tom','Lena','Daan','Sara',
  'Finn','Mia','Noor','Hugo','Iris','Bram','Eva','Cas','Amy','Tim',
]
const EVENTS = [
  { label:'Harvest Hours — zaterdag', labelEn:'Harvest Hours — Saturday', seeds:20 },
  { label:'Harvest Hours — zondag',   labelEn:'Harvest Hours — Sunday',   seeds:20 },
  { label:'Gratis stroom!',           labelEn:'Free electricity!',        seeds:10 },
  { label:'Zonnepiek gedetecteerd',   labelEn:'Solar peak detected',      seeds:15 },
  { label:'Smart home besparing',     labelEn:'Smart home saving',        seeds:40 },
  { label:'Verbruik onder gemiddelde',labelEn:'Usage below average',      seeds:30 },
  { label:'Weekend bonus',            labelEn:'Weekend bonus',            seeds:20 },
]

// ── stats ────────────────────────────────────────────────────────
const stats = { ok: 0, err: 0, latencies: [] }

async function request(method, body) {
  const start = performance.now()
  try {
    const res = await fetch(API, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body:    body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    })
    const ms = performance.now() - start
    if (res.ok) {
      stats.ok++
      stats.latencies.push(ms)
    } else {
      stats.err++
      if (stats.err <= 5) {
        const text = await res.text().catch(() => '')
        console.error(`  ✗ ${method} ${res.status}: ${text.slice(0, 120)}`)
      }
    }
  } catch (e) {
    stats.err++
    const ms = performance.now() - start
    stats.latencies.push(ms)
    if (stats.err <= 5) console.error(`  ✗ ${method} error: ${e.message}`)
  }
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function percentile(sorted, p) {
  const i = Math.floor(sorted.length * p / 100)
  return sorted[Math.min(i, sorted.length - 1)] ?? 0
}

// ── simulate a single customer ───────────────────────────────────
async function runCustomer(name, deadline) {
  while (Date.now() < deadline) {
    const wait = randomBetween(MIN_EVENT_MS, MAX_EVENT_MS)
    await new Promise(r => setTimeout(r, wait))
    if (Date.now() >= deadline) break

    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)]
    await request('POST', { user: name, ...event })
  }
}

// ── simulate the presenter live-page polling ─────────────────────
async function runPoller(deadline) {
  while (Date.now() < deadline) {
    await request('GET')
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
  }
}

// ── print live stats every 5 seconds ────────────────────────────
function startReporter(deadline) {
  const interval = setInterval(() => {
    const elapsed = Math.round((deadline - Date.now()) / 1000)
    const total = stats.ok + stats.err
    const errorRate = total ? ((stats.err / total) * 100).toFixed(1) : '0.0'
    const sorted = [...stats.latencies].sort((a, b) => a - b)
    const p50 = percentile(sorted, 50).toFixed(0)
    const p95 = percentile(sorted, 95).toFixed(0)
    console.log(
      `  [${elapsed}s left]  ` +
      `✓ ${stats.ok}  ✗ ${stats.err}  err% ${errorRate}  ` +
      `p50 ${p50}ms  p95 ${p95}ms`
    )
    if (Date.now() >= deadline) clearInterval(interval)
  }, 5000)
  return interval
}

// ── main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\nStress testing ${API}`)
  console.log(`  ${CUSTOMERS} customers · ${DURATION_SEC}s · 1 live-page poller\n`)

  // warm-up: one GET to verify the API is reachable
  await request('GET')
  if (stats.err > 0) {
    console.error('\nAPI not reachable — make sure the server is running and try again.\n')
    process.exit(1)
  }
  console.log('  API reachable ✓  starting load...\n')
  stats.ok = 0; stats.err = 0; stats.latencies = []

  const deadline = Date.now() + DURATION_SEC * 1000
  const reporter = startReporter(deadline)

  const names = Array.from({ length: CUSTOMERS }, (_, i) =>
    NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : '')
  )

  await Promise.all([
    ...names.map(name => runCustomer(name, deadline)),
    runPoller(deadline),
  ])

  clearInterval(reporter)

  // ── final report ────────────────────────────────────────────────
  const total = stats.ok + stats.err
  const sorted = [...stats.latencies].sort((a, b) => a - b)
  console.log('\n── Results ──────────────────────────────────────────────')
  console.log(`  Total requests : ${total}`)
  console.log(`  Successful     : ${stats.ok}  (${((stats.ok / total) * 100).toFixed(1)}%)`)
  console.log(`  Errors         : ${stats.err}  (${((stats.err / total) * 100).toFixed(1)}%)`)
  console.log(`  Throughput     : ${(total / DURATION_SEC).toFixed(1)} req/s`)
  console.log(`  Latency p50    : ${percentile(sorted, 50).toFixed(0)} ms`)
  console.log(`  Latency p95    : ${percentile(sorted, 95).toFixed(0)} ms`)
  console.log(`  Latency p99    : ${percentile(sorted, 99).toFixed(0)} ms`)
  console.log(`  Latency max    : ${sorted[sorted.length - 1]?.toFixed(0) ?? 0} ms`)
  console.log('─────────────────────────────────────────────────────────\n')

  const errorRate = (stats.err / total) * 100
  if (errorRate > 5) {
    console.warn(`  ⚠️  Error rate ${errorRate.toFixed(1)}% — likely hitting concurrency or rate limits.`)
  } else {
    console.log(`  ✅  Error rate ${errorRate.toFixed(1)}% — looks solid for 300 customers.`)
  }
}

main().catch(console.error)
