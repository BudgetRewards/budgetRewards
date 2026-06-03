import React from 'react'
import { useLang } from './i18n.jsx'
import { Icon } from './ui.jsx'
import { BTLogo } from './BTLogo.jsx'
import { useTrigger } from './store/RRContext.tsx'

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
      electricity: { label: 'Stroom'    },
      gas:         { label: 'Gas'       },
      mobile:      { label: 'Mobiel'    },
      internet:    { label: 'Internet'  },
      tv:          { label: 'TV'        },
      landline:    { label: 'Vaste lijn'},
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
      electricity: { label: 'Electricity' },
      gas:         { label: 'Gas'         },
      mobile:      { label: 'Mobile'      },
      internet:    { label: 'Internet'    },
      tv:          { label: 'TV'          },
      landline:    { label: 'Landline'    },
    },
  },
}

/* ─── product icons ──────────────────────────────────────── */
function ProductIcon({ id, size = 22 }) {
  const s = { display:'block', color:'currentColor' }
  if (id === 'electricity') return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}>
      <path d="M8.0643 1.47107C8.25417 1.20993 8.66531 1.34486 8.66531 1.66829V6.66666H13.0004C13.2726 6.66666 13.4293 6.97354 13.2687 7.19446L7.93631 14.5289C7.74646 14.7901 7.33473 14.6551 7.33465 14.3317V9.33333H3.00025C2.72808 9.33333 2.5708 9.02647 2.73126 8.80556L8.0643 1.47107Z" fill="currentColor"/>
    </svg>
  )
  if (id === 'gas') return (
    <svg width={size * 9/13} height={size} viewBox="0 0 9 13" fill="none" style={s}>
      <path d="M3.60562 0C6.93348 2.40667 8.59727 4.81353 5.26937 8.42354C5.82404 8.42354 6.65587 8.42319 8.0425 6.93684C8.19209 7.40229 8.32 7.90279 8.32 8.42354C8.32 10.9158 6.45748 12.9362 4.16 12.9362C1.86249 12.9362 0 10.9158 0 8.42354C4.01588e-06 7.12764 0.503557 5.95934 1.31 5.1363C2.0545 4.37647 3.88294 3.00809 3.60562 0Z" fill="currentColor"/>
    </svg>
  )
  if (id === 'mobile') return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}>
      <path d="M11.3335 12.6667H4.66664V8.00052H11.3335V12.6667ZM10.0001 1.33334H3.33694C2.96675 1.33334 2.6665 1.63349 2.6665 2.00377V13.9962C2.6665 14.3665 2.96675 14.6667 3.33694 14.6667H12.663C13.0333 14.6667 13.3335 14.3665 13.3335 13.9962V4.66693L10.0001 1.33334Z" fill="currentColor"/>
    </svg>
  )
  if (id === 'internet') return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}>
      <path d="M8.00008 12C8.47607 12 8.91316 12.1663 9.25659 12.444L8.00008 14L6.74357 12.444C7.08701 12.1664 7.52411 12 8.00008 12Z" fill="currentColor"/>
      <path d="M8.00008 8.66667C9.26952 8.66668 10.4352 9.11033 11.351 9.85091L10.0945 11.4069C9.5221 10.944 8.79352 10.6667 8.00008 10.6667C7.20665 10.6667 6.47804 10.944 5.90568 11.4069L4.64852 9.85091C5.56431 9.11024 6.73055 8.66667 8.00008 8.66667Z" fill="currentColor"/>
      <path d="M8.00008 5.33333C10.0631 5.33335 11.9579 6.05435 13.446 7.25781L12.1889 8.8138C11.0442 7.88808 9.58699 7.33335 8.00008 7.33333C6.4132 7.33333 4.95602 7.8881 3.81128 8.8138L2.55412 7.25781C4.04229 6.05434 5.93711 5.33333 8.00008 5.33333Z" fill="currentColor"/>
      <path d="M8.00008 2C10.8565 2.00002 13.4799 2.99836 15.5404 4.66471L14.2839 6.22005C12.5668 4.83143 10.3804 4.00002 8.00008 4C5.61973 4 3.43335 4.83142 1.71623 6.22005L0.459717 4.66471C2.52026 2.99835 5.14365 2 8.00008 2Z" fill="currentColor"/>
    </svg>
  )
  if (id === 'tv') return (
    <svg width={size * 14/13} height={size} viewBox="0 0 14 13" fill="none" style={s}>
      <path d="M11.3333 12.6667H2V11.3333H11.3333V12.6667Z" fill="currentColor"/>
      <path d="M12.6719 0C13.0371 0 13.3333 0.296491 13.3333 0.667318V9.99935C13.3333 10.3679 13.0295 10.6667 12.6719 10.6667H0.661458C0.296292 10.6667 0 10.3702 0 9.99935V0.667318C0 0.298811 0.303798 0 0.661458 0H12.6719Z" fill="currentColor"/>
    </svg>
  )
  if (id === 'landline') return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={s}>
      <path d="M4.58008 0C4.83676 0 5.05138 0.194815 5.07715 0.450195C5.10027 0.679229 5.12173 0.86316 5.1416 1.00195C5.34388 2.41461 5.75749 3.75929 6.34863 5.00293C6.44351 5.20252 6.38195 5.44183 6.20215 5.57031L4.04395 7.11133C5.35792 10.1806 7.81937 12.6421 10.8887 13.9561L12.4268 11.8018C12.5569 11.6198 12.799 11.5574 13.001 11.6533C14.2446 12.244 15.5895 12.6566 17.002 12.8584C17.1398 12.8782 17.3225 12.8999 17.5498 12.9229C17.8052 12.9486 18 13.1633 18 13.4199V16.9561C18 17.4811 17.5939 17.9171 17.0703 17.9541C16.633 17.985 16.2763 18 16 18C7.1634 18 0 10.8366 0 2C0 1.72376 0.0150087 1.36696 0.0458984 0.929688C0.0829184 0.406067 0.519025 0 1.04395 0H4.58008Z" fill="currentColor"/>
    </svg>
  )
  return null
}

const PRODUCT_IDS = ['electricity', 'gas', 'mobile', 'internet', 'tv', 'landline']
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
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
      {PRODUCT_IDS.map(id => {
        const on = products.includes(id)
        const p = c.products[id]
        return (
          <button key={id} type="button" onClick={() => toggleProduct(id)} style={{
            border: on ? '2px solid var(--green)' : '1.5px solid var(--grey-line)',
            borderRadius:14, padding:'14px 8px 12px', background: on ? 'rgba(0,166,81,0.06)' : '#fff',
            fontFamily:'inherit', cursor:'pointer', transition:'all .15s',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            color: on ? 'var(--green)' : 'var(--navy)',
            position:'relative',
          }}>
            <ProductIcon id={id} size={22}/>
            <span style={{ fontWeight:800, fontSize:11.5, letterSpacing:0.1 }}>{p.label}</span>
            {on && (
              <span style={{ position:'absolute', top:6, right:6, width:14, height:14, borderRadius:'50%',
                background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="check" size={9} stroke="#fff" sw={2.8}/>
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
  const { set, setUserName, setProfile: saveProfile } = useLang()
  const { applyOnboarding } = useTrigger()

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
    const fullProfile = { ...profile, products }
    saveProfile(fullProfile)
    applyOnboarding(fullProfile)
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
