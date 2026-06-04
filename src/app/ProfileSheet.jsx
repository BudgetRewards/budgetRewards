import React from 'react'
import { useT, useLang } from './i18n.jsx'
import { BTLogo } from './BTLogo.jsx'
import { useTrigger } from './store/RRContext.tsx'

/* ─── reused from OnboardingModal ───────────────────────── */
const PRODUCT_IDS = ['electricity', 'gas', 'mobile', 'internet', 'tv', 'landline']

function ProductIcon({ id, size = 20 }) {
  const s = { display:'block', color:'currentColor' }
  if (id === 'electricity') return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}><path d="M8.0643 1.47107C8.25417 1.20993 8.66531 1.34486 8.66531 1.66829V6.66666H13.0004C13.2726 6.66666 13.4293 6.97354 13.2687 7.19446L7.93631 14.5289C7.74646 14.7901 7.33473 14.6551 7.33465 14.3317V9.33333H3.00025C2.72808 9.33333 2.5708 9.02647 2.73126 8.80556L8.0643 1.47107Z" fill="currentColor"/></svg>
  if (id === 'gas') return <svg width={size * 9/13} height={size} viewBox="0 0 9 13" fill="none" style={s}><path d="M3.60562 0C6.93348 2.40667 8.59727 4.81353 5.26937 8.42354C5.82404 8.42354 6.65587 8.42319 8.0425 6.93684C8.19209 7.40229 8.32 7.90279 8.32 8.42354C8.32 10.9158 6.45748 12.9362 4.16 12.9362C1.86249 12.9362 0 10.9158 0 8.42354C4.01588e-06 7.12764 0.503557 5.95934 1.31 5.1363C2.0545 4.37647 3.88294 3.00809 3.60562 0Z" fill="currentColor"/></svg>
  if (id === 'mobile') return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}><path d="M11.3335 12.6667H4.66664V8.00052H11.3335V12.6667ZM10.0001 1.33334H3.33694C2.96675 1.33334 2.6665 1.63349 2.6665 2.00377V13.9962C2.6665 14.3665 2.96675 14.6667 3.33694 14.6667H12.663C13.0333 14.6667 13.3335 14.3665 13.3335 13.9962V4.66693L10.0001 1.33334Z" fill="currentColor"/></svg>
  if (id === 'internet') return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}><path d="M8.00008 12C8.47607 12 8.91316 12.1663 9.25659 12.444L8.00008 14L6.74357 12.444C7.08701 12.1664 7.52411 12 8.00008 12Z" fill="currentColor"/><path d="M8.00008 8.66667C9.26952 8.66668 10.4352 9.11033 11.351 9.85091L10.0945 11.4069C9.5221 10.944 8.79352 10.6667 8.00008 10.6667C7.20665 10.6667 6.47804 10.944 5.90568 11.4069L4.64852 9.85091C5.56431 9.11024 6.73055 8.66667 8.00008 8.66667Z" fill="currentColor"/><path d="M8.00008 5.33333C10.0631 5.33335 11.9579 6.05435 13.446 7.25781L12.1889 8.8138C11.0442 7.88808 9.58699 7.33335 8.00008 7.33333C6.4132 7.33333 4.95602 7.8881 3.81128 8.8138L2.55412 7.25781C4.04229 6.05434 5.93711 5.33333 8.00008 5.33333Z" fill="currentColor"/><path d="M8.00008 2C10.8565 2.00002 13.4799 2.99836 15.5404 4.66471L14.2839 6.22005C12.5668 4.83143 10.3804 4.00002 8.00008 4C5.61973 4 3.43335 4.83142 1.71623 6.22005L0.459717 4.66471C2.52026 2.99835 5.14365 2 8.00008 2Z" fill="currentColor"/></svg>
  if (id === 'tv') return <svg width={size * 14/13} height={size} viewBox="0 0 14 13" fill="none" style={s}><path d="M11.3333 12.6667H2V11.3333H11.3333V12.6667Z" fill="currentColor"/><path d="M12.6719 0C13.0371 0 13.3333 0.296491 13.3333 0.667318V9.99935C13.3333 10.3679 13.0295 10.6667 12.6719 10.6667H0.661458C0.296292 10.6667 0 10.3702 0 9.99935V0.667318C0 0.298811 0.303798 0 0.661458 0H12.6719Z" fill="currentColor"/></svg>
  if (id === 'landline') return <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={s}><path d="M4.58008 0C4.83676 0 5.05138 0.194815 5.07715 0.450195C5.10027 0.679229 5.12173 0.86316 5.1416 1.00195C5.34388 2.41461 5.75749 3.75929 6.34863 5.00293C6.44351 5.20252 6.38195 5.44183 6.20215 5.57031L4.04395 7.11133C5.35792 10.1806 7.81937 12.6421 10.8887 13.9561L12.4268 11.8018C12.5569 11.6198 12.799 11.5574 13.001 11.6533C14.2446 12.244 15.5895 12.6566 17.002 12.8584C17.1398 12.8782 17.3225 12.8999 17.5498 12.9229C17.8052 12.9486 18 13.1633 18 13.4199V16.9561C18 17.4811 17.5939 17.9171 17.0703 17.9541C16.633 17.985 16.2763 18 16 18C7.1634 18 0 10.8366 0 2C0 1.72376 0.0150087 1.36696 0.0458984 0.929688C0.0829184 0.406067 0.519025 0 1.04395 0H4.58008Z" fill="currentColor"/></svg>
  return null
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:800, letterSpacing:0.9, textTransform:'uppercase',
      color:'var(--navy-60)', margin:'22px 0 10px' }}>
      {children}
    </div>
  )
}

