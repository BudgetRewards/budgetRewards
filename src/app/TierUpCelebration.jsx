import React from 'react'
import './TierUpCelebration.css'
import { useRR, useTrigger } from './store/RRContext.tsx'
import { TIER_MULTIPLIERS } from './store/reducer.ts'
import { useT, useLang, tName } from './i18n.jsx'

/* A single layered-foliage tree: brown trunk + limbs, 10 leaf clusters in 3-4 green tones.
   `animate` drives the grow/pop entrance; pass false for the smaller grove trees. */
function Tree({ scale = 1, animate = true }) {
  const grow = animate ? 'tu-grow' : ''
  const pop = (n) => (animate ? `tu-pop tu-d${n}` : '')
  return (
    <svg className={grow} viewBox="0 0 220 250" width={230 * scale} height={260 * scale}>
      <path d="M104 244 C101 196 99 162 106 128 L116 128 C123 162 121 200 119 244 Z" fill="#6b4a2b"/>
      <path d="M110 162 C92 152 80 138 72 122" stroke="#6b4a2b" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M112 150 C132 142 146 130 156 114" stroke="#6b4a2b" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M110 140 C108 120 112 104 120 90" stroke="#6b4a2b" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <circle className={pop(1)} cx="110" cy="86"  r="50" fill="#2e7d32"/>
      <circle className={pop(2)} cx="62"  cy="108" r="36" fill="#327f36"/>
      <circle className={pop(3)} cx="158" cy="106" r="36" fill="#327f36"/>
      <circle className={pop(4)} cx="84"  cy="74"  r="34" fill="#3a9140"/>
      <circle className={pop(5)} cx="140" cy="72"  r="34" fill="#3a9140"/>
      <circle className={pop(6)} cx="110" cy="52"  r="32" fill="#46a34c"/>
      <circle className={pop(7)} cx="48"  cy="86"  r="26" fill="#52b35a"/>
      <circle className={pop(8)} cx="172" cy="86"  r="26" fill="#52b35a"/>
      <circle className={pop(9)} cx="92"  cy="50"  r="22" fill="#6ac46f"/>
      <circle className={pop(9)} cx="132" cy="50"  r="22" fill="#6ac46f"/>
    </svg>
  )
}

/* Presentational overlay. Props only — no store/i18n hooks, so it is trivially testable. */
export function TierUpCelebrationView({ to, title, subtitle, continueLabel, onDismiss }) {
  return (
    <div className="tu-root" onClick={onDismiss}>
      <div className="tu-stage" onClick={(e) => e.stopPropagation()}>
        <div className="tu-ground"/>
        <div className="tu-shadow"/>
        {to === 'forest' ? (
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
            <div style={{ marginRight:-40 }}><Tree scale={0.62} animate={false}/></div>
            <Tree scale={0.85}/>
            <div style={{ marginLeft:-40 }}><Tree scale={0.56} animate={false}/></div>
          </div>
        ) : (
          <Tree/>
        )}
      </div>
      <div className="tu-copy">
        <p className="tu-title">{title}</p>
        <p className="tu-sub">{subtitle}</p>
      </div>
      <button className="tu-continue" onClick={(e) => { e.stopPropagation(); onDismiss() }}>{continueLabel}</button>
    </div>
  )
}

/* Connected wrapper: reads pendingTierUp, resolves localized copy, dispatches dismiss. */
export function TierUpCelebration() {
  const R = useRR()
  const t = useT()
  const { lang } = useLang()
  const { dismissTierUp } = useTrigger()

  if (!R.pendingTierUp) return null
  const { to } = R.pendingTierUp
  const tier = R.tiers.find(x => x.id === to)
  const tierName = tier ? tName(tier, lang) : to
  const mult = TIER_MULTIPLIERS[to]
  const multStr = mult.toLocaleString(lang === 'en' ? 'en-US' : 'nl-NL')

  return (
    <TierUpCelebrationView
      to={to}
      title={t.tierUp.title(tierName)}
      subtitle={t.tierUp.multiplierNow(multStr)}
      continueLabel={t.tierUp.continue}
      onDismiss={dismissTierUp}
    />
  )
}
