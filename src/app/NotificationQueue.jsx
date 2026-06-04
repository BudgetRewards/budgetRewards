import React from 'react'
import { useLang } from './i18n.jsx'
import { Icon } from './ui.jsx'
import { useTrigger } from './store/RRContext.tsx'

/* ─── event catalogue ────────────────────────────────────────
   Each event maps to an APPLY_TRIGGER payload when claimed.
   base seeds = before multiplier (store applies it).          */
const EVENTS = [
  { id:'hh_dish',
    nl:{ title:'Harvest Hours actief! ⚡', desc:'Vaatwasser verschoven naar het zonne-uur' },
    en:{ title:'Harvest Hours active! ⚡', desc:'Dishwasher shifted to the solar hour' },
    name:'Harvest Hours — vaatwasser', nameEn:'Harvest Hours — dishwasher',
    cat:'Harvest Hours', seeds:20, icon:'bolt', accent:'var(--green)' },

  { id:'hh_wash',
    nl:{ title:'Harvest Hours! ☀️', desc:'Wasmachine draait op zonne-energie' },
    en:{ title:'Harvest Hours! ☀️', desc:'Washing machine running on solar energy' },
    name:'Harvest Hours — wasmachine', nameEn:'Harvest Hours — washing machine',
    cat:'Harvest Hours', seeds:20, icon:'bolt', accent:'var(--green)' },

  { id:'hh_free',
    nl:{ title:'Gratis stroom nu!', desc:'Verbruik de komende 2 uur — stroom is gratis' },
    en:{ title:'Free electricity now!', desc:'Use for the next 2 hours — electricity is free' },
    name:'Harvest Hours — gratis stroom', nameEn:'Harvest Hours — free electricity',
    cat:'Harvest Hours', seeds:10, icon:'sun', accent:'var(--green)' },

  { id:'solar_peak',
    nl:{ title:'Zonnepiek gedetecteerd 🌞', desc:'Maximale opwek — verschuif verbruik nu' },
    en:{ title:'Solar peak detected 🌞', desc:'Maximum generation — shift usage now' },
    name:'Zonnepiek verschuiving', nameEn:'Solar peak shift',
    cat:'Energiegedrag', seeds:15, icon:'sun', accent:'#e07b00' },

  { id:'ev_charge',
    nl:{ title:'EV laadt slim op! 🚗', desc:'Automatisch verschoven naar zonne-uur' },
    en:{ title:'EV charging smart! 🚗', desc:'Automatically shifted to solar hour' },
    name:'Slim EV-opladen', nameEn:'Smart EV charging',
    cat:'Energiegedrag', seeds:25, icon:'bolt', accent:'var(--green)' },

  { id:'thermostat',
    nl:{ title:'Thermostaat geoptimaliseerd 🏠', desc:'Verwarming 2° verlaagd tijdens piekuur' },
    en:{ title:'Thermostat optimised 🏠', desc:'Heating reduced 2° during peak hour' },
    name:'Slimme thermostaat optimalisatie', nameEn:'Smart thermostat optimisation',
    cat:'Energiegedrag', seeds:15, icon:'panel', accent:'var(--navy)' },

  { id:'below_avg',
    nl:{ title:'Verbruik onder gemiddelde 🌱', desc:'18% minder dan vergelijkbare huishoudens' },
    en:{ title:'Below average usage 🌱', desc:'18% less than comparable households' },
    name:'Verbruik onder gemiddelde', nameEn:'Usage below average',
    cat:'Energiegedrag', seeds:30, icon:'leaf', accent:'var(--green)' },

  { id:'record_shift',
    nl:{ title:'Recordverschuiving! 🎉', desc:'Meeste verbruik ooit verschoven op één dag' },
    en:{ title:'Record shift! 🎉', desc:'Most usage ever shifted in a single day' },
    name:'Record energieverschuiving', nameEn:'Record energy shift',
    cat:'Energiegedrag', seeds:50, icon:'earn', accent:'var(--green)' },

  { id:'solar_feedin',
    nl:{ title:'Teruglevering geregistreerd ⚡', desc:'Je levert stroom terug aan het net' },
    en:{ title:'Feed-in registered ⚡', desc:'You are feeding electricity back to the grid' },
    name:'Zonne-energie teruglevering', nameEn:'Solar feed-in',
    cat:'Energiegedrag', seeds:10, icon:'sun', accent:'#e07b00' },

  { id:'weekend_bonus',
    nl:{ title:'Weekend bonus! 🎯', desc:'Extra seeds voor gebruik buiten spits' },
    en:{ title:'Weekend bonus! 🎯', desc:'Extra seeds for off-peak weekend usage' },
    name:'Weekend bonus', nameEn:'Weekend bonus',
    cat:'Harvest Hours', seeds:20, icon:'bolt', accent:'var(--green)' },

  { id:'smart_home',
    nl:{ title:'Smart home actie 📡', desc:'Slimme apparaten bespaarden 40W dit uur' },
    en:{ title:'Smart home action 📡', desc:'Smart devices saved 40W this hour' },
    name:'Smart home besparing', nameEn:'Smart home saving',
    cat:'Energiegedrag', seeds:40, icon:'panel', accent:'var(--navy)' },

  { id:'meter_read',
    nl:{ title:'Meterstand beschikbaar 📊', desc:'Controleer je maandelijkse verbruik' },
    en:{ title:'Meter reading available 📊', desc:'Check your monthly consumption' },
    name:'Maandelijkse meterstand bonus', nameEn:'Monthly meter reading bonus',
    cat:'App & Data', seeds:20, icon:'calendar', accent:'var(--navy)' },

  { id:'contract_bonus',
    nl:{ title:'Contract verlenging! 🏆', desc:'Verleng nu en verdien een grote bonus' },
    en:{ title:'Contract renewal! 🏆', desc:'Renew now and earn a big bonus' },
    name:'Contract verlengd bonus', nameEn:'Contract renewal bonus',
    cat:'Contract & Lifecycle', seeds:400, icon:'tiers', accent:'var(--navy)' },

  { id:'harvest_record',
    nl:{ title:'Oogst record! 🌿', desc:'15 oogstdagen — je bent top 10% klant' },
    en:{ title:'Harvest record! 🌿', desc:'15 harvest days — you are a top 10% customer' },
    name:'Harvest Hours seizoensrecord', nameEn:'Harvest Hours season record',
    cat:'Harvest Hours', seeds:50, icon:'harvest', accent:'var(--green)' },

  { id:'push_notif',
    nl:{ title:'Meldingen aanzetten 🔔', desc:'Ontvang real-time harvest alerts' },
    en:{ title:'Enable notifications 🔔', desc:'Receive real-time harvest alerts' },
    name:'Pushmeldingen ingeschakeld', nameEn:'Push notifications enabled',
    cat:'App & Data', seeds:50, icon:'earn', accent:'var(--green)' },

  { id:'tv_movie',
    nl:{ title:'Film gehuurd via Budget TV 🎬', desc:'Je hebt een film gehuurd — seeds bijgeschreven' },
    en:{ title:'Movie rented via Budget TV 🎬', desc:'You rented a movie — seeds added to your balance' },
    name:'Film gehuurd via Budget TV', nameEn:'Movie rented via Budget TV',
    cat:'Multi-product', seeds:30, icon:'panel', accent:'var(--navy)' },
]