function YesNo({ value, onChange, yes, no }) {
  const btn = (v, label) => (
    <button type="button" onClick={() => onChange(v)} style={{
      flex:1, border: value === v ? '2px solid var(--green)' : '1.5px solid var(--grey-line)',
      borderRadius:11, padding:'10px 0', background: value === v ? 'rgba(0,166,81,0.07)' : '#fff',
      fontFamily:'inherit', fontWeight:800, fontSize:13, cursor:'pointer',
      color: value === v ? 'var(--green)' : 'var(--navy-60)', transition:'all .15s',
    }}>{label}</button>
  )
  return <div style={{ display:'flex', gap:8 }}>{btn(true, yes)}{btn(false, no)}</div>
}

function StyledSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={e => onChange(Number(e.target.value))} style={{
      width:'100%', border:'1.5px solid var(--grey-line)', borderRadius:12, padding:'11px 14px',
      fontFamily:'inherit', fontSize:15, fontWeight:600, color:'var(--navy)',
      background:'#fff', outline:'none', appearance:'none',
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239a9aa6' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center',
    }}>
      {children}
    </select>
  )
}

const YEARS = Array.from({ length: 27 }, (_, i) => 2000 + i).reverse() // 2026 → 2000

function RadioGroup({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {options.map(opt => {
        const on = value === opt.value
        return (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)} style={{
            border: on ? '2px solid var(--green)' : '1.5px solid var(--grey-line)',
            borderRadius:12, padding:'11px 14px', background: on ? 'rgba(0,166,81,0.07)' : '#fff',
            fontFamily:'inherit', fontWeight:700, fontSize:13.5, cursor:'pointer',
            color: on ? 'var(--green)' : 'var(--navy)', transition:'all .15s',
            textAlign:'left', display:'flex', alignItems:'center', gap:10,
          }}>
            <span style={{
              width:18, height:18, borderRadius:'50%', flexShrink:0,
              border: on ? '5px solid var(--green)' : '2px solid var(--grey-line)',
              background: '#fff', transition:'all .15s',
            }}/>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function NumberInput({ value, onChange, placeholder }) {
  return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} style={{
        width:'100%', border:'1.5px solid var(--grey-line)', borderRadius:12, padding:'11px 14px',
        fontFamily:'inherit', fontSize:15, fontWeight:600, color:'var(--navy)',
        background:'#fff', outline:'none', appearance:'none',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--green)'}
      onBlur={e => e.target.style.borderColor = 'var(--grey-line)'}
    />
  )
}

function YearSelect({ value, onChange, placeholder }) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} style={{
      width:'100%', border:'1.5px solid var(--grey-line)', borderRadius:12, padding:'11px 14px',
      fontFamily:'inherit', fontSize:15, fontWeight:600, color: value ? 'var(--navy)' : 'var(--grey-2)',
      background:'#fff', outline:'none', appearance:'none',
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239a9aa6' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center',
    }}>
      <option value="">{placeholder}</option>
      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  )
}

