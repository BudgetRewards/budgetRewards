import React from 'react';
import { baseInitialState } from '../app/store/initialState';
import type { CatalogueItemStatus } from '../app/store/types';

const CONFIG_KEY    = 'rr-config';
const PROFILE_KEY   = 'rr-profile';

// Remote reading can't be turned off once enabled.
const LOCKED_WHEN_ENABLED = 'Remote uitlezing aangezet';

function readHouseholdSize(): number {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return Number(JSON.parse(raw).householdSize) || 2;
  } catch { /* ignore */ }
  return 2;
}

function writeHouseholdSize(n: number) {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const profile = raw ? JSON.parse(raw) : {};
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, householdSize: n }));
  } catch { /* ignore */ }
}

type ItemState = {
  name: string;
  seeds: number;
  cat: string;
  status: CatalogueItemStatus;
};

function loadSaved(): Map<string, CatalogueItemStatus> {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return new Map();
    const { catalogue } = JSON.parse(raw) as {
      catalogue: { name: string; status: CatalogueItemStatus }[];
    };
    if (!Array.isArray(catalogue)) return new Map();
    return new Map(catalogue.map(i => [i.name, i.status]));
  } catch {
    return new Map();
  }
}

function computeBalance(items: ItemState[]): number {
  // Only claimed (earned) items count; missed harvests are informational.
  const raw = items
    .filter(i => i.status === 'claimed')
    .reduce((sum, i) => sum + i.seeds, 0);
  return Math.min(10000, Math.max(0, raw));
}

function tierFromBalance(balance: number) {
  if (balance >= 6000) return { emoji: '🌲', name: 'Bos',  mult: 2,   next: null as number | null };
  if (balance >= 2500) return { emoji: '🌳', name: 'Boom', mult: 1.5, next: 6000 as number | null };
  return                      { emoji: '🌱', name: 'Zaad', mult: 1,   next: 2500 as number | null };
}

function seedLabel(seeds: number): string {
  const n = Math.abs(seeds).toLocaleString('nl-NL');
  return seeds >= 0 ? `+${n}` : `−${n}`;
}

function persist(items: ItemState[]) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    catalogue: items.map(i => ({ name: i.name, status: i.status })),
  }));
}

export function ConfigApp() {
  const saved = loadSaved();

  const [householdSize, setHouseholdSize] = React.useState<number>(readHouseholdSize);

  function updateHouseholdSize(n: number) {
    setHouseholdSize(n);
    writeHouseholdSize(n);
  }

  const [items, setItems] = React.useState<ItemState[]>(() =>
    baseInitialState.catalogue.flatMap(cat =>
      cat.items.map(item => ({
        name: item.name,
        seeds: item.seeds,
        cat: cat.cat,
        status: saved.get(item.name) ?? item.status,
      }))
    )
  );

  const balance = computeBalance(items);
  const tier = tierFromBalance(balance);

  function toggle(name: string) {
    setItems(prev => {
      const next = prev.map(item => {
        if (item.name !== name) return item;
        // Once remote reading is enabled it can't be turned off again.
        if (item.name === LOCKED_WHEN_ENABLED && item.status === 'claimed') return item;
        const newStatus: CatalogueItemStatus =
          item.status === 'claimed' ? 'available' : 'claimed';
        return { ...item, status: newStatus };
      });
      persist(next);
      return next;
    });
  }

  function reset() {
    localStorage.removeItem(CONFIG_KEY);
    setItems(
      baseInitialState.catalogue.flatMap(cat =>
        cat.items.map(item => ({
          name: item.name,
          seeds: item.seeds,
          cat: cat.cat,
          status: item.status,
        }))
      )
    );
  }

  const categories = baseInitialState.catalogue.map(cat => ({
    name: cat.cat,
    items: items.filter(i => i.cat === cat.cat),
  }));

  const headerStyle: React.CSSProperties = {
    position: 'sticky', top: 0, background: '#fff',
    borderBottom: '1px solid #e5e5e5', zIndex: 10,
  };

  const btnBase: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', background: '#f5f5f7' }}>
      <div style={headerStyle}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>🌱 RootedRewards Config</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: '#555' }}>
            {balance.toLocaleString('nl-NL')} seeds &nbsp;·&nbsp; {tier.emoji} {tier.name} ({tier.mult}×)
            {tier.next !== null && ` · ${(tier.next - balance).toLocaleString('nl-NL')} to next`}
          </span>
          <button onClick={reset} style={{ ...btnBase, border: '1px solid #ccc', background: '#fff' }}>
            Reset
          </button>
          <button
            onClick={() => { window.location.href = '/app'; }}
            style={{ ...btnBase, border: 'none', background: '#00a651', color: '#fff', fontWeight: 600 }}
          >
            Open App →
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px' }}>
        {/* Profile section */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#888', margin: '0 0 8px' }}>
            Profiel
          </h3>
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e5e5' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', gap: 12 }}>
              <span style={{ fontSize: 18 }}>👥</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Aantal personen in huishouden</span>
              <select
                value={householdSize}
                onChange={e => updateHouseholdSize(Number(e.target.value))}
                style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px 6px 10px',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  background: '#f9f9f9', color: '#1A1A2E', minWidth: 70 }}
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n === 6 ? '6+' : `${n} ${n === 1 ? 'persoon' : 'personen'}`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {categories.map(cat => (
          <div key={cat.name} style={{ marginBottom: 28 }}>
            <h3 style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
              textTransform: 'uppercase', color: '#888', margin: '0 0 8px',
            }}>
              {cat.name}
            </h3>
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e5e5' }}>
              {cat.items.map((item, idx) => {
                const isOn = item.status === 'claimed';
                const locked = item.name === LOCKED_WHEN_ENABLED && isOn;
                const seedColor = item.seeds < 0 ? '#e2463f' : '#00a651';
                return (
                  <div key={item.name} style={{
                    display: 'flex', alignItems: 'center', padding: '11px 16px',
                    borderTop: idx > 0 ? '1px solid #f0f0f0' : 'none',
                  }}>
                    <span style={{ flex: 1, fontSize: 14 }}>{item.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: seedColor, minWidth: 72, textAlign: 'right', marginRight: 20 }}>
                      {seedLabel(item.seeds)}
                    </span>
                    <button
                      aria-label={isOn ? 'Aan' : 'Uit'}
                      onClick={() => toggle(item.name)}
                      disabled={locked}
                      title={locked ? 'Remote reading can’t be turned off once enabled' : undefined}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none',
                        cursor: locked ? 'not-allowed' : 'pointer', background: isOn ? '#00a651' : '#ddd',
                        position: 'relative', transition: 'background 0.15s', flexShrink: 0,
                        opacity: locked ? 0.55 : 1,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 2,
                        left: isOn ? 22 : 2, width: 20, height: 20,
                        borderRadius: 10, background: '#fff',
                        transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                      }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
