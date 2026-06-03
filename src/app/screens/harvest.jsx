/* ───────────────── Screen 5 · Harvest Hours ───────────────── */
const MONTH_FULL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const MONTH_ABBR = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const WEEKDAYS = ['ma','di','wo','do','vr','za','zo'];

function HarvestDay({ cell }){
  if(!cell) return <div/>;
  const base = { width:'100%', aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:13, fontWeight:700, borderRadius:11, position:'relative' };
  if(!cell.weekend){
    return <div style={{ ...base, color:'rgba(26,26,46,0.32)', fontWeight:600 }}>{cell.d}</div>;
  }
  const styles = {
    earned:   { background:'var(--green)', color:'#fff', boxShadow:'0 3px 8px rgba(0,166,81,0.30)' },
    missed:   { background:'rgba(26,26,46,0.07)', color:'var(--grey-2)' },
    upcoming: { background:'rgba(0,166,81,0.05)', color:'var(--green-700)', border:'1.5px dashed rgba(0,166,81,0.45)' },
  };
  return (
    <div style={{ ...base, ...styles[cell.state] }}>
      {cell.state==='earned'
        ? <Icon name="leaf" size={15} stroke="#fff"/>
        : cell.d}
      {cell.today && <span style={{ position:'absolute', bottom:3, width:4, height:4, borderRadius:'50%',
        background: cell.state==='earned'?'#fff':'var(--green)' }}/>}
    </div>
  );
}