function SubField({ label, children, hint }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:12 }}>
      <span style={{ fontSize:11, fontWeight:700, color:'var(--navy-60)', letterSpacing:0.4 }}>
        {label}{hint && <span style={{ fontWeight:500, fontStyle:'italic', marginLeft:4 }}>— {hint}</span>}
      </span>
      {children}
    </div>
  )
}

const MORE_SEEDS = 75

function MoreAboutYou({ profile, setProfile }) {
  const t = useT()
  const m = t.profile.more
  const { claimNotification } = useTrigger()

  function update(key, value) {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const wasCompleted = profile.moreCompleted
    setProfile(prev => ({ ...prev, moreCompleted: true }))
    if (!wasCompleted) {
      claimNotification(
        'Profiel aangevuld', 'Profile completed',
        'App & Data', MORE_SEEDS,
      )
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <p style={{ fontSize:13, color:'var(--navy-60)', lineHeight:1.5, margin:'0 0 16px' }}>
        {m.subtitle}
      </p>

      {/* Battery */}
      <SectionLabel>{m.battery.section}</SectionLabel>
      <YesNo value={profile.homeBattery} onChange={v => update('homeBattery', v)} yes={m.yes} no={m.no}/>
      {profile.homeBattery && (
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:10,
          background:'rgba(0,166,81,0.05)', borderRadius:14, padding:'14px' }}>
          <SubField label={m.battery.kwhLabel}>
            <NumberInput value={profile.batteryKwh} onChange={v => update('batteryKwh', v)} placeholder={m.battery.kwhPlaceholder}/>
          </SubField>
          <SubField label={m.battery.sinceLabel}>
            <YearSelect value={profile.batterySince} onChange={v => update('batterySince', v)} placeholder={m.selectYear}/>
          </SubField>
        </div>
      )}

      {/* Solar */}
      <SectionLabel>{m.solar.section}</SectionLabel>
      <YesNo value={profile.solarPanels} onChange={v => update('solarPanels', v)} yes={m.yes} no={m.no}/>
      {profile.solarPanels && (
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:10,
          background:'rgba(0,166,81,0.05)', borderRadius:14, padding:'14px' }}>
          <SubField label={m.solar.countLabel}>
            <NumberInput value={profile.solarCount} onChange={v => update('solarCount', v)} placeholder={m.solar.countPlaceholder}/>
          </SubField>
          <SubField label={m.solar.sinceLabel}>
            <YearSelect value={profile.solarSince} onChange={v => update('solarSince', v)} placeholder={m.selectYear}/>
          </SubField>
          <SubField label={m.solar.wpLabel} hint={m.solar.wpHint}>
            <NumberInput value={profile.solarWp} onChange={v => update('solarWp', v)} placeholder={m.solar.wpPlaceholder}/>
          </SubField>
        </div>
      )}

      {/* Heating */}
      <SectionLabel>{m.heating.section}</SectionLabel>
      <p style={{ fontSize:13, color:'var(--navy)', fontWeight:600, margin:'0 0 10px' }}>{m.heating.question}</p>
      <RadioGroup options={m.heating.options} value={profile.heatingType} onChange={v => update('heatingType', v)}/>
      {profile.heatingType === 'heatpump' && (
        <div style={{ marginTop:10, background:'rgba(0,166,81,0.05)', borderRadius:14, padding:'14px' }}>
          <SubField label={m.heating.heatpumpSinceLabel}>
            <YearSelect value={profile.heatpumpSince} onChange={v => update('heatpumpSince', v)} placeholder={m.selectYear}/>
          </SubField>
        </div>
      )}

      {/* Car */}
      <SectionLabel>{m.car.section}</SectionLabel>
      <p style={{ fontSize:13, color:'var(--navy)', fontWeight:600, margin:'0 0 10px' }}>{m.car.question}</p>
      <RadioGroup options={m.car.options} value={profile.evType} onChange={v => update('evType', v)}/>
      {(profile.evType === 'full' || profile.evType === 'hybrid') && (
        <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:10,
          background:'rgba(0,166,81,0.05)', borderRadius:14, padding:'14px' }}>
          <p style={{ fontSize:13, color:'var(--navy)', fontWeight:600, margin:0 }}>{m.car.chargingQuestion}</p>
          <RadioGroup options={m.car.chargingOptions} value={profile.evCharging} onChange={v => update('evCharging', v)}/>
        </div>
      )}

      {/* Save */}
      <button onClick={handleSave} style={{
        marginTop:20, border:'none', borderRadius:14, padding:'14px',
        background:'var(--green)', color:'#fff',
        fontFamily:'inherit', fontWeight:800, fontSize:14, letterSpacing:0.4,
        cursor:'pointer', boxShadow:'0 6px 16px rgba(0,166,81,0.28)',
      }}>
        {m.closing.save}
      </button>

      {/* Completion card */}
      {profile.moreCompleted && (
        <div style={{ marginTop:14, background:'rgba(0,166,81,0.08)', borderRadius:14,
          padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>✅</span>
          <div>
            <div style={{ fontWeight:800, fontSize:13.5, color:'var(--navy)' }}>{m.closing.title}</div>
            <div style={{ fontSize:12.5, color:'var(--green)', fontWeight:700, marginTop:2 }}>
              {m.closing.seedsEarned(MORE_SEEDS)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── main sheet ─────────────────────────────────────────── */
export function ProfileSheet({ onClose }) {
  const t = useT()
  const { lang, set, userName, setUserName, profile, setProfile } = useLang()
  const p = t.profile

  const [name, setName] = React.useState(userName)

  function updateProfile(key, value) {
    setProfile({ ...profile, [key]: value })
  }

  function toggleProduct(id) {
    const products = profile.products.includes(id)
      ? profile.products.filter(x => x !== id)
      : [...profile.products, id]
    setProfile({ ...profile, products })
  }

  function saveName() {
    if (name.trim()) setUserName(name.trim())
  }

  return (
    <div style={{ position:'absolute', inset:0, zIndex:60 }}>
      {/* backdrop — full screen */}
      <div onClick={onClose} style={{
        position:'absolute', inset:0, background:'rgba(0,0,0,0.35)',
      }}/>

      {/* panel — anchored to bottom */}
      <div className="rr rr-profile-panel" style={{
        position:'absolute', bottom:0, left:0, right:0,
      }}>
        {/* handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 6px' }}>
          <div style={{ width:36, height:4, borderRadius:99, background:'var(--grey-2)', opacity:0.4 }}/>
        </div>

        {/* header — white card on grey background */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'12px 20px 14px', background:'#fff',
          borderBottom:'1px solid var(--grey-line)' }}>
          <BTLogo width={40}/>
          <span style={{ fontWeight:800, fontSize:18, letterSpacing:-0.4 }}>{p.title}</span>
          <button onClick={onClose} style={{
            background:'none', border:'none', cursor:'pointer', fontSize:22,
            color:'var(--grey-2)', lineHeight:1, padding:4,
          }}>×</button>
        </div>

        {/* scrollable content */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 20px 32px' }}>

          {/* ── Personal ── */}
          <SectionLabel>{p.personalSection}</SectionLabel>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--navy-60)', letterSpacing:0.4 }}>{p.nameLabel}</span>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder={p.namePlaceholder}
                style={{
                  border:'1.5px solid var(--grey-line)', borderRadius:12, padding:'11px 14px',
                  fontFamily:'inherit', fontSize:15, fontWeight:600, color:'var(--navy)',
                  outline:'none', background:'#fff', transition:'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--green)'}
                onBlurCapture={e => e.target.style.borderColor = 'var(--grey-line)'}
              />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--navy-60)', letterSpacing:0.4 }}>{p.langLabel}</span>
              <div style={{ display:'flex', gap:8 }}>
                {['nl','en'].map(l => (
                  <button key={l} type="button" onClick={() => set(l)} style={{
                    flex:1, border: lang === l ? '2px solid var(--green)' : '1.5px solid var(--grey-line)',
                    borderRadius:12, padding:'10px 0', background: lang === l ? 'rgba(0,166,81,0.07)' : '#fff',
                    fontFamily:'inherit', fontWeight:800, fontSize:13, cursor:'pointer',
                    color: lang === l ? 'var(--green)' : 'var(--navy-60)',
                    transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  }}>
                    <span style={{ fontSize:16 }}>{l === 'nl' ? '🇳🇱' : '🇬🇧'}</span>
                    {l === 'nl' ? 'Nederlands' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Products ── */}
          <SectionLabel>{p.productsSection}</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {PRODUCT_IDS.map(id => {
              const on = profile.products?.includes(id)
              const labels = {
                electricity: lang === 'en' ? 'Electricity' : 'Stroom',
                gas:         'Gas',
                mobile:      lang === 'en' ? 'Mobile' : 'Mobiel',
                internet:    'Internet',
                tv:          'TV',
                landline:    lang === 'en' ? 'Landline' : 'Vaste lijn',
              }
              return (
                <button key={id} type="button" onClick={() => toggleProduct(id)} style={{
                  border: on ? '2px solid var(--green)' : '1.5px solid var(--grey-line)',
                  borderRadius:14, padding:'13px 8px 11px',
                  background: on ? 'rgba(0,166,81,0.06)' : '#fff',
                  fontFamily:'inherit', cursor:'pointer', transition:'all .15s',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:7,
                  color: on ? 'var(--green)' : 'var(--navy)', position:'relative',
                }}>
                  <ProductIcon id={id} size={20}/>
                  <span style={{ fontWeight:800, fontSize:11 }}>{labels[id]}</span>
                  {on && (
                    <span style={{ position:'absolute', top:5, right:5, width:12, height:12,
                      borderRadius:'50%', background:'var(--green)',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="7" height="6" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Home situation ── */}
          <SectionLabel>{p.homeSection}</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--navy-60)', letterSpacing:0.4 }}>{p.solarLabel}</span>
              <YesNo value={profile.solarPanels} onChange={v => updateProfile('solarPanels', v)} yes={p.yes} no={p.no}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--navy-60)', letterSpacing:0.4 }}>{p.batteryLabel}</span>
              <YesNo value={profile.homeBattery} onChange={v => updateProfile('homeBattery', v)} yes={p.yes} no={p.no}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--navy-60)', letterSpacing:0.4 }}>{p.householdLabel}</span>
              <StyledSelect value={profile.householdSize} onChange={v => updateProfile('householdSize', v)}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{p.personUnit(n)}</option>)}
              </StyledSelect>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--navy-60)', letterSpacing:0.4 }}>{p.yearsLabel}</span>
              <StyledSelect value={profile.customerYears} onChange={v => updateProfile('customerYears', v)}>
                {Array.from({ length: 21 }, (_, i) => <option key={i} value={i}>{p.yearUnit(i)}</option>)}
              </StyledSelect>
            </div>
          </div>

          {/* ── More about you ── */}
          <SectionLabel>{p.moreSection}</SectionLabel>
          <MoreAboutYou profile={profile} setProfile={setProfile}/>

        </div>
      </div>
    </div>
  )
}
