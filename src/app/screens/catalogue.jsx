import React from 'react'
import { useRR, useTrigger } from '../store/RRContext.tsx'
import { Icon, SeedMark, ScreenHeader, Progress } from '../ui.jsx'
import { useT, useFmt, useLang } from '../i18n.jsx'

/* ───────────────── Screen 3 · Earn more (Catalogue) ───────────────── */
const STATUS_LABELS = {
  nl: { claimed:'Geclaimd', available:'Beschikbaar', missed:'Gemiste oogst', locked:'Vergrendeld' },
  en: { claimed:'Claimed',  available:'Available',   missed:'Missed Harvest', locked:'Locked' },
}

function StatusPill({ status }){
  const { lang } = useLang();
  const L = STATUS_LABELS[lang];
  if(status==='claimed')  return <span className="rr-pill claimed"><Icon name="check" size={12} stroke="var(--green-700)" sw={2.6}/>{L.claimed}</span>;
  if(status==='available')return <span className="rr-pill available" style={{ cursor:'pointer' }}>{L.available} →</span>;
  if(status==='missed')   return <span className="rr-pill" style={{ background:'rgba(26,26,46,0.07)', color:'var(--navy-60)' }}>{L.missed}</span>;
  return <span className="rr-pill locked"><Icon name="lock" size={11} stroke="var(--grey-2)" sw={2.2}/>{L.locked}</span>;
}

function TriggerRow({ item, catName, isLast, onClaim }){
  const fmt = useFmt();
  const { lang } = useLang();
  const [open, setOpen] = React.useState(false);
  const missed = item.status === 'missed';
  const canClaim = item.status === 'available';
  const displayName = lang === 'en' ? (item.nameEn ?? item.name) : item.name;
  const displayNeed = lang === 'en' ? (item.needEn ?? item.need) : item.need;
  const handleClick = () => {
    if (canClaim) { onClaim?.(); }
    else if (item.need) { setOpen(o => !o); }
  };
  return (
    <div>
      <div onClick={handleClick}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
          cursor: (canClaim || item.need) ? 'pointer' : 'default', opacity: item.status==='locked'?0.62:1 }}>
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:7 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
            <span style={{ fontWeight:700, fontSize:14, lineHeight:1.25 }}>{displayName}</span>
            {item.need && (
              <span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(26,26,46,0.08)',
                color:'var(--navy-60)', fontSize:10, fontWeight:800, display:'inline-flex',
                alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>i</span>
            )}
          </div>
          <div><StatusPill status={item.status}/></div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          <SeedMark size={18} tone={missed?'lime':'green'}/>
          <span style={{ fontWeight:800, fontSize:15, color: missed?'var(--navy-60)':'var(--navy)',
            fontVariantNumeric:'tabular-nums' }}>{missed?'':'+'}{fmt(item.seeds)}</span>
        </div>
      </div>
      {displayNeed && open && (
        <div className="rr-fadein" style={{ margin:'0 16px 13px 16px', background:'rgba(26,26,46,0.04)',
          borderRadius:12, padding:'10px 13px', display:'flex', gap:9, alignItems:'flex-start' }}>
          <Icon name={missed?'bolt':'lock'} size={15} stroke="var(--navy-60)" sw={2}/>
          <span className="rr-sub" style={{ fontSize:12, flex:1 }}>{displayNeed}</span>
        </div>
      )}
      {!isLast && <div className="rr-divider" style={{ marginLeft:16 }}/>}
    </div>
  );
}