const LIFETIME_MS = 9_000
let uid = 0

export function NotificationQueue() {
  const { lang, userName } = useLang()
  const { claimNotification } = useTrigger()
  const [queue, setQueue] = React.useState([])
  const usedRef = React.useRef(new Set())

  const dismiss = React.useCallback((id) =>
    setQueue(q => q.filter(n => n.id !== id)), [])

  const add = React.useCallback(() => {
    const pool = EVENTS.filter(e => !usedRef.current.has(e.id))
    if (!pool.length) { usedRef.current.clear(); return }
    const event = pool[Math.floor(Math.random() * pool.length)]
    usedRef.current.add(event.id)
    const id = ++uid
    claimNotification(event.name, event.nameEn, event.cat, event.seeds)
    setQueue([{ id, event }])
    setTimeout(() => dismiss(id), LIFETIME_MS)
  }, [dismiss, claimNotification])

  // Only run after onboarding is complete
  React.useEffect(() => {
    if (!userName) return
    const t1 = setTimeout(add, 12_000)
    let next
    function schedule() {
      const delay = 50_000 + Math.random() * 40_000
      next = setTimeout(() => { add(); schedule() }, delay)
    }
    const t2 = setTimeout(schedule, 12_000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(next) }
  }, [userName, add])

  if (!queue.length) return null

  return (
    <div style={{
      position:'absolute', top:60, left:12, right:12, zIndex:50,
      display:'flex', flexDirection:'column', gap:10, pointerEvents:'none',
    }}>
      {queue.map(n => (
        <NotifCard key={n.id} notif={n} lang={lang}
          onDismiss={() => dismiss(n.id)}
        />
      ))}
    </div>
  )
}

