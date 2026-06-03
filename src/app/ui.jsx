/* ───────────────── RootedRewards · shared UI ───────────────── */

/* Simple line/solid icons (functional UI glyphs only) */
function Icon({ name, size=24, stroke='currentColor', sw=2, fill='none' }){
  const p = { fill, stroke, strokeWidth:sw, strokeLinecap:'round', strokeLinejoin:'round' };
  const paths = {
    home:  <path d="M3 11.2 12 4l9 7.2V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" {...p}/>,
    ledger:<g {...p}><path d="M5 3h14a1 1 0 0 1 1 1v16l-3-2-2 2-2-2-2 2-2-2-3 2V4a1 1 0 0 1 1-1z"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/></g>,
    earn:  <g {...p}><path d="M12 21c-4.5-2.5-7-6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4-2.5 7.5-7 10z"/><path d="M12 8v9"/></g>,
    tiers: <g {...p}><path d="M12 3 21 8l-9 5-9-5 9-5z"/><path d="m4 12 8 4.5L20 12M4 16l8 4.5L20 16"/></g>,
    harvest:<g {...p}><circle cx="12" cy="13" r="4"/><path d="M12 3v3M12 22v-1M4.2 6.2l1.6 1.6M19.8 6.2l-1.6 1.6M3 13h2M19 13h2M5.5 19.5l1.4-1.4M18.5 19.5l-1.4-1.4"/></g>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" {...p}/>,
    bolt:  <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" fill={stroke} stroke="none"/>,
    check: <path d="M5 12.5 10 17l9-10" {...p}/>,
    lock:  <g {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></g>,
    sun:   <g {...p}><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4 12H1.5M22.5 12H20M5.6 5.6 7.4 7.4M16.6 16.6l1.8 1.8M18.4 5.6 16.6 7.4M7.4 16.6l-1.8 1.8"/></g>,
    calendar:<g {...p}><rect x="4" y="5" width="16" height="16" rx="2.5"/><path d="M4 9h16M8 3v4M16 3v4"/></g>,
    panel: <g {...p}><rect x="3.5" y="5" width="17" height="11" rx="1.5"/><path d="M3.5 9h17M9 5l-1 11M15 5l1 11M12 16v5M8.5 21h7"/></g>,
    leaf:  <path d="M5 19c0-8 6-13 14-13 0 8-5 14-13 14a8 8 0 0 1-1-1z" fill={stroke} stroke="none"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{display:'block'}}>{paths[name]}</svg>;
}

/* Seed currency mark — leaf in a soft disc */
function SeedMark({ size=22, tone='green' }){
  const bg = tone==='lime' ? 'rgba(200,230,0,0.22)' : 'rgba(0,166,81,0.14)';
  const fg = tone==='lime' ? '#6a7a00' : 'var(--green)';
  const inner = tone==='onGreen' ? 'rgba(255,255,255,0.22)' : bg;
  const leaf = tone==='onGreen' ? '#fff' : fg;
  return (
    <span style={{ width:size, height:size, borderRadius:'50%', background:inner,
      display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Icon name="leaf" size={size*0.6} stroke={leaf}/>
    </span>
  );
}

/* Animated count-up */
function useCountUp(target, dur=900){
  const [v,setV] = React.useState(0);
  React.useEffect(()=>{
    let raf, start;
    const step = (t)=>{ if(!start) start=t; const p=Math.min(1,(t-start)/dur);
      const e = 1-Math.pow(1-p,3); setV(Math.round(target*e));
      if(p<1) raf=requestAnimationFrame(step); };
    raf=requestAnimationFrame(step); return ()=>cancelAnimationFrame(raf);
  },[target]);
  return v;
}

const fmt = (n)=> n.toLocaleString('nl-NL');

/* Progress bar */
function Progress({ pct, lime=false, onGreen=false }){
  return (
    <div className={'rr-track'+(onGreen?' on-green':'')}>
      <div className={'rr-fill'+(lime?' lime':'')} style={{ width:Math.min(100,pct)+'%' }}/>
    </div>
  );
}

/* Screen header */
function ScreenHeader({ eyebrow, title }){
  return (
    <div style={{ padding:'6px 2px 16px' }}>
      <div className="rr-eyebrow" style={{ marginBottom:6 }}>{eyebrow}</div>
      <h1 className="rr-h1">{title}</h1>
    </div>
  );
}

Object.assign(window, { Icon, SeedMark, useCountUp, fmt, Progress, ScreenHeader });
