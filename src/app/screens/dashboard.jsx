import React from 'react'
import RR from '../data.jsx'
import { Icon, SeedMark, useCountUp, fmt, Progress } from '../ui.jsx'

/* ───────────────── Screen 1 · Dashboard ───────────────── */
function Logo({ light=false }){
  return (
    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
      <span style={{ width:26, height:26, borderRadius:8, background:light?'rgba(255,255,255,0.18)':'var(--green)',
        display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
        <Icon name="leaf" size={16} stroke="#fff"/>
      </span>
      <span style={{ fontWeight:800, fontSize:15, letterSpacing:-0.2, color:light?'#fff':'var(--navy)' }}>
        Rooted<span style={{ color:light?'#C8E600':'var(--green)' }}>Rewards</span>
      </span>
    </div>
  );
}

function Dashboard({ onNav }){
  const R = RR;
  const tier = R.tiers.find(t=>t.id===R.currentTier);
  const bal = useCountUp(R.balance);
  const pct = (R.balance / R.nextTier.threshold) * 100;
  const toNext = R.nextTier.threshold - R.balance;

  return (
    <div className="rr-page rr-stagger">
      <div className="rr-header" style={{ padding:'4px 0 14px' }}>
        <div>
          <div className="rr-sub" style={{ fontWeight:600 }}>Goedemorgen,</div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.4 }}>{R.user.name} 👋</div>
        </div>
        <Logo/>
      </div>

      {/* Hero balance card */}
      <div style={{ borderRadius:24, padding:'22px 20px 20px', position:'relative', overflow:'hidden',
        background:'linear-gradient(155deg,#00B85A 0%,#00A651 46%,#018a45 100%)',
        boxShadow:'0 18px 38px rgba(0,166,81,0.30)', color:'#fff' }}>
        {/* deco */}
        <div style={{ position:'absolute', right:-40, top:-50, width:180, height:180, borderRadius:'50%',
          background:'rgba(255,255,255,0.08)' }}/>
        <div style={{ position:'absolute', right:18, top:18, width:90, height:90, borderRadius:'50%',
          background:'rgba(200,230,0,0.18)' }}/>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
          <div className="rr-eyebrow" style={{ color:'rgba(255,255,255,0.85)' }}>Jouw seeds-saldo</div>
          <div style={{ background:'rgba(255,255,255,0.16)', borderRadius:99, padding:'5px 11px',
            display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:800, letterSpacing:0.3,
            backdropFilter:'blur(4px)' }}>
            <span style={{ fontSize:15 }}>{tier.emoji}</span>{tier.name} · {tier.mult}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:6, position:'relative' }}>
          <SeedMark size={30} tone="onGreen"/>
          <span style={{ fontSize:48, fontWeight:800, letterSpacing:-1.5, lineHeight:1 }}>{fmt(bal)}</span>
          <span style={{ fontSize:14, fontWeight:600, opacity:0.85, marginBottom:4 }}>seeds</span>
        </div>

        <div style={{ marginTop:18, position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600,
            marginBottom:7, opacity:0.95 }}>
            <span>Naar 🌲 Bos</span>
            <span><b style={{ fontWeight:800 }}>{fmt(toNext)}</b> seeds te gaan</span>
          </div>
          <Progress pct={pct} lime onGreen/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:600,
            marginTop:7, opacity:0.8 }}>
            <span>{fmt(R.balance)}</span>
            <span>{fmt(R.nextTier.threshold)}</span>
          </div>
        </div>

        <div style={{ marginTop:14, fontSize:11.5, fontWeight:500, opacity:0.82, position:'relative',
          display:'flex', alignItems:'center', gap:6 }}>
          <Icon name="calendar" size={14} stroke="rgba(255,255,255,0.85)" sw={2}/>
          Periode {R.period.startLabel} – {R.period.endLabel}
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, marginTop:14 }}>
        <div className="rr-chip">
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="bolt" size={15} stroke="var(--green)"/>
            <span className="v">{R.multiplier.toLocaleString('nl-NL')}×</span>
          </div>
          <span className="l">Multiplier actief</span>
        </div>
        <div className="rr-chip">
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="sun" size={15} stroke="var(--green)" sw={2}/>
            <span className="v">{R.harvest.daysEarned}</span>
          </div>
          <span className="l">Oogstdagen verdiend</span>
        </div>
        <div className="rr-chip">
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="calendar" size={15} stroke="var(--green)"/>
            <span className="v">{R.period.daysLeft}</span>
          </div>
          <span className="l">Dagen in periode</span>
        </div>
      </div>

      {/* Quick action strip */}
      <button className="rr-card" onClick={()=>onNav('earn')} style={{ marginTop:14, width:'100%', border:'none',
        cursor:'pointer', fontFamily:'inherit', textAlign:'left', padding:'15px 16px',
        display:'flex', alignItems:'center', gap:13 }}>
        <span style={{ width:42, height:42, borderRadius:13, background:'rgba(200,230,0,0.22)', flexShrink:0,
          display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="earn" size={22} stroke="#6a7a00"/>
        </span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:14 }}>Verdien meer seeds</div>
          <div className="rr-sub" style={{ fontSize:12 }}>5 acties beschikbaar om te claimen</div>
        </div>
        <Icon name="arrow" size={20} stroke="var(--green)"/>
      </button>

      {/* Recent activity preview */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'24px 2px 10px' }}>
        <div className="rr-section-label" style={{ margin:0 }}>Recente activiteit</div>
        <button onClick={()=>onNav('history')} style={{ border:'none', background:'none', cursor:'pointer',
          fontFamily:'inherit', color:'var(--green)', fontWeight:700, fontSize:12 }}>Alles →</button>
      </div>
      <div className="rr-card" style={{ overflow:'hidden' }}>
        {R.ledger.slice(0,3).map((e,i)=>(
          <div key={e.id}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px' }}>
              <SeedMark size={30} tone={e.kind==='neg'?'lime':'green'}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.name}</div>
                <div className="rr-sub" style={{ fontSize:11.5 }}>{e.date}</div>
              </div>
              <div style={{ fontWeight:800, fontSize:15, color: e.kind==='neg'?'var(--red)':'var(--green)' }}>
                {e.amount>0?'+':''}{fmt(e.amount)}
              </div>
            </div>
            {i<2 && <div className="rr-divider" style={{ marginLeft:58 }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Dashboard, Logo };
