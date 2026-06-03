import type { UsageRecord, CatalogueCategory } from '../types';
import { isGreenHoursEarned } from './greenHours';

/** Catalogue item whose seed value (set in the config) defines the weekend reward. */
export const WEEKEND_REWARD_KEY = 'Oogstdag — verschuiving';

/** The configured seed value awarded for a fully-earned weekend (read from the catalogue/config). */
export function weekendRewardSeeds(catalogue: CatalogueCategory[]): number {
  for (const cat of catalogue) {
    const item = cat.items.find(i => i.name === WEEKEND_REWARD_KEY);
    if (item) return item.seeds;
  }
  return 0;
}

/* Weekend harvest: a weekend earns seeds only when BOTH its Saturday and
   Sunday earned green hours (consumption > production, 12:00–17:00). */

const MONTHS_NL = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export type Weekend = { id: string; sat: string; sun: string };

/** The Sat+Sun weekend a yyyy-mm-dd date belongs to, or null for weekdays. */
export function weekendFor(date: string): Weekend | null {
  const d = new Date(`${date}T00:00:00`);
  const dow = d.getDay(); // 0 = Sunday … 6 = Saturday
  if (dow !== 6 && dow !== 0) return null;
  const sat = dow === 6 ? d : addDays(d, -1);
  const sun = dow === 0 ? d : addDays(d, 1);
  return { id: iso(sat), sat: iso(sat), sun: iso(sun) };
}

/** True only when both weekend days have usage data and both earned green hours. */
export function isWeekendEarned(weekend: Weekend, usages: Record<string, UsageRecord>): boolean {
  const sat = usages[weekend.sat];
  const sun = usages[weekend.sun];
  return !!sat && !!sun && isGreenHoursEarned(sat.hours) && isGreenHoursEarned(sun.hours);
}

/** Human label for the weekend, e.g. "7–8 juni" / "7–8 June". */
export function weekendLabels(weekend: Weekend): { nl: string; en: string } {
  const sat = new Date(`${weekend.sat}T00:00:00`);
  const sun = new Date(`${weekend.sun}T00:00:00`);
  const sd = sat.getDate();
  const su = sun.getDate();
  if (sat.getMonth() === sun.getMonth()) {
    return {
      nl: `${sd}–${su} ${MONTHS_NL[sat.getMonth()]}`,
      en: `${sd}–${su} ${MONTHS_EN[sat.getMonth()]}`,
    };
  }
  return {
    nl: `${sd} ${MONTHS_NL[sat.getMonth()]} – ${su} ${MONTHS_NL[sun.getMonth()]}`,
    en: `${sd} ${MONTHS_EN[sat.getMonth()]} – ${su} ${MONTHS_EN[sun.getMonth()]}`,
  };
}