function Harvest(){
  const R = window.RR;
  const H = R.harvest;
  const [sel, setSel] = React.useState(1); // default May (shows earned + missed)
  const month = H.monthsData[sel];

  return (
    <div className="rr-page">
      <ScreenHeader eyebrow="Apr – sep · weekends 12:00–17:00" title="Oogsturen"/>

      {/* Hero */}
      <div style={{ borderRadius:22, padding:'18px 18px 16px', position:'relative', overflow:'hidden',
        background:'linear-gradient(150deg,#1A1A2E 0%,#243a2f 60%,#0b5c34 100%)', color:'#fff',
        boxShadow:'0 16px 36px rgba(11,92,52,0.28)' }} className="rr-fadein">
        <div style={{ position:'absolute', right:-20, top:-20, opacity:0.5 }}>
          <Icon name="sun" size={120} stroke="rgba(200,230,0,0.30)" sw={1.4}/>
        </div>
        <div style={{ position:'relative' }}>
          <div style={{ fontWeight:800, fontSize:18, letterSpacing:-0.3, maxWidth:230 }}>
            Verdien seeds in het zonne-uur
          </div>
          <div style={{ fontSize:12.5, opacity:0.82, fontWeight:500, marginTop:7, maxWidth:250, lineHeight:1.5 }}>
            In het weekend tussen 12:00 en 17:00 (apr–sep) is er vaak een stroomoverschot. Verbruik of verschuif dan, en oogst seeds.
          </div>
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            {H.optedIn && (
              <span className="rr-pill" style={{ background:'rgba(200,230,0,0.22)', color:'#C8E600' }}>
                <Icon name="check" size={12} stroke="#C8E600" sw={2.6}/>Aangemeld: gratis stroom
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Season stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14 }}>
        <div className="rr-card" style={{ padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Icon name="sun" size={16} stroke="var(--green)" sw={2}/>
            <span style={{ fontSize:24, fontWeight:800, letterSpacing:-0.5 }}>{H.daysEarned}</span>
          </div>
          <div className="rr-sub" style={{ fontSize:11.5, fontWeight:600, marginTop:2 }}>Oogstdagen verdiend</div>
        </div>
        <div className="rr-card" style={{ padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <SeedMark size={20}/>
            <span style={{ fontSize:24, fontWeight:800, letterSpacing:-0.5, color:'var(--green)' }}>{fmt(H.seasonSeeds)}</span>
          </div>
          <div className="rr-sub" style={{ fontSize:11.5, fontWeight:600, marginTop:2 }}>Seeds dit seizoen</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="rr-card" style={{ padding:'16px 16px 18px', marginTop:14 }}>
        {/* month switcher */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <button onClick={()=>setSel(s=>Math.max(0,s-1))} disabled={sel===0}
            style={{ border:'none', background:'rgba(26,26,46,0.05)', borderRadius:10, width:32, height:32,
              cursor: sel===0?'default':'pointer', opacity: sel===0?0.35:1, display:'flex',
              alignItems:'center', justifyContent:'center', transform:'scaleX(-1)' }}>
            <Icon name="arrow" size={17} stroke="var(--navy)" sw={2.4} fill="none"/>
          </button>
          <div style={{ fontWeight:800, fontSize:15, textTransform:'capitalize', letterSpacing:-0.2 }}>
            {MONTH_FULL[month.m]} {H.year}
          </div>
          <button onClick={()=>setSel(s=>Math.min(H.monthsData.length-1,s+1))} disabled={sel===H.monthsData.length-1}
            style={{ border:'none', background:'rgba(26,26,46,0.05)', borderRadius:10, width:32, height:32,
              cursor: sel===H.monthsData.length-1?'default':'pointer', opacity: sel===H.monthsData.length-1?0.35:1,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="arrow" size={17} stroke="var(--navy)" sw={2.4}/>
          </button>
        </div>

        {/* weekday header */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, marginBottom:6 }}>
          {WEEKDAYS.map((w,i)=>(
            <div key={w} style={{ textAlign:'center', fontSize:10.5, fontWeight:700,
              color: i>=5?'var(--green)':'var(--grey-2)', textTransform:'uppercase', letterSpacing:0.3 }}>{w}</div>
          ))}
        </div>
        {/* grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5 }} key={sel} className="rr-fadein">
          {month.cells.map((c,i)=><HarvestDay key={i} cell={c}/>)}
        </div>

        {/* legend */}
        <div style={{ display:'flex', gap:14, justifyContent:'center', marginTop:16, flexWrap:'wrap' }}>
          {[
            { c:'var(--green)', l:'Verdiend' },
            { c:'rgba(26,26,46,0.12)', l:'Gemist' },
            { c:'transparent', l:'Aankomend', dash:true },
          ].map(x=>(
            <div key={x.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:13, height:13, borderRadius:5, background:x.c,
                border: x.dash?'1.5px dashed rgba(0,166,81,0.5)':'none' }}/>
              <span style={{ fontSize:11, fontWeight:600, color:'var(--navy-60)' }}>{x.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reward types */}
      <div className="rr-section-label" style={{ marginTop:22 }}>Twee manieren om te oogsten</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div className="rr-card" style={{ padding:'14px 16px', display:'flex', gap:13, alignItems:'center',
          border:'1.5px solid rgba(0,166,81,0.25)' }}>
          <span style={{ width:42, height:42, borderRadius:13, background:'rgba(0,166,81,0.12)', flexShrink:0,
            display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="bolt" size={22} stroke="var(--green)"/>
          </span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:13.5 }}>Aangemeld: gratis stroom</div>
            <div className="rr-sub" style={{ fontSize:12 }}>Verbruik in het venster — stroom is gratis</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--green)', fontWeight:800, fontSize:15 }}>
            +10<SeedMark size={16}/>
          </div>
        </div>
        <div className="rr-card" style={{ padding:'14px 16px', display:'flex', gap:13, alignItems:'center' }}>
          <span style={{ width:42, height:42, borderRadius:13, background:'rgba(200,230,0,0.22)', flexShrink:0,
            display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="arrow" size={22} stroke="#6a7a00"/>
          </span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:13.5 }}>Niet aangemeld: verschuiven</div>
            <div className="rr-sub" style={{ fontSize:12 }}>Verschuif verbruik naar het venster</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4, color:'#5f6d00', fontWeight:800, fontSize:15 }}>
            +20<SeedMark size={16} tone="lime"/>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div style={{ marginTop:16, background:'rgba(26,26,46,0.04)', borderRadius:16, padding:'14px 16px' }}>
        <div className="rr-eyebrow muted" style={{ marginBottom:10 }}>Vereisten</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <Icon name="panel" size={19} stroke="var(--green)" sw={1.9}/>
            <span className="rr-sub" style={{ fontSize:12.5, flex:1, color:'var(--navy)' }}>Zonnepanelen geregistreerd</span>
            <Icon name="check" size={16} stroke="var(--green)" sw={2.6}/>
          </div>
          <div className="rr-divider"/>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <Icon name="bolt" size={19} stroke="var(--green)"/>
            <span className="rr-sub" style={{ fontSize:12.5, flex:1, color:'var(--navy)' }}>Slimme meter met werkelijke standen (niet geschat)</span>
            <Icon name="check" size={16} stroke="var(--green)" sw={2.6}/>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Harvest, HarvestDay });
