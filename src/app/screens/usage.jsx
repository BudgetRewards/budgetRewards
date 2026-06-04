import React from 'react'
import { Icon } from '../ui.jsx'
import { useT, useLang, useProfile } from '../i18n.jsx'
import { useRR, useTrigger } from '../store/RRContext.tsx'

const pad = n => String(n).padStart(2, '0');

/* ───────────────── Screen 6 · Daily usage simulation ─────────────────
   Mirrored 24-hour bar chart: consumption grows up from the centre axis,
   production grows down. Data is regenerated (randomly) on demand.
   A monthly rollup section below the chart accumulates all simulated days
   and compares them to the CBS household average. */

const CONS = '#1A1A2E';
const PROD = '#00A651';

// CBS Netherlands monthly electricity averages (kWh) by household size
const MONTHLY_AVG_KWH = { 1: 138, 2: 213, 3: 252, 4: 292, 5: 313, 6: 330 };

function monthlyAvgForSize(size) {
  return MONTHLY_AVG_KWH[Math.min(6, Math.max(1, size || 2))] ?? 213;
}

/* Daily consumption the simulator aims for: ~15% below the household average, so
 * an efficient home reliably lands under the benchmark and can claim — at any size.
 * Single source of truth, also used by the auto-simulation on first login. */
export function householdDailyTarget(size) {
  return (monthlyAvgForSize(size) / 30) * 0.85;
}

function kwh(n) { return n.toFixed(1); }

function peakHour(usage, key) {
  return usage.reduce((best, u) => (u[key] > best[key] ? u : best), usage[0]);
}

/* ── Shared stat card ── */
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

/* ── Hourly bar chart. Mirrored (consumption up / production down) when the
   customer has solar; consumption-only otherwise. ── */
