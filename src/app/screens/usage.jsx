import React from 'react'
import { Icon } from '../ui.jsx'
import { useT, useLang } from '../i18n.jsx'
import { useRR, useTrigger } from '../store/RRContext.tsx'

const pad = n => String(n).padStart(2, '0');

/* ───────────────── Screen 6 · Daily usage simulation ─────────────────
   Mirrored 24-hour bar chart: consumption grows up from the centre axis,
   production grows down. Data is regenerated (randomly) on demand. */

const CONS = '#1A1A2E'; // navy — energy drawn
const PROD = '#00A651'; // green — energy produced

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

function Usage() {
  const t = useT();
  const { lang } = useLang();
  // Read the simulation from app state — switching screens reuses the stored
  // simulations rather than generating new ones.
  const state = useRR();
  const { simulateUsage, selectUsageDate } = useTrigger();
  const date = state.currentUsageDate;
  const record = state.usages[date];
  const usage = record.hours;
  const hasBattery = record.hasHomeBattery;

  // App "today" — the latest day the customer may simulate.
  const hs = state.harvestSeason;
  const today = `${hs.year}-${pad(hs.todayMonth + 1)}-${pad(hs.todayDate)}`;

  const regenerate = (battery = hasBattery) => simulateUsage({ date, hasHomeBattery: battery });
  const toggleBattery = () => regenerate(!hasBattery);
  const onDateChange = e => {
    const next = e.target.value;
    if (!next || next > today) return; // never simulate beyond today
    if (state.usages[next]) selectUsageDate(next);                       // already simulated → reuse
    else simulateUsage({ date: next, hasHomeBattery: hasBattery });      // new day → simulate
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

      {/* Home battery toggle */}
      <button onClick={toggleBattery} className="rr-card" style={{ marginTop: 14, width: '100%', border: 'none',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: '13px 16px',
        display: 'flex', alignItems: 'center', gap: 13 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          background: hasBattery ? 'rgba(0,166,81,0.12)' : 'rgba(26,26,46,0.05)' }}>
          <Icon name="bolt" size={20} stroke={hasBattery ? 'var(--green)' : 'var(--navy-60)'}/>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{t.usage.homeBattery}</div>
          <div className="rr-sub" style={{ fontSize: 12 }}>{t.usage.homeBatteryDesc}</div>
        </div>
        <Toggle on={hasBattery}/>
      </button>

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

      <div className="rr-sub" style={{ fontSize: 11.5, marginTop: 16, textAlign: 'center' }}>
        {t.usage.hint}
      </div>
    </div>
  );
}

/* iOS-style on/off switch (visual only — state is owned by the parent). */
function Toggle({ on }) {
  return (
    <span style={{ width: 42, height: 25, borderRadius: 99, flexShrink: 0, position: 'relative',
      transition: 'background .2s', background: on ? 'var(--green)' : 'rgba(26,26,46,0.18)' }}>
      <span style={{ position: 'absolute', top: 2.5, left: on ? 19.5 : 2.5, width: 20, height: 20,
        borderRadius: '50%', background: '#fff', transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}/>
    </span>
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
