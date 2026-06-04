import React from 'react'

const POLL_MS = 2000

function useCountUp(target, duration = 1200) {
  const [display, setDisplay] = React.useState(target)
  const prev = React.useRef(target)
  React.useEffect(() => {
    if (target === prev.current) return
    const from = prev.current
    const diff = target - from
    prev.current = target
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + diff * ease))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return display
}

const fmt = n => n.toLocaleString('nl-NL')

function SeedLeaf({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 19c0-8 6-13 14-13 0 8-5 14-13 14a8 8 0 0 1-1-1z" fill="#00A651"/>
    </svg>
  )
}

function EventRow({ event, index }) {
  const age = Math.round((Date.now() - event.ts) / 1000)
  const ageLabel = age < 60 ? `${age}s ago` : `${Math.round(age / 60)}m ago`

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:16,
      padding:'14px 24px',
      borderBottom:'1px solid rgba(255,255,255,0.06)',
      animation: index === 0 ? 'slideIn .4s cubic-bezier(.22,1,.36,1) both' : 'none',
      background: index === 0 ? 'rgba(0,166,81,0.08)' : 'transparent',
      transition:'background .3s',
    }}>
      <div style={{
        width:44, height:44, borderRadius:12, flexShrink:0,
        background:'rgba(0,166,81,0.18)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <SeedLeaf size={22}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:800, fontSize:18, color:'#fff', letterSpacing:-0.3 }}>
          {event.user}
        </div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {event.labelEn || event.label}
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontWeight:900, fontSize:24, color:'#00A651', letterSpacing:-0.5 }}>
          +{fmt(event.seeds)}
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{ageLabel}</div>
      </div>
    </div>
  )
}

function ResetButton() {
  const [confirm, setConfirm] = React.useState(false)
  const [done, setDone] = React.useState(false)

  async function handleReset() {
    await fetch('/api/live', { method: 'DELETE' })
    setDone(true)
    setConfirm(false)
    setTimeout(() => setDone(false), 3000)
  }

  if (done) return (
    <span style={{ fontSize:12, color:'#00A651', fontWeight:700 }}>✓ Reset done</span>
  )

  if (confirm) return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Sure?</span>
      <button onClick={handleReset} style={{
        background:'#e55', border:'none', borderRadius:8, padding:'5px 12px',
        color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
      }}>Yes, reset</button>
      <button onClick={() => setConfirm(false)} style={{
        background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'5px 12px',
        color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, cursor:'pointer',
      }}>Cancel</button>
    </div>
  )

  return (
    <button onClick={() => setConfirm(true)} style={{
      background:'none', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8,
      padding:'5px 12px', color:'rgba(255,255,255,0.3)', fontSize:12,
      fontWeight:600, cursor:'pointer',
    }}>
      Reset data
    </button>
  )
}

export function LiveDisplay() {
  const [total, setTotal] = React.useState(0)
  const [userCount, setUserCount] = React.useState(0)
  const [events, setEvents] = React.useState([])
  const [error, setError] = React.useState(false)
  const [lastUpdate, setLastUpdate] = React.useState(null)

  const displayTotal = useCountUp(total)

  React.useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch('/api/live')
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (cancelled) return
        setTotal(data.total ?? 0)
        setUserCount(data.userCount ?? 0)
        setEvents(data.events ?? [])
        setLastUpdate(new Date())
        setError(false)
      } catch {
        if (!cancelled) setError(true)
      }
    }

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return (
    <div style={{
      minHeight:'100vh', background:'#0a1a0f',
      fontFamily:"'Inter', -apple-system, system-ui, sans-serif",
      WebkitFontSmoothing:'antialiased',
      display:'flex', flexDirection:'column',
    }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%      { opacity:.6; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'24px 40px', borderBottom:'1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <img src="/favicon.svg" width={52} height={36} alt="Budget Thuis"/>
          <div>
            <div style={{ fontWeight:900, fontSize:20, color:'#fff', letterSpacing:-0.4 }}>
              Rooted<span style={{ color:'#00A651' }}>Rewards</span>
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:600, letterSpacing:1.2, textTransform:'uppercase' }}>
              Live seed counter
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{
            width:10, height:10, borderRadius:'50%', flexShrink:0,
            background: error ? '#e55' : '#00A651',
            animation: error ? 'none' : 'pulse 2s ease-in-out infinite',
          }}/>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>
            {error ? 'Offline' : `${userCount} customer${userCount !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Hero counter */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'40px',
        minHeight: events.length > 0 ? 'auto' : '60vh',
      }}>
        <div style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>
          Total seeds harvested
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <SeedLeaf size={56}/>
          <div style={{
            fontWeight:900, letterSpacing:-4,
            fontSize: displayTotal >= 100000 ? 96 : displayTotal >= 10000 ? 112 : 128,
            color:'#fff', lineHeight:1,
            textShadow:'0 0 80px rgba(0,166,81,0.4)',
          }}>
            {fmt(displayTotal)}
          </div>
        </div>
        <div style={{ fontSize:18, color:'rgba(255,255,255,0.4)', fontWeight:600, marginTop:12 }}>
          seeds
        </div>

        {userCount > 0 && (
          <div style={{
            marginTop:28, display:'flex', alignItems:'center', gap:8,
            background:'rgba(0,166,81,0.12)', borderRadius:99, padding:'8px 20px',
          }}>
            <span style={{ fontSize:18 }}>👥</span>
            <span style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>
              {userCount} {userCount === 1 ? 'customer' : 'customers'} earning seeds
            </span>
          </div>
        )}
      </div>

      {/* Live feed */}
      {events.length > 0 && (
        <div style={{ maxWidth:680, width:'100%', margin:'0 auto 40px', padding:'0 20px' }}>
          <div style={{
            fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.3)',
            letterSpacing:1.5, textTransform:'uppercase', marginBottom:12, paddingLeft:4,
          }}>
            Recent activity
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:20, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)' }}>
            {events.slice(0, 8).map((e, i) => (
              <EventRow key={`${e.user}-${e.ts}`} event={e} index={i}/>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 24px', borderTop:'1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>
          Scan the QR code to join · updates every {POLL_MS / 1000}s
          {lastUpdate && ` · last updated ${lastUpdate.toLocaleTimeString()}`}
        </span>
        <ResetButton/>
      </div>
    </div>
  )
}
