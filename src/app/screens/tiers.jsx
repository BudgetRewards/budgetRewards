import React from 'react'
import { useRR } from '../store/RRContext.tsx'
import { Icon, ScreenHeader, Progress } from '../ui.jsx'
import { useT, useFmt, useLang, tRoutes } from '../i18n.jsx'

/* ───────────────── Screen 4 · Tier overview ───────────────── */
function TierCard({ tier, current, achieved, isNext }){
  const t = useT();
  const fmt = useFmt();
  const { lang } = useLang();
  const name = lang === 'en' ? tier.nameEn : tier.name;
  const routes = tRoutes(tier, lang);
  const range = tier.max==null
    ? `${fmt(tier.min)}+ seeds`
    : `${fmt(tier.min)} – ${fmt(tier.max)} seeds`;
  return (
    <div style={{ borderRadius:20, padding:'16px 17px', position:'relative',
      background: current ? '#fff' : achieved ? '#fff' : 'rgba(255,255,255,0.6)',
      border: current ? '2px solid var(--green)' : '1px solid var(--grey-line)',
      boxShadow: current ? '0 10px 28px rgba(0,166,81,0.16)' : 'var(--card-shadow)',
      opacity: (!current && !achieved && !isNext) ? 0.9 : 1 }}>
      {current && (
        <div style={{ position:'absolute', top:-11, left:17, background:'var(--green)', color:'#fff',
          fontSize:10, fontWeight:800, letterSpacing:0.5, textTransform:'uppercase',
          padding:'4px 10px', borderRadius:99, boxShadow:'0 4px 10px rgba(0,166,81,0.3)' }}>
          {t.tiers.currentBadge}
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ width:48, height:48, borderRadius:14, flexShrink:0, fontSize:26,
          background: current?'rgba(0,166,81,0.10)':'rgba(26,26,46,0.04)',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          filter: (!achieved && !current) ? 'grayscale(0.5)' : 'none' }}>{tier.emoji}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:7 }}>
            <span className="rr-h2" style={{ fontSize:16 }}>{name}</span>
            <span className="rr-sub" style={{ fontSize:12, fontWeight:600 }}>{tier.en}</span>
          </div>
          <div className="rr-sub" style={{ fontSize:12, marginTop:2 }}>{range}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, color: current?'var(--green)':'var(--navy)' }}>{tier.mult}</div>
          <div className="rr-sub" style={{ fontSize:10.5, fontWeight:700 }}>{t.tiers.multiplier}</div>
        </div>
      </div>

      <div style={{ marginTop:13, paddingTop:13, borderTop:'1px solid var(--grey-line)' }}>
        <div className="rr-eyebrow muted" style={{ marginBottom:8, fontSize:10 }}>{t.tiers.qualify}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {routes.map((r,i)=>(
            <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <span style={{ marginTop:1, flexShrink:0 }}>
                <Icon name={achieved||current?'check':'arrow'} size={14}
                  stroke={achieved||current?'var(--green)':'var(--grey-2)'} sw={2.4}/>
              </span>
              <span className="rr-sub" style={{ fontSize:12.5, color:'var(--navy)' }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tiers(){
  const R = useRR();
  const t = useT();
  const fmt = useFmt();
  const { lang } = useLang();
  const order = ['seed','tree','forest'];
  const curIdx = order.indexOf(R.currentTier);
  const pct = (R.balance / R.nextTier.threshold) * 100;
  const toNext = R.nextTier.threshold - R.balance;
  const nextName = lang === 'en' ? R.nextTier.nameEn : R.nextTier.name;
  const curTier = R.tiers.find(tr => tr.id === R.currentTier);
  const curName = lang === 'en' ? curTier.nameEn : curTier.name;

  return (
    <div className="rr-page">
      <ScreenHeader eyebrow={t.tiers.eyebrow} title={t.tiers.title}/>

      {/* progress to next */}
      <div className="rr-card rr-fadein" style={{ padding:'16px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <span style={{ fontWeight:800, fontSize:13.5, whiteSpace:'nowrap' }}>{curTier.emoji} {curName} → {R.tiers.find(tr => tr.name === R.nextTier.name || tr.nameEn === R.nextTier.nameEn)?.emoji} {nextName}</span>
          <span style={{ fontSize:12.5, fontWeight:700, color:'var(--green)', whiteSpace:'nowrap' }}>{t.tiers.nog(fmt(toNext))}</span>
        </div>
        <Progress pct={pct}/>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:600,
          color:'var(--navy-60)', marginTop:7 }}>
          <span>{fmt(R.balance)} seeds</span>
          <span>{fmt(R.nextTier.threshold)} seeds</span>
        </div>
      </div>

      {/* stacked tier progression */}
      <div className="rr-stagger" style={{ display:'flex', flexDirection:'column', gap:18, marginTop:24,
        position:'relative' }}>
        {[...R.tiers].reverse().map((tier)=>{
          const idx = order.indexOf(tier.id);
          return (
            <TierCard key={tier.id} tier={tier}
              current={idx===curIdx} achieved={idx<curIdx} isNext={idx===curIdx+1}/>
          );
        })}
      </div>
    </div>
  );
}

export { Tiers, TierCard };
