import { describe, test, expect } from 'vitest';
import { computeOnboardingRewards, ONBOARDING_REWARDS } from '../../services/onboarding';
import type { Profile } from '../../types';

const base: Profile = {
  solarPanels: false,
  homeBattery: false,
  householdSize: 1,
  customerYears: 0,
  products: [],
};

describe('computeOnboardingRewards', () => {
  test('household size always rewards (min 1 person)', () => {
    const { entries, total } = computeOnboardingRewards(base);
    expect(total).toBe(ONBOARDING_REWARDS.perHouseholdMember); // 50 × 1
    expect(entries).toHaveLength(1);
    expect(entries[0].cat).toBe('Onboarding');
    expect(entries[0].mult).toBe(1);
    expect(entries[0].kind).toBe('pos');
  });

  test('home battery grants seeds only on Yes', () => {
    const yes = computeOnboardingRewards({ ...base, homeBattery: true });
    const no = computeOnboardingRewards({ ...base, homeBattery: false });
    expect(yes.total - no.total).toBe(ONBOARDING_REWARDS.homeBattery); // +400
  });

  test('solar panels and products are NOT rewarded here (they are catalogue items)', () => {
    const withExtras = computeOnboardingRewards({ ...base, solarPanels: true, products: ['electricity', 'gas', 'tv'] });
    const plain = computeOnboardingRewards(base);
    expect(withExtras.total).toBe(plain.total); // unchanged — solar/products handled by the catalogue
  });

  test('customer years reward is per year', () => {
    const r = computeOnboardingRewards({ ...base, customerYears: 5 });
    const yearEntry = r.entries.find(e => e.name.startsWith('Klantjaren'));
    expect(yearEntry?.amount).toBe(ONBOARDING_REWARDS.perCustomerYear * 5); // 500
  });

  test('zero-reward categories produce no ledger entry', () => {
    const { entries } = computeOnboardingRewards(base);
    expect(entries.map(e => e.name)).toEqual(['Huishouden (×1)']);
  });

  test('full profile sums the bonus categories and assigns sequential ids', () => {
    const r = computeOnboardingRewards({
      solarPanels: true, homeBattery: true, householdSize: 4, customerYears: 5,
      products: ['electricity', 'gas'],
    });
    // Only battery (400) + years (5×100) + household (4×50) — solar/products are catalogue items.
    expect(r.total).toBe(1100);
    expect(r.entries.map(e => e.id)).toEqual([1, 2, 3]);
  });
});
