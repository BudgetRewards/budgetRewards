import React from 'react'
import RR from '../data.jsx'
import { Icon, SeedMark, fmt, ScreenHeader } from '../ui.jsx'

/* ───────────────── Screen 3 · Earn more (Catalogue) ───────────────── */
function StatusPill({ status }){
  if(status==='claimed')  return <span className="rr-pill claimed"><Icon name="check" size={12} stroke="var(--green-700)" sw={2.6}/>Geclaimd</span>;
  if(status==='available')return <span className="rr-pill available">Beschikbaar</span>;
  if(status==='penalty')  return <span className="rr-pill" style={{ background:'rgba(226,70,63,0.12)', color:'var(--red)' }}>Boete</span>;
  return <span className="rr-pill locked"><Icon name="lock" size={11} stroke="var(--grey-2)" sw={2.2}/>Vergrendeld</span>;
}

function TriggerRow({ item, isLast }){
  const [open, setOpen] = React.useState(false);
  const locked = item.status==='locked' || item.status==='penalty';
  const neg = item.seeds < 0;
  return (
    <div>
      <div onClick={()=> item.need && setOpen(o=>!o)}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
          cursor: item.need?'pointer':'default', opacity: item.status==='locked'?0.62:1 }}>
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:7 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
            <span style={{ fontWeight:700, fontSize:14, lineHeight:1.25 }}>{item.name}</span>
            {item.need && (
              <span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(26,26,46,0.08)',
                color:'var(--navy-60)', fontSize:10, fontWeight:800, display:'inline-flex',
                alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>i</span>
            )}
          </div>
          <div><StatusPill status={item.status}/></div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          <SeedMark size={18} tone={neg?'lime':'green'}/>
          <span style={{ fontWeight:800, fontSize:15, color: neg?'var(--red)':'var(--navy)',
            fontVariantNumeric:'tabular-nums' }}>{neg?'':'+'}{fmt(item.seeds)}</span>
        </div>
      </div>
      {item.need && open && (
        <div className="rr-fadein" style={{ margin:'0 16px 13px 16px', background:'rgba(26,26,46,0.04)',
          borderRadius:12, padding:'10px 13px', display:'flex', gap:9, alignItems:'flex-start' }}>
          <Icon name={item.status==='penalty'?'bolt':'lock'} size={15}
            stroke={item.status==='penalty'?'var(--red)':'var(--navy-60)'} sw={2}/>
          <span className="rr-sub" style={{ fontSize:12, flex:1 }}>{item.need}</span>
        </div>
      )}
      {!isLast && <div className="rr-divider" style={{ marginLeft:16 }}/>}
    </div>
  );
}

function Catalogue(){
  const R = RR;
  const total = R.catalogue.reduce((s,g)=>s+g.items.filter(i=>i.status==='available').length,0);
  return (
    <div className="rr-page">
      <ScreenHeader eyebrow="Catalogus" title="Verdienen"/>

      <div className="rr-card rr-fadein" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
        background:'linear-gradient(120deg,#1A1A2E 0%,#2a2a45 100%)', color:'#fff' }}>
        <span style={{ width:40, height:40, borderRadius:12, background:'rgba(200,230,0,0.22)',
          display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon name="earn" size={22} stroke="#C8E600"/>
        </span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:14 }}>{total} acties klaar om te claimen</div>
          <div style={{ fontSize:12, opacity:0.7, fontWeight:500 }}>Elke seed telt 1,5× mee in jouw Boom-tier</div>
        </div>
      </div>

      <div className="rr-stagger" style={{ marginTop:18 }}>
        {R.catalogue.map(group=>(
          <div key={group.cat} style={{ marginBottom:18 }}>
            <div className="rr-section-label">{group.cat}</div>
            <div className="rr-card" style={{ overflow:'hidden' }}>
              {group.items.map((item,i)=>(
                <TriggerRow key={item.name} item={item} isLast={i===group.items.length-1}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Catalogue, TriggerRow, StatusPill };
