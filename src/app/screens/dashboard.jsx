import React from 'react'
import { useRR, useTrigger } from '../store/RRContext.tsx'
import { Icon, SeedMark, useCountUp, Progress } from '../ui.jsx'
import { useT, useFmt, useLang, useProfile } from '../i18n.jsx'
import { BTLogo } from '../BTLogo.jsx'

/* Contract renewals offered on the home screen, per product the customer has. */
const RENEWALS = {
  electricity: { product: 'electricity', kind: 'elec',     seeds: 1000,
    name: 'Contract verlengd: Stroom',   nameEn: 'Contract renewed: Electricity' },
  internet:    { product: 'internet',    kind: 'internet', seeds: 1000,
    name: 'Contract verlengd: Internet', nameEn: 'Contract renewed: Internet' },
};

function RenewalCard({ kind, seeds, onRenew }){
  const t = useT();
  const r = t.renewal;
  return (
    <div className="rr-card rr-fadein" style={{ marginTop:14, padding:'15px 16px', display:'flex',
      alignItems:'center', gap:13, border:'1.5px solid rgba(0,166,81,0.30)',
      background:'linear-gradient(120deg, rgba(0,166,81,0.07), rgba(200,230,0,0.07))' }}>
      <span style={{ width:42, height:42, borderRadius:13, background:'rgba(0,166,81,0.14)', flexShrink:0,
        display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
        <Icon name="tiers" size={22} stroke="var(--green)"/>
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="rr-eyebrow" style={{ marginBottom:3 }}>{r.eyebrow}</div>
        <div style={{ fontWeight:800, fontSize:14 }}>{r[kind]}</div>
        <div className="rr-sub" style={{ fontSize:12 }}>{r.desc(seeds)}</div>
      </div>
      <button onClick={onRenew} style={{ border:'none', background:'var(--green)', color:'#fff',
        cursor:'pointer', fontFamily:'inherit', fontWeight:800, fontSize:12.5, borderRadius:12,
        padding:'10px 14px', flexShrink:0, boxShadow:'0 6px 16px rgba(0,166,81,0.28)' }}>
        {r.cta}
      </button>
    </div>
  );
}

/* ───────────────── Screen 1 · Dashboard ───────────────── */
function Logo({ light=false }){
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <BTLogo width={44}/>
      <span style={{ fontWeight:800, fontSize:15, letterSpacing:-0.2, color:light?'#fff':'var(--navy)' }}>
        Rooted<span style={{ color:light?'#C8E600':'var(--green)' }}>Rewards</span>
      </span>
    </div>
  );
}

function Dashboard({ onNav, onProfileOpen }){
  const R = useRR();
  const t = useT();
  const fmt = useFmt();
  const { lang } = useLang();

  const { userName } = useLang();
  const { products } = useProfile();
  const { renewProduct } = useTrigger();

  // The internet renewal appears a short while after the home screen opens.
  const [showInternet, setShowInternet] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setShowInternet(true), 10000);
    return () => clearTimeout(id);
  }, []);

  const elecOpen     = products.includes('electricity') && !R.renewals.includes('electricity');
  const internetOpen = products.includes('internet')    && !R.renewals.includes('internet') && showInternet;

  const tier = R.tiers.find(tr => tr.id === R.currentTier);
  const tierName = lang === 'en' ? tier.nameEn : tier.name;
  // At the top tier (Forest) there is no next tier, so nextTier is null.
  const atTopTier = !R.nextTier;
  const nextTierName = R.nextTier ? (lang === 'en' ? R.nextTier.nameEn : R.nextTier.name) : null;
  const nextTierEmoji = R.nextTier
    ? (R.tiers.find(tr => tr.name === R.nextTier.name || tr.nameEn === R.nextTier.nameEn)?.emoji ?? '🌲')
    : null;

  const bal = useCountUp(R.balance);
  const pct = R.nextTier ? (R.balance / R.nextTier.threshold) * 100 : 100;
  const toNext = R.nextTier ? R.nextTier.threshold - R.balance : 0;
  const availableCount = R.catalogue.reduce((s,g) => s + g.items.filter(i => i.status === 'available').length, 0);

  return (
    <div className="rr-page rr-stagger">
      <div className="rr-header" style={{ padding:'4px 0 14px' }}>
        <Logo/>
        <button onClick={onProfileOpen} style={{
          textAlign:'right', background:'none', border:'none', cursor:'pointer',
          fontFamily:'inherit', padding:0,
        }}>
          <div className="rr-sub" style={{ fontWeight:600 }}>{t.dashboard.greeting(new Date().getHours())}</div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.4, color:'var(--navy)' }}>{userName || R.user.name} 👋</div>
        </button>
      </div>

      {/* Hero balance card */}
      <div style={{ borderRadius:24, padding:'22px 20px 20px', position:'relative', overflow:'hidden',
        background:'linear-gradient(155deg,#00B85A 0%,#00A651 46%,#018a45 100%)',
        boxShadow:'0 18px 38px rgba(0,166,81,0.30)', color:'#fff' }}>
        <div style={{ position:'absolute', right:-40, top:-50, width:180, height:180, borderRadius:'50%',
          background:'rgba(255,255,255,0.08)' }}/>
        <div style={{ position:'absolute', right:18, top:18, width:90, height:90, borderRadius:'50%',
          background:'rgba(200,230,0,0.18)' }}/>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
          <div className="rr-eyebrow" style={{ color:'rgba(255,255,255,0.85)' }}>{t.dashboard.balance}</div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
            <span className="rr-eyebrow" style={{ color:'rgba(255,255,255,0.85)' }}>{t.dashboard.currentTier}</span>
            <div style={{ background:'rgba(255,255,255,0.16)', borderRadius:99, padding:'5px 11px',
              display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:800, letterSpacing:0.3,
              backdropFilter:'blur(4px)' }}>
              <span style={{ fontSize:15 }}>{tier.emoji}</span>{tierName} · {tier.mult}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:6, position:'relative' }}>
          <SeedMark size={30} tone="onGreen"/>
          <span style={{ fontSize:48, fontWeight:800, letterSpacing:-1.5, lineHeight:1 }}>{fmt(bal)}</span>
          <span style={{ fontSize:14, fontWeight:600, opacity:0.85, marginBottom:4 }}>{t.dashboard.seeds}</span>
        </div>

        <div style={{ marginTop:18, position:'relative' }}>
          {atTopTier ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              fontSize:13, fontWeight:700, opacity:0.95, padding:'2px 0' }}>
              <span>{t.dashboard.topTier}</span>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600,
                marginBottom:7, opacity:0.95 }}>
                <span>{t.dashboard.to} {nextTierEmoji} {nextTierName}</span>
                <span><b style={{ fontWeight:800 }}>{fmt(toNext)}</b> {t.dashboard.seedsToGo}</span>
              </div>
              <Progress pct={pct} lime onGreen/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:600,
                marginTop:7, opacity:0.8 }}>
                <span>{fmt(R.balance)}</span>
                <span>{fmt(R.nextTier.threshold)}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ marginTop:14, fontSize:11.5, fontWeight:500, opacity:0.82, position:'relative',
          display:'flex', alignItems:'center', gap:6 }}>
          <Icon name="calendar" size={14} stroke="rgba(255,255,255,0.85)" sw={2}/>
          {t.dashboard.period} {R.period.startLabel} – {R.period.endLabel}
        </div>
      </div>

      {/* Contract renewals (per product the customer has) */}
      {elecOpen && (
        <RenewalCard kind="elec" seeds={RENEWALS.electricity.seeds}
          onRenew={() => renewProduct('electricity', RENEWALS.electricity.name, RENEWALS.electricity.nameEn, RENEWALS.electricity.seeds)}/>
      )}
      {internetOpen && (
        <RenewalCard kind="internet" seeds={RENEWALS.internet.seeds}
          onRenew={() => renewProduct('internet', RENEWALS.internet.name, RENEWALS.internet.nameEn, RENEWALS.internet.seeds)}/>
      )}

      {/* Stat chips */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, marginTop:14 }}>
        <div className="rr-chip">
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="bolt" size={15} stroke="var(--green)"/>
            <span className="v">{R.multiplier.toLocaleString('nl-NL')}×</span>
          </div>
          <span className="l">{t.dashboard.multiplier}</span>
        </div>
        <div className="rr-chip">
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="sun" size={15} stroke="var(--green)" sw={2}/>
            <span className="v">{R.harvest.daysEarned}</span>
          </div>
          <span className="l">{t.dashboard.harvestDays}</span>
        </div>
        <div className="rr-chip">
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="calendar" size={15} stroke="var(--green)"/>
            <span className="v">{R.period.daysLeft}</span>
          </div>
          <span className="l">{t.dashboard.daysLeft}</span>
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
          <div style={{ fontWeight:800, fontSize:14 }}>{t.dashboard.earnMore}</div>
          <div className="rr-sub" style={{ fontSize:12 }}>{t.dashboard.actionsAvailable(availableCount)}</div>
        </div>
        <Icon name="arrow" size={20} stroke="var(--green)"/>
      </button>

      {/* Recent activity preview */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'24px 2px 10px' }}>
        <div className="rr-section-label" style={{ margin:0 }}>{t.dashboard.recentActivity}</div>
        <button onClick={()=>onNav('history')} style={{ border:'none', background:'none', cursor:'pointer',
          fontFamily:'inherit', color:'var(--green)', fontWeight:700, fontSize:12 }}>{t.dashboard.seeAll}</button>
      </div>
      <div className="rr-card" style={{ overflow:'hidden' }}>
        {R.ledger.slice(0,3).map((e,i)=>(
          <div key={e.id}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px' }}>
              <SeedMark size={30} tone={e.kind==='missed'?'lime':'green'}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {lang === 'en' ? (e.nameEn ?? e.name) : e.name}
                </div>
                <div className="rr-sub" style={{ fontSize:11.5 }}>{e.date}</div>
              </div>
              <div style={{ fontWeight:800, fontSize:15, color: e.kind==='missed'?'var(--navy-60)':'var(--green)' }}>
                {e.kind==='missed'?'':'+'}{fmt(e.amount)}
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
