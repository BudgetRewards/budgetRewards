import React from 'react'
import { useLang } from './i18n.jsx'
import { Icon } from './ui.jsx'
import { BTLogo } from './BTLogo.jsx'

/* ─── copy ─────────────────────────────────────────────── */
const C = {
  nl: {
    step1: {
      title: 'Welkom bij',
      subtitle: 'Vertel ons hoe we je mogen noemen en kies je taal.',
      nameLabel: 'Jouw naam', namePlaceholder: 'Bijv. Jan',
      langLabel: 'Taal',
    },
    step2: {
      title: 'Jouw producten',
      subtitle: 'Welke Budget Thuis-producten heb je?',
    },
    step3: {
      title: 'Jouw situatie',
      subtitle: 'Nog een paar vragen om je ervaring te personaliseren.',
      solarLabel: 'Heb je zonnepanelen?',
      batteryLabel: 'Heb je een thuisbatterij?',
      householdLabel: 'Hoeveel mensen wonen er bij jou?',
      yearsLabel: 'Hoe lang ben je al klant bij Budget Thuis?',
      yes: 'Ja', no: 'Nee',
      yearUnit: n => n === 0 ? 'Nieuw klant' : n === 1 ? '1 jaar' : `${n} jaar`,
      personUnit: n => n === 6 ? '6+' : `${n}`,
    },
    next: 'Volgende', back: 'Terug', finish: 'Aan de slag',
    of: 'van',
    products: {
      mobile:   { label: 'Mobiel',   emoji: '📱' },
      internet: { label: 'Internet', emoji: '🌐' },
      tv:       { label: 'TV',       emoji: '📺' },
      energy:   { label: 'Energie',  emoji: '⚡' },
    },
  },
  en: {
    step1: {
      title: 'Welcome to',
      subtitle: 'Tell us what to call you and choose your language.',
      nameLabel: 'Your name', namePlaceholder: 'E.g. Jan',
      langLabel: 'Language',
    },
    step2: {
      title: 'Your products',
      subtitle: 'Which Budget Thuis products do you have?',
    },
    step3: {
      title: 'Your situation',
      subtitle: 'A few more questions to personalise your experience.',
      solarLabel: 'Do you have solar panels?',
      batteryLabel: 'Do you have a home battery?',
      householdLabel: 'How many people live in your house?',
      yearsLabel: 'How long have you been a Budget Thuis customer?',
      yes: 'Yes', no: 'No',
      yearUnit: n => n === 0 ? 'New customer' : n === 1 ? '1 year' : `${n} years`,
      personUnit: n => n === 6 ? '6+' : `${n}`,
    },
    next: 'Next', back: 'Back', finish: 'Get started',
    of: 'of',
    products: {
      mobile:   { label: 'Mobile',   emoji: '📱' },
      internet: { label: 'Internet', emoji: '🌐' },
      tv:       { label: 'TV',       emoji: '📺' },
      energy:   { label: 'Energy',   emoji: '⚡' },
    },
  },
}

const PRODUCT_IDS = ['mobile', 'internet', 'tv', 'energy']
const TOTAL_STEPS = 3