function Bars({ usage, showProduction = true }) {
  const max = Math.max(...usage.flatMap(u => showProduction ? [u.consumption, u.production] : [u.consumption]), 0.001);

  // Consumption-only: single upward bar chart, no production half or centre axis.
  if (!showProduction) {
    const H = 140;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: H }}>
        {usage.map(u => (
          <div key={u.hour}
            title={`${String(u.hour).padStart(2, '0')}:00 — ${kwh(u.consumption)} kWh`}
            style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ height: `${(u.consumption / max) * 100}%`, background: CONS, borderRadius: '3px 3px 0 0', opacity: 0.88 }}/>
          </div>
        ))}
      </div>
    );
  }

  const HALF = 70;
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 2, height: HALF * 2 }}>
      {usage.map(u => (
        <div key={u.hour}
          title={`${String(u.hour).padStart(2, '0')}:00 — ${kwh(u.consumption)} / ${kwh(u.production)} kWh`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ height: `${(u.consumption / max) * 100}%`, background: CONS, borderRadius: '3px 3px 0 0', opacity: 0.88 }}/>
          </div>
          <div style={{ height: 1.5, background: 'var(--grey-line)' }}/>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <div style={{ height: `${(u.production / max) * 100}%`, background: PROD, borderRadius: '0 0 3px 3px' }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Month-to-date comparison card ── */
function MonthCompareCard({ monthNet, hasSolar, daysSimulated, monthlyAvg, householdSize, monthLabel, onClaim }) {
  const { lang } = useLang();
  const [claimed, setClaimed] = React.useState(false);
  // The grid draw can't be negative for the comparison (solar surplus is netted to 0).
  const net = Math.max(0, monthNet);
  // Reset when the net changes (regenerate or new day) so the button is available again.
  React.useEffect(() => { setClaimed(false); }, [net]);

  const expectedByNow = (monthlyAvg / 30) * daysSimulated;
  const diff = expectedByNow - net; // positive = below expected (good)
  const isBelow = diff > 0;
  // Reward on the PERCENTAGE under/over the household average, so a 1-person home
  // earns the same as a 5-person home for the same relative saving (fair across sizes).
  const pct = Math.min(0.6, Math.abs(diff) / Math.max(expectedByNow, 0.1)); // cap to keep seeds sane
  const seeds = Math.max(1, Math.round(pct * 300)); // ~30 seeds at 10% below; up to ~180

  // Scale bars so both fit nicely regardless of which is bigger
  const scale = Math.max(net, expectedByNow, 0.1) * 1.3;
  const consPct     = Math.min(100, (net / scale) * 100);
  const expectedPct = Math.min(100, (expectedByNow / scale) * 100);

  const sizeLabel = householdSize >= 6 ? '6+' : String(householdSize);
  const daysLabel = daysSimulated === 1
    ? (lang === 'en' ? '1 day' : '1 dag')
    : (lang === 'en' ? `${daysSimulated} days` : `${daysSimulated} dagen`);
  // With solar the comparison is on net grid draw; without, it's plain consumption.
  const yoursNL = hasSolar ? `Jouw netto afname (${daysLabel})` : `Jouw verbruik (${daysLabel})`;
  const yoursEN = hasSolar ? `Your net draw (${daysLabel})` : `Your usage (${daysLabel})`;

  const NL = {
    title: 'Vergelijk met anderen',
    subtitle: `${sizeLabel}-persoonshuishouden`,
    yours:  yoursNL,
    avg:    `Verwacht (${sizeLabel}-pers., ${daysLabel})`,
    below:  `${kwh(diff)} kWh onder verwacht`,
    above:  `${kwh(-diff)} kWh boven verwacht`,
    claimBtn: `Claim ${seeds} zaden`,
    claimed: 'Geclaimd ✓',
    missedLabel: `${seeds} gemiste zaden`,
  };
  const EN = {
    title: 'Compare with others',
    subtitle: `${sizeLabel}-person household`,
    yours:  yoursEN,
    avg:    `Expected (${sizeLabel}-person, ${daysLabel})`,
    below:  `${kwh(diff)} kWh below expected`,
    above:  `${kwh(-diff)} kWh above expected`,
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
      <div style={{ padding: '13px 16px 10px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid rgba(26,26,46,0.07)' }}>
        <span style={{ fontSize: 20 }}>👥</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{L.title}</div>
          <div style={{ fontSize: 11, color: 'var(--navy-60)', fontWeight: 600, marginBottom: 2 }}>
            {L.subtitle} · {lang === 'en' ? `${monthlyAvg} kWh/month` : `${monthlyAvg} kWh/maand`}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Yours */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: isBelow ? PROD : '#e05c4a' }}>{L.yours}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: isBelow ? PROD : '#e05c4a' }}>{kwh(net)} kWh</span>
          </div>
          <div style={{ height: 9, borderRadius: 5, background: 'rgba(26,26,46,0.07)' }}>
            <div style={{ height: '100%', borderRadius: 5, width: `${consPct}%`,
              background: isBelow ? PROD : '#e05c4a', transition: 'width 0.5s ease' }}/>
          </div>
        </div>

        {/* Expected */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy-60)' }}>{L.avg}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy-60)' }}>{kwh(expectedByNow)} kWh</span>
          </div>
          <div style={{ height: 9, borderRadius: 5, background: 'rgba(26,26,46,0.07)' }}>
            <div style={{ height: '100%', borderRadius: 5, width: `${expectedPct}%`,
              background: 'rgba(26,26,46,0.28)' }}/>
          </div>
        </div>

        {/* Result */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isBelow ? 'rgba(0,166,81,0.08)' : 'rgba(224,92,74,0.07)',
          borderRadius: 10, padding: '10px 13px' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: isBelow ? PROD : '#e05c4a' }}>
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