/* ── Product bonus sub-section (sub-items under a claimed product) ── */
function ProductBonusSection({ items, catName, onClaim }) {
  const { lang } = useLang();
  const available = items.filter(i => i.status === 'available').length;
  return (
    <div style={{
      background:'rgba(200,230,0,0.06)',
      borderTop:'2px solid rgba(200,230,0,0.35)',
      borderLeft:'3px solid rgba(200,230,0,0.55)',
      marginLeft:16,
      borderRadius:'0 0 0 4px',
    }}>
      <div style={{
        padding:'9px 14px 3px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        <span style={{ fontSize:10, fontWeight:800, color:'#5a7200', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {lang === 'en' ? '⚡ Earn more' : '⚡ Verdien meer'}
        </span>
        {available > 0 && (
          <span style={{ fontSize:10, fontWeight:700, color:'#5a7200',
            background:'rgba(200,230,0,0.25)', borderRadius:8, padding:'2px 7px' }}>
            {available} {lang === 'en' ? 'available' : 'beschikbaar'}
          </span>
        )}
      </div>
      {items.map((item, i) => (
        <TriggerRow key={item.name} item={item} catName={catName}
          isLast={i === items.length - 1}
          onClaim={() => onClaim(item, catName)} />
      ))}
    </div>
  );
}

/* ── Single product row in Multi-product section ── */
function ProductRow({ product, bonusCat, lang, fmt, onActivate, onClaim, isLast }) {
  const isClaimed = product.status === 'claimed';
  const isMissed  = product.status === 'missed';
  const displayName = lang === 'en' ? (product.nameEn ?? product.name) : product.name;
  const bonusAvailable = isClaimed && bonusCat
    ? bonusCat.items.filter(i => i.status === 'available').length
    : 0;

  return (
    <div>
      <div
        onClick={() => isMissed && onActivate(product)}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
          cursor: isMissed ? 'pointer' : 'default',
          opacity: product.status === 'locked' ? 0.62 : 1 }}>
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:7 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontWeight:700, fontSize:14, lineHeight:1.25 }}>{displayName}</span>
            {isClaimed && bonusCat && bonusAvailable > 0 && (
              <span style={{ fontSize:11, color:'var(--green-700)', fontWeight:600,
                background:'rgba(120,220,0,0.12)', borderRadius:8, padding:'1px 7px' }}>
                +{bonusAvailable} {lang === 'en' ? 'opportunities' : 'kansen'}
              </span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {isMissed ? (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5,
                background:'var(--green)', color:'#fff', fontSize:12, fontWeight:800,
                borderRadius:99, padding:'6px 13px', boxShadow:'0 3px 9px rgba(0,166,81,0.32)' }}>
                {lang === 'en' ? 'Activate' : 'Activeer'}
                <Icon name="arrow" size={13} stroke="#fff" sw={2.8}/>
              </span>
            ) : (
              <StatusPill status={product.status}/>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          <SeedMark size={18} tone={isMissed ? 'lime' : 'green'}/>
          <span style={{ fontWeight:800, fontSize:15,
            color: isMissed ? 'var(--navy-60)' : 'var(--navy)',
            fontVariantNumeric:'tabular-nums' }}>
            {isMissed ? '' : '+'}{fmt(product.seeds)}
          </span>
        </div>
      </div>

      {/* Bonus sub-items — only when product is claimed */}
      {isClaimed && bonusCat && bonusCat.items.length > 0 && (
        <ProductBonusSection
          items={bonusCat.items}
          catName={bonusCat.cat}
          onClaim={onClaim}
        />
      )}

      {!isLast && <div className="rr-divider" style={{ marginLeft:16 }}/>}
    </div>
  );
}