function NotifCard({ notif, lang, onDismiss }) {
  const { event } = notif
  const c = lang === 'en' ? event.en : event.nl
  const [progress, setProgress] = React.useState(1)
  const [out, setOut] = React.useState(false)

  React.useEffect(() => {
    const start = Date.now()
    const raf = setInterval(() => {
      setProgress(Math.max(0, 1 - (Date.now() - start) / LIFETIME_MS))
    }, 80)
    return () => clearInterval(raf)
  }, [])

  function handleDismiss() {
    setOut(true)
    setTimeout(onDismiss, 300)
  }

  const isGreen = event.accent === 'var(--green)'

  return (
    <div className={out ? 'rr-notif rr-notif-out' : 'rr-notif rr-notif-in'}
      style={{ pointerEvents:'all' }}>

      {/* coloured accent strip */}
      <div style={{ height:5, background: isGreen ? 'var(--green)' : event.accent }}/>

      {/* main content */}
      <div style={{ padding:'14px 14px 14px' }}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          {/* icon */}
          <span style={{
            width:46, height:46, borderRadius:14, flexShrink:0,
            background: isGreen ? 'rgba(0,166,81,0.12)' : 'rgba(26,26,46,0.07)',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}>
            <Icon name={event.icon} size={24} stroke={event.accent} sw={2}/>
          </span>

          {/* text */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:14.5, color:'var(--navy)', lineHeight:1.2 }}>{c.title}</div>
            <div style={{ fontSize:12.5, color:'var(--navy-60)', marginTop:3, lineHeight:1.4 }}>{c.desc}</div>
            <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:5,
              background: isGreen ? 'rgba(0,166,81,0.12)' : 'rgba(26,26,46,0.07)',
              borderRadius:99, padding:'3px 9px' }}>
              <span style={{ fontWeight:800, fontSize:12.5, color: isGreen ? 'var(--green)' : event.accent }}>
                +{event.seeds} seeds
              </span>
            </div>
          </div>

          {/* dismiss */}
          <button onClick={handleDismiss} style={{
            background:'none', border:'none', cursor:'pointer',
            color:'var(--grey-2)', fontSize:20, lineHeight:1, padding:'0 2px', flexShrink:0,
          }}>×</button>
        </div>
      </div>

      {/* countdown bar */}
      <div style={{ height:4, background:'var(--grey-line)' }}>
        <div style={{
          height:'100%', background: isGreen ? 'var(--green)' : event.accent,
          width:`${progress * 100}%`, transition:'width 0.08s linear',
        }}/>
      </div>
    </div>
  )
}