function UsageInner() {
  const t = useT();
  const { lang } = useLang();
  const state = useRR();
  const { simulateUsage, selectUsageDate, logComparison } = useTrigger();
  const { homeBattery, householdSize, solarPanels } = useProfile();

  const monthlyAvg = monthlyAvgForSize(householdSize);
  const dailyTarget = householdDailyTarget(householdSize);
  const simOpts = { hasHomeBattery: homeBattery, hasSolar: solarPanels, dailyTargetKwh: dailyTarget };

  const date = state.currentUsageDate;
  const record = state.usages[date];
  const usage = record.hours;

  const hs = state.harvestSeason;
  const today = `${hs.year}-${pad(hs.todayMonth + 1)}-${pad(hs.todayDate)}`;

  const regenerate = () => simulateUsage({ date, ...simOpts });

  const onDateChange = e => {
    const next = e.target.value;
    if (!next || next > today) return;
    if (state.usages[next]) selectUsageDate(next);
    else simulateUsage({ date: next, ...simOpts });
  };

  const fmtDate = iso =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-US',
      { weekday: 'short', day: 'numeric', month: 'long' });

  // ── Daily totals ──
  const totalCons = usage.reduce((s, u) => s + u.consumption, 0);
  const totalProd = usage.reduce((s, u) => s + u.production, 0);
  const net       = totalCons - totalProd;
  const pCons     = peakHour(usage, 'consumption');
  const pProd     = peakHour(usage, 'production');

  // ── Month-to-date totals (all simulated days in the current calendar month) ──
  const currentMonth = date.slice(0, 7);
  const monthEntries = Object.entries(state.usages).filter(([d]) => d.startsWith(currentMonth));
  const monthCons    = monthEntries.reduce((s, [, r]) => s + r.hours.reduce((h, u) => h + u.consumption, 0), 0);
  const monthProd    = monthEntries.reduce((s, [, r]) => s + r.hours.reduce((h, u) => h + u.production, 0), 0);
  const monthNet     = monthCons - monthProd;
  const daysSimulated = monthEntries.length;

  const monthLabel = new Date(`${currentMonth}-01`).toLocaleDateString(
    lang === 'nl' ? 'nl-NL' : 'en-US', { month: 'long', year: 'numeric' }
  );
  const sectionLabelDay   = lang === 'en' ? 'Per day'   : 'Per dag';
  const sectionLabelMonth = lang === 'en' ? 'Per month' : 'Per maand';

  return (
    <div className="rr-page rr-stagger">
      <ScreenHeaderWithAction
        eyebrow={fmtDate(date)}
        title={t.usage.title}
        onAction={regenerate}
        actionLabel={t.usage.regenerate}
      />

      {/* ───── Per dag ───── */}
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--navy-60)', textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: 8 }}>
        {sectionLabelDay}
      </div>

      {/* Daily summary — production/net only shown with solar panels */}
      <div style={{ display: 'grid', gridTemplateColumns: solarPanels ? '1fr 1fr 1fr' : '1fr', gap: 9 }}>
        <StatCard label={t.usage.totalConsumption} value={kwh(totalCons)} unit={t.usage.kwh} color={CONS}/>
        {solarPanels && <StatCard label={t.usage.totalProduction} value={kwh(totalProd)} unit={t.usage.kwh} color={PROD}/>}
        {solarPanels && <StatCard label={t.usage.net} value={kwh(net)} unit={t.usage.kwh} color="var(--green-700)"/>}
      </div>

      {/* Date picker */}
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
          {solarPanels && <Legend color={PROD} label={t.usage.production}/>}
        </div>
        <Bars usage={usage} showProduction={solarPanels}/>
        <div style={{ display: 'flex', marginTop: 7 }}>
          {usage.map(u => (
            <div key={u.hour} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--grey-2)' }}>
              {u.hour % 6 === 0 ? String(u.hour).padStart(2, '0') : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Peaks — peak production only shown with solar panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        <PeakRow icon="bolt" color={CONS} label={t.usage.peakConsumption}
          value={`${kwh(pCons.consumption)} ${t.usage.kwh}`} when={t.usage.at(pCons.hour)}/>
        {solarPanels && (
          <PeakRow icon="sun" color={PROD} label={t.usage.peakProduction}
            value={`${kwh(pProd.production)} ${t.usage.kwh}`} when={t.usage.at(pProd.hour)}/>
        )}
      </div>

      {/* ───── Per maand ───── */}
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--navy-60)', textTransform: 'uppercase',
        letterSpacing: '0.08em', marginTop: 28, marginBottom: 8 }}>
        {sectionLabelMonth} — {monthLabel}
      </div>

      {/* Month summary — production/net only shown with solar panels */}
      <div style={{ display: 'grid', gridTemplateColumns: solarPanels ? '1fr 1fr 1fr' : '1fr', gap: 9 }}>
        <StatCard label={t.usage.totalConsumption} value={kwh(monthCons)} unit={t.usage.kwh} color={CONS}/>
        {solarPanels && <StatCard label={t.usage.totalProduction} value={kwh(monthProd)} unit={t.usage.kwh} color={PROD}/>}
        {solarPanels && <StatCard label={t.usage.net} value={kwh(monthNet)} unit={t.usage.kwh} color="var(--green-700)"/>}
      </div>

      {/* Month comparison — compares NET consumption (grid draw) vs the benchmark.
          key resets the claimed state once per calendar month */}
      <MonthCompareCard
        key={currentMonth}
        monthNet={monthNet}
        hasSolar={solarPanels}
        daysSimulated={daysSimulated}
        monthlyAvg={monthlyAvg}
        householdSize={householdSize || 2}
        monthLabel={monthLabel}
        onClaim={(seeds, kind) => logComparison(seeds, kind, monthLabel)}
      />

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

const Usage = React.memo(UsageInner);
export { Usage };
