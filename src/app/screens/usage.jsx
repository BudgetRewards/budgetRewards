import React from 'react'
import { Icon } from '../ui.jsx'
import { useT, useLang, useProfile } from '../i18n.jsx'
import { useRR, useTrigger } from '../store/RRContext.tsx'

const pad = n => String(n).padStart(2, '0');

/* ───────────────── Screen 6 · Daily usage simulation ─────────────────
   Mirrored 24-hour bar chart: consumption grows up from the centre axis,
   production grows down. Data is regenerated (randomly) on demand. */

const CONS = '#1A1A2E'; // navy — energy drawn
const PROD = '#00A651'; // green — energy produced

// 2-person household average: 213 kWh/month ÷ 30 days ≈ 7.1 kWh/day
const AVG_2P_DAILY_KWH = 7.1;

function kwh(n) {
  return n.toFixed(1);
}

function peakHour(usage, key) {
  return usage.reduce((best, u) => (u[key] > best[key] ? u : best), usage[0]);
}

function StatCard({ label, value, unit, color }) {
  return (
    <div className="rr-card" style={{ padding: '14px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color }}>{value}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy-60)' }}>{unit}</span>
      </div>
      <div className="rr-sub" style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Bars({ usage }) {
  const max = Math.max(...usage.flatMap(u => [u.consumption, u.production]), 0.001);
  const HALF = 70; // px height for each half of the mirror chart

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 2, height: HALF * 2 }}>
      {usage.map(u => (
        <div
          key={u.hour}
          title={`${String(u.hour).padStart(2, '0')}:00 — ${kwh(u.consumption)} / ${kwh(u.production)} kWh`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {/* consumption — grows up toward the centre axis */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{
              height: `${(u.consumption / max) * 100}%`,
              background: CONS, borderRadius: '3px 3px 0 0', opacity: 0.88,
            }}/>
          </div>
          {/* centre axis */}
          <div style={{ height: 1.5, background: 'var(--grey-line)' }}/>
          {/* production — grows down from the centre axis */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <div style={{
              height: `${(u.production / max) * 100}%`,
              background: PROD, borderRadius: '0 0 3px 3px',
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Daily comparison card ── */
function CompareCard({ net, date, onClaim }) {
  const { lang } = useLang();
  const [claimed, setClaimed] = React.useState(false);

  const diff = AVG_2P_DAILY_KWH - Math.max(0, net); // how much BETTER than average (negative = worse)
  const isBelow = diff > 0;
  const seeds = Math.max(1, Math.round(Math.abs(diff) * 8));

  // Bar widths: scale both against 1.5× the average as the 100% mark.
  const scale = AVG_2P_DAILY_KWH * 1.5;
  const netPct  = Math.min(100, (Math.max(0, net) / scale) * 100);
  const avgPct  = Math.min(100, (AVG_2P_DAILY_KWH / scale) * 100);

  const NL = {
    title: 'Vergelijk met anderen',
    subtitle: '2-persoonshuishouden',
    yours: 'Jouw netto verbruik',
    avg: '2-pers. gemiddelde',
    below: `${kwh(diff)} kWh onder gemiddelde`,
    above: `${kwh(-diff)} kWh boven gemiddelde`,
    claimBtn: `Claim ${seeds} zaden`,
    claimed: 'Geclaimd ✓',
    missedLabel: `${seeds} gemiste zaden`,
  };
  const EN = {
    title: 'Compare with others',
    subtitle: '2-person household',
    yours: 'Your net consumption',
    avg: '2-person average',
    below: `${kwh(diff)} kWh below average`,
    above: `${kwh(-diff)} kWh above average`,
    claimBtn: `Claim ${seeds} seeds`,
    claimed: 'Claimed ✓',
    missedLabel: `${seeds} missed seeds`,
  };
  const L = lang === 'en' ? EN : NL;

  const handleClaim = () => {
    if (claimed) return;
    setClaimed(true);
    onClaim(seeds, 'pos');
  };

  return (
    <div className="rr-card" style={{ marginTop: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '13px 16px 2px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid rgba(26,26,46,0.07)' }}>
        <span style={{ fontSize: 20 }}>👥</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{L.title}</div>
          <div style={{ fontSize: 11, color: 'var(--navy-60)', fontWeight: 600, marginBottom: 11 }}>
            {L.subtitle}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Yours */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700,
              color: isBelow ? PROD : '#e05c4a' }}>{L.yours}</span>
            <span style={{ fontSize: 12, fontWeight: 800,
              color: isBelow ? PROD : '#e05c4a' }}>{kwh(Math.max(0, net))} kWh</span>
          </div>
          <div style={{ height: 9, borderRadius: 5, background: 'rgba(26,26,46,0.07)' }}>
            <div style={{ height: '100%', borderRadius: 5, width: `${netPct}%`,
              background: isBelow ? PROD : '#e05c4a', transition: 'width 0.5s ease' }}/>
          </div>
        </div>

        {/* Average */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy-60)' }}>{L.avg}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy-60)' }}>
              {kwh(AVG_2P_DAILY_KWH)} kWh
            </span>
          </div>
          <div style={{ height: 9, borderRadius: 5, background: 'rgba(26,26,46,0.07)' }}>
            <div style={{ height: '100%', borderRadius: 5, width: `${avgPct}%`,
              background: 'rgba(26,26,46,0.28)' }}/>
          </div>
        </div>

        {/* Result row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isBelow ? 'rgba(0,166,81,0.08)' : 'rgba(224,92,74,0.07)',
          borderRadius: 10, padding: '10px 13px' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700,
            color: isBelow ? PROD : '#e05c4a' }}>
            {isBelow ? `✓ ${L.below}` : `↑ ${L.above}`}
          </span>
          {isBelow ? (
            <button onClick={handleClaim} disabled={claimed}
              style={{ border: 'none', cursor: claimed ? 'default' : 'pointer', fontFamily: 'inherit',
                background: claimed ? 'rgba(0,166,81,0.15)' : PROD,
                color: claimed ? PROD : '#fff',
                fontWeight: 700, fontSize: 12, borderRadius: 99, padding: '6px 13px' }}>
              {claimed ? L.claimed : L.claimBtn}
            </button>
          ) : (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#e05c4a',
              background: 'rgba(224,92,74,0.12)', borderRadius: 8, padding: '4px 10px' }}>
              {L.missedLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Usage() {
  const t = useT();
  const { lang } = useLang();
  // Read the simulation from app state — switching screens reuses the stored
  // simulations rather than generating new ones.
  const state = useRR();
  const { simulateUsage, selectUsageDate, logComparison } = useTrigger();
  // Whether the customer has a home battery comes from their onboarding profile.
  const { homeBattery } = useProfile();
  const date = state.currentUsageDate;
  const record = state.usages[date];
  const usage = record.hours;

  // App "today" — the latest day the customer may simulate.
  const hs = state.harvestSeason;
  const today = `${hs.year}-${pad(hs.todayMonth + 1)}-${pad(hs.todayDate)}`;

  const regenerate = () => simulateUsage({ date, hasHomeBattery: homeBattery });
  const onDateChange = e => {
    const next = e.target.value;
    if (!next || next > today) return; // never simulate beyond today
    if (state.usages[next]) selectUsageDate(next);                       // already simulated → reuse
    else simulateUsage({ date: next, hasHomeBattery: homeBattery });     // new day → simulate
  };

  const fmtDate = iso =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-US',
      { weekday: 'short', day: 'numeric', month: 'long' });

  const totalCons = usage.reduce((s, u) => s + u.consumption, 0);
  const totalProd = usage.reduce((s, u) => s + u.production, 0);
  const net = totalCons - totalProd;
  const pCons = peakHour(usage, 'consumption');
  const pProd = peakHour(usage, 'production');

  return (
    <div className="rr-page rr-stagger">
      <ScreenHeaderWithAction
        eyebrow={fmtDate(date)}
        title={t.usage.title}
        onAction={() => regenerate()}
        actionLabel={t.usage.regenerate}
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginTop: 2 }}>
        <StatCard label={t.usage.totalConsumption} value={kwh(totalCons)} unit={t.usage.kwh} color={CONS}/>
        <StatCard label={t.usage.totalProduction} value={kwh(totalProd)} unit={t.usage.kwh} color={PROD}/>
        <StatCard label={t.usage.net} value={kwh(net)} unit={t.usage.kwh} color="var(--green-700)"/>
      </div>

      {/* Date picker — choose which day to simulate, up to today */}
      <div className="rr-card" style={{ marginTop: 14, padding: '13px 16px', display: 'flex',
        alignItems: 'center', gap: 13 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(26,26,46,0.05)', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="calendar" size={20} stroke="var(--navy-60)"/>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{t.usage.dateLabel}</div>
          <div className="rr-sub" style={{ fontSize: 12 }}>{t.usage.dateHint}</div>
        </div>
        <input type="date" value={date} max={today} onChange={onDateChange}
          style={{ border: '1px solid var(--grey-line)', borderRadius: 10, padding: '7px 10px',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', background: '#fff' }}/>
      </div>

      {/* Chart */}
      <div className="rr-card" style={{ padding: '16px 14px 14px', marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
          <Legend color={CONS} label={t.usage.consumption}/>
          <Legend color={PROD} label={t.usage.production}/>
        </div>

        <Bars usage={usage}/>

        {/* hour axis — label every 6 hours */}
        <div style={{ display: 'flex', marginTop: 7 }}>
          {usage.map(u => (
            <div key={u.hour} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600,
              color: 'var(--grey-2)' }}>
              {u.hour % 6 === 0 ? String(u.hour).padStart(2, '0') : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Peaks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        <PeakRow icon="bolt" color={CONS} label={t.usage.peakConsumption}
          value={`${kwh(pCons.consumption)} ${t.usage.kwh}`} when={t.usage.at(pCons.hour)}/>
        <PeakRow icon="sun" color={PROD} label={t.usage.peakProduction}
          value={`${kwh(pProd.production)} ${t.usage.kwh}`} when={t.usage.at(pProd.hour)}/>
      </div>

      {/* Comparison vs 2-person household average — key resets claimed state on date change */}
      <CompareCard key={date} net={net} date={date}
        onClaim={(seeds, kind) => logComparison(seeds, kind, date)}/>

      <div className="rr-sub" style={{ fontSize: 11.5, marginTop: 16, textAlign: 'center' }}>
        {t.usage.hint}
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: color }}/>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--navy-60)' }}>{label}</span>
    </div>
  );
}

function PeakRow({ icon, color, label, value, when }) {
  return (
    <div className="rr-card" style={{ padding: '13px 16px', display: 'flex', gap: 13, alignItems: 'center' }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(26,26,46,0.05)', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} stroke={color}/>
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 13.5 }}>{label}</div>
        <div className="rr-sub" style={{ fontSize: 12 }}>{when}</div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 15, color }}>{value}</div>
    </div>
  );
}

/* Local header variant with a regenerate action on the right. */
function ScreenHeaderWithAction({ eyebrow, title, onAction, actionLabel }) {
  return (
    <div style={{ padding: '6px 2px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        <div className="rr-eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>
        <h1 className="rr-h1">{title}</h1>
      </div>
      <button onClick={onAction} style={{ border: 'none', background: 'rgba(0,166,81,0.12)', cursor: 'pointer',
        fontFamily: 'inherit', color: 'var(--green-700)', fontWeight: 700, fontSize: 12, borderRadius: 99,
        padding: '8px 13px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Icon name="sun" size={15} stroke="var(--green-700)" sw={2.2}/>
        {actionLabel}
      </button>
    </div>
  );
}

export { Usage };
