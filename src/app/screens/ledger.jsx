/* ───────────────── Screen 2 · Seeds history (Ledger) ───────────────── */
function Ledger(){
  const R = window.RR;
  const [filter, setFilter] = React.useState('all');
  const filters = [
    { id:'all', label:'Alles' },
    { id:'pos', label:'Verdiend' },
    { id:'neg', label:'Boetes' },
  ];
  const rows = R.ledger.filter(e => filter==='all' ? true : e.kind===filter);
  const earned = R.ledger.filter(e=>e.kind==='pos').reduce((s,e)=>s+e.amount,0);
  const lost = R.ledger.filter(e=>e.kind==='neg').reduce((s,e)=>s+e.amount,0);

  return (
    <div className="rr-page">
      <ScreenHeader eyebrow="Seeds-grootboek" title="Historie"/>

      {/* Summary card */}
      <div className="rr-card rr-fadein" style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ flex:1 }}>
          <div className="rr-sub" style={{ fontSize:11.5, fontWeight:700 }}>Totaal verdiend</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
            <SeedMark size={22}/>
            <span style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, color:'var(--green)' }}>+{fmt(earned)}</span>
          </div>
        </div>
        <div style={{ width:1, alignSelf:'stretch', background:'var(--grey-line)' }}/>
        <div style={{ flex:1 }}>
          <div className="rr-sub" style={{ fontSize:11.5, fontWeight:700 }}>Boetes</div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, color:'var(--red)', marginTop:2 }}>{fmt(lost)}</div>
        </div>
      </div>

      {/* Filter segmented */}
      <div style={{ display:'flex', gap:7, margin:'16px 0 4px', background:'rgba(26,26,46,0.05)',
        padding:4, borderRadius:13 }}>
        {filters.map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{ flex:1, border:'none', cursor:'pointer',
            fontFamily:'inherit', fontWeight:700, fontSize:12.5, padding:'8px', borderRadius:10,
            background: filter===f.id?'#fff':'transparent', color: filter===f.id?'var(--navy)':'var(--navy-60)',
            boxShadow: filter===f.id?'0 1px 3px rgba(26,26,46,0.10)':'none', transition:'all .15s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="rr-card rr-stagger" style={{ overflow:'hidden', marginTop:14 }}>
        {rows.map((e,i)=>(
          <div key={e.id}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px' }}>
              <SeedMark size={34} tone={e.kind==='neg'?'lime':'green'}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{e.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3, flexWrap:'wrap' }}>
                  <span className="rr-sub" style={{ fontSize:11.5, whiteSpace:'nowrap' }}>{e.date}</span>
                  <span style={{ fontSize:10.5, fontWeight:700, color:'var(--navy-60)',
                    background:'rgba(26,26,46,0.05)', padding:'2px 7px', borderRadius:99,
                    fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                    {Math.abs(e.base)} × {e.mult.toLocaleString('nl-NL')}× = {Math.abs(e.amount)}
                  </span>
                </div>
              </div>
              <div style={{ fontWeight:800, fontSize:16, color: e.kind==='neg'?'var(--red)':'var(--green)',
                fontVariantNumeric:'tabular-nums' }}>
                {e.amount>0?'+':''}{fmt(e.amount)}
              </div>
            </div>
            {i<rows.length-1 && <div className="rr-divider" style={{ marginLeft:62 }}/>}
          </div>
        ))}
        {rows.length===0 && (
          <div style={{ padding:'30px', textAlign:'center' }} className="rr-sub">Geen transacties in deze categorie.</div>
        )}
      </div>

      <div className="rr-sub" style={{ fontSize:11, textAlign:'center', marginTop:16, padding:'0 20px' }}>
        Multiplier wordt toegepast op het moment van verdienen — op basis van je tier op dat moment.
      </div>
    </div>
  );
}

Object.assign(window, { Ledger });