/* ── Multi-product section with expandable sub-sections ── */
function MultiProductSection({ group, bonusCats, lang, fmt, trigger }) {
  const catLabel = lang === 'en' ? (group.catEn ?? group.cat) : group.cat;
  return (
    <div style={{ marginBottom:18 }}>
      <div className="rr-section-label">{catLabel}</div>
      <div className="rr-card" style={{ overflow:'hidden' }}>
        {group.items.map((product, i) => {
          const bonusCat = bonusCats.find(c => c.parentProduct === product.name);
          return (
            <ProductRow
              key={product.name}
              product={product}
              bonusCat={bonusCat}
              lang={lang}
              fmt={fmt}
              isLast={i === group.items.length - 1}
              onActivate={(p) => trigger.activateProduct(p, group.cat)}
              onClaim={(item, catName) => trigger.claimItem(item, catName)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Progress-to-next-tier dialog, sticky at the top of the Earn screen ── */
function EarnProgressBar(){
  const R = useRR();
  const t = useT();
  const fmt = useFmt();
  const { lang } = useLang();
  const curTier = R.tiers.find(tr => tr.id === R.currentTier);
  const curName = lang === 'en' ? curTier.nameEn : curTier.name;
  const hasNext = !!R.nextTier;
  const nextName  = hasNext ? (lang === 'en' ? R.nextTier.nameEn : R.nextTier.name) : null;
  const nextEmoji = hasNext ? (R.tiers.find(tr => tr.name === R.nextTier.name || tr.nameEn === R.nextTier.nameEn)?.emoji ?? '🌲') : null;
  const pct    = hasNext ? (R.balance / R.nextTier.threshold) * 100 : 100;
  const toNext = hasNext ? R.nextTier.threshold - R.balance : 0;
  return (
    <div style={{ position:'sticky', top:0, zIndex:5, background:'var(--grey)', paddingTop:4, paddingBottom:9 }}>
      <div className="rr-card" style={{ padding:'13px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
          <span style={{ fontWeight:800, fontSize:13, whiteSpace:'nowrap' }}>
            {curTier.emoji} {curName}{hasNext ? ` → ${nextEmoji} ${nextName}` : ''}
          </span>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--green)', whiteSpace:'nowrap' }}>
            {hasNext ? t.tiers.nog(fmt(toNext)) : (lang === 'en' ? 'Max tier' : 'Hoogste tier')}
          </span>
        </div>
        <Progress pct={pct}/>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:600,
          color:'var(--navy-60)', marginTop:6 }}>
          <span>{fmt(R.balance)} seeds</span>
          {hasNext && <span>{fmt(R.nextTier.threshold)} seeds</span>}
        </div>
      </div>
    </div>
  );
}

function CatalogueInner(){
  const R = useRR();
  const trigger = useTrigger();
  const t = useT();
  const { lang } = useLang();
  const fmt = useFmt();

  // Contract renewal is offered on the home screen, not claimed here.
  const RENEWAL_ITEM = 'Contract verlengd (1 jaar)';
  const catalogue = R.catalogue.map(cat => ({
    ...cat, items: cat.items.filter(i => i.name !== RENEWAL_ITEM),
  }));

  // Split catalogue into regular, multi-product, and bonus sub-categories.
  const bonusCats   = catalogue.filter(cat => cat.parentProduct);
  const multiCat    = catalogue.find(cat => cat.cat === 'Multi-product');
  const regularCats = catalogue.filter(cat => !cat.parentProduct && cat.cat !== 'Multi-product');

  const total = catalogue.reduce((s,g)=>s+g.items.filter(i=>i.status==='available').length, 0);

  return (
    <div className="rr-page">
      <ScreenHeader eyebrow={t.catalogue.eyebrow} title={t.catalogue.title}/>

      <EarnProgressBar/>

      <div className="rr-card rr-fadein" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
        background:'linear-gradient(120deg,#1A1A2E 0%,#2a2a45 100%)', color:'#fff' }}>
        <span style={{ width:40, height:40, borderRadius:12, background:'rgba(200,230,0,0.22)',
          display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon name="earn" size={22} stroke="#C8E600"/>
        </span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:14 }}>{t.catalogue.actionsReady(total)}</div>
          <div style={{ fontSize:12, opacity:0.7, fontWeight:500 }}>{t.catalogue.tierNote}</div>
        </div>
      </div>

      <div className="rr-stagger" style={{ marginTop:18 }}>
        {regularCats.map(group=>(
          <div key={group.cat} style={{ marginBottom:18 }}>
            <div className="rr-section-label">{lang === 'en' ? (group.catEn ?? group.cat) : group.cat}</div>
            <div className="rr-card" style={{ overflow:'hidden' }}>
              {group.items.map((item,i)=>(
                <TriggerRow key={item.name} item={item} catName={group.cat} isLast={i===group.items.length-1}
                  onClaim={() => trigger.claimItem(item, group.cat)}/>
              ))}
            </div>
          </div>
        ))}

        {multiCat && (
          <MultiProductSection
            group={multiCat}
            bonusCats={bonusCats}
            lang={lang}
            fmt={fmt}
            trigger={trigger}
          />
        )}
      </div>
    </div>
  );
}

const Catalogue = React.memo(CatalogueInner);
export { Catalogue, TriggerRow, StatusPill };