/* ─── shared sub-components ─────────────────────────────── */
function FieldLabel({ children }) {
  return (
    <span style={{ fontSize:11, fontWeight:800, letterSpacing:0.8, textTransform:'uppercase', color:'var(--navy-60)' }}>
      {children}
    </span>
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

/* ─── steps ─────────────────────────────────────────────── */
function Step1({ name, setName, lang, setLang, c }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <FieldLabel>{c.step1.nameLabel}</FieldLabel>
        <input
          autoFocus value={name} onChange={e => setName(e.target.value)}
          placeholder={c.step1.namePlaceholder}
          style={{
            border:'1.5px solid var(--grey-line)', borderRadius:12, padding:'11px 14px',
            fontFamily:'inherit', fontSize:15, fontWeight:600, color:'var(--navy)',
            outline:'none', background:'#fff', transition:'border-color .15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--green)'}
          onBlur={e => e.target.style.borderColor = 'var(--grey-line)'}
        />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <FieldLabel>{c.step1.langLabel}</FieldLabel>
        <div style={{ display:'flex', gap:8 }}>
          {['nl','en'].map(l => (
            <button key={l} type="button" onClick={() => setLang(l)} style={{
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
  )
}

function Step2({ products, toggleProduct, c }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      {PRODUCT_IDS.map(id => {
        const on = products.includes(id)
        const p = c.products[id]
        return (
          <button key={id} type="button" onClick={() => toggleProduct(id)} style={{
            border: on ? '2px solid var(--green)' : '1.5px solid var(--grey-line)',
            borderRadius:16, padding:'16px 12px', background: on ? 'rgba(0,166,81,0.06)' : '#fff',
            fontFamily:'inherit', cursor:'pointer', transition:'all .15s',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
          }}>
            <span style={{ fontSize:28 }}>{p.emoji}</span>
            <span style={{ fontWeight:800, fontSize:13.5, color: on ? 'var(--green)' : 'var(--navy)' }}>
              {p.label}
            </span>
            {on && (
              <span style={{ width:18, height:18, borderRadius:'50%', background:'var(--green)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="check" size={11} stroke="#fff" sw={2.8}/>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function Step3({ profile, setField, c }) {
  const s3 = c.step3
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <FieldLabel>{s3.solarLabel}</FieldLabel>
        <YesNo value={profile.solarPanels} onChange={v => setField('solarPanels', v)} yes={s3.yes} no={s3.no}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <FieldLabel>{s3.batteryLabel}</FieldLabel>
        <YesNo value={profile.homeBattery} onChange={v => setField('homeBattery', v)} yes={s3.yes} no={s3.no}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <FieldLabel>{s3.householdLabel}</FieldLabel>
        <StyledSelect value={profile.householdSize} onChange={v => setField('householdSize', v)}>
          {[1,2,3,4,5,6].map(n => (
            <option key={n} value={n}>{s3.personUnit(n)}</option>
          ))}
        </StyledSelect>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <FieldLabel>{s3.yearsLabel}</FieldLabel>
        <StyledSelect value={profile.customerYears} onChange={v => setField('customerYears', v)}>
          {Array.from({ length: 21 }, (_, i) => (
            <option key={i} value={i}>{s3.yearUnit(i)}</option>
          ))}
        </StyledSelect>
      </div>
    </div>
  )
}

/* ─── main modal ─────────────────────────────────────────── */
export function OnboardingModal() {
  const { set, setUserName } = useLang()

  const [step, setStep] = React.useState(0)
  const [name, setName] = React.useState('')
  const [lang, setLang] = React.useState('nl')
  const [products, setProducts] = React.useState([])
  const [profile, setProfile] = React.useState({
    solarPanels: false, homeBattery: false, householdSize: 1, customerYears: 0,
  })

  const c = C[lang]
  const stepTitles = [c.step1.title, c.step2.title, c.step3.title]
  const stepSubtitles = [c.step1.subtitle, c.step2.subtitle, c.step3.subtitle]

  const canNext = step === 0 ? name.trim().length > 0 : true

  function toggleProduct(id) {
    setProducts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  function setField(key, value) {
    setProfile(p => ({ ...p, [key]: value }))
  }

  function handleNext(e) {
    e.preventDefault()
    if (!canNext) return
    if (step < TOTAL_STEPS - 1) { setStep(s => s + 1); return }
    // Final submit
    set(lang)
    setUserName(name.trim())
    localStorage.setItem('rr-profile', JSON.stringify({ ...profile, products }))
  }

  return (
    <div className="rr-onboarding-backdrop">
      <div className="rr-onboarding-card rr">
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <BTLogo width={48}/>
            <span style={{ fontWeight:800, fontSize:15, letterSpacing:-0.3 }}>
              Rooted<span style={{ color:'var(--green)' }}>Rewards</span>
            </span>
          </div>
          {/* Step indicator */}
          <span style={{ fontSize:11, fontWeight:700, color:'var(--navy-60)' }}>
            {step + 1} {c.of} {TOTAL_STEPS}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height:4, borderRadius:99, background:'var(--grey-line)', marginBottom:22, overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:99, background:'var(--green)',
            width:`${((step + 1) / TOTAL_STEPS) * 100}%`,
            transition:'width .35s cubic-bezier(.22,1,.36,1)',
          }}/>
        </div>

        <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, letterSpacing:-0.4, lineHeight:1.1 }}>
          {step === 0
            ? <>{stepTitles[0]} <span style={{ color:'var(--green)' }}>RootedRewards</span></>
            : stepTitles[step]}
        </h2>
        <p style={{ margin:'0 0 20px', fontSize:13, color:'var(--navy-60)', lineHeight:1.5 }}>
          {stepSubtitles[step]}
        </p>

        <form onSubmit={handleNext}>
          {step === 0 && <Step1 name={name} setName={setName} lang={lang} setLang={setLang} c={c}/>}
          {step === 1 && <Step2 products={products} toggleProduct={toggleProduct} c={c}/>}
          {step === 2 && <Step3 profile={profile} setField={setField} c={c}/>}

          <div style={{ display:'flex', gap:8, marginTop:22 }}>
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)} style={{
                border:'1.5px solid var(--grey-line)', borderRadius:14, padding:'13px 18px',
                background:'#fff', fontFamily:'inherit', fontWeight:800, fontSize:14,
                color:'var(--navy-60)', cursor:'pointer',
              }}>
                ← {c.back}
              </button>
            )}
            <button type="submit" disabled={!canNext} style={{
              flex:1, border:'none', borderRadius:14, padding:'14px',
              background: canNext ? 'var(--green)' : 'var(--grey-line)',
              color: canNext ? '#fff' : 'var(--grey-2)',
              fontFamily:'inherit', fontWeight:800, fontSize:14, letterSpacing:0.4,
              cursor: canNext ? 'pointer' : 'default', transition:'all .15s',
              boxShadow: canNext ? '0 6px 16px rgba(0,166,81,0.28)' : 'none',
            }}>
              {step < TOTAL_STEPS - 1 ? `${c.next} →` : `${c.finish} →`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
