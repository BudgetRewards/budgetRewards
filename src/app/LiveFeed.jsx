import React from 'react'
import { fetchLive } from './live.ts'
import { useT, useFmt, useLang } from './i18n.jsx'
import { Icon, SeedMark } from './ui.jsx'

const POLL_MS = 12000

/* Live community card on the Dashboard: global total seeds, participant count,
   and a recent-events feed, read from the KV-backed /api/live endpoint. Renders
   nothing until there is data (so it stays invisible in local dev without the API). */
export function LiveFeed() {
  const t = useT()
  const fmt = useFmt()
  const { lang } = useLang()
  const L = t.dashboard.live
  const [data, setData] = React.useState(null)

  React.useEffect(() => {
    let alive = true
    const load = async () => {
      const d = await fetchLive()
      if (alive && d) setData(d)
    }
    load()
    const id = setInterval(load, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [])

  if (!data || (!data.total && !(data.events && data.events.length))) return null

  const events = data.events || []

  return (
    <div className="rr-card rr-fadein" style={{ marginTop:14, padding:'16px 18px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)',
          boxShadow:'0 0 0 4px rgba(0,166,81,0.18)', flexShrink:0 }}/>
        <span style={{ fontWeight:800, fontSize:14 }}>{L.title}</span>
      </div>

      {/* aggregate stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
        <div className="rr-chip">
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <SeedMark size={15}/>
            <span className="v">{fmt(data.total || 0)}</span>
          </div>
          <span className="l">{L.total}</span>
        </div>
        <div className="rr-chip">
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="tiers" size={15} stroke="var(--green)" sw={2}/>
            <span className="v">{fmt(data.userCount || 0)}</span>
          </div>
          <span className="l">{L.users}</span>
        </div>
      </div>

      {/* recent events */}
      <div style={{ marginTop:13 }}>
        <div className="rr-eyebrow muted" style={{ fontSize:10, marginBottom:8 }}>{L.recent}</div>
        {events.length === 0 ? (
          <div className="rr-sub" style={{ fontSize:12.5 }}>{L.empty}</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {events.slice(0, 6).map((e, i) => {
              const label = lang === 'en' ? (e.labelEn || e.label) : e.label
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <span style={{ width:26, height:26, borderRadius:8, flexShrink:0, fontSize:12, fontWeight:800,
                    background:'rgba(0,166,81,0.10)', color:'var(--green)',
                    display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                    {(e.user || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:700, color:'var(--navy)', whiteSpace:'nowrap',
                      overflow:'hidden', textOverflow:'ellipsis' }}>{label}</div>
                    <div className="rr-sub" style={{ fontSize:11 }}>{e.user}</div>
                  </div>
                  <span style={{ fontSize:12.5, fontWeight:800, color:'var(--green)', flexShrink:0 }}>
                    +{fmt(e.seeds)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
