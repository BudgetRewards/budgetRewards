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

  test('solar panels grant seeds only on Yes', () => {
    const yes = computeOnboardingRewards({ ...base, solarPanels: true });
    const no = computeOnboardingRewards({ ...base, solarPanels: false });
    expect(yes.total - no.total).toBe(ONBOARDING_REWARDS.solarPanels); // +600
  });

  test('home battery grants seeds only on Yes', () => {
    const yes = computeOnboardingRewards({ ...base, homeBattery: true });
    const no = computeOnboardingRewards({ ...base, homeBattery: false });
    expect(yes.total - no.total).toBe(ONBOARDING_REWARDS.homeBattery); // +400
  });

  test('products reward is per product', () => {
    const r = computeOnboardingRewards({ ...base, products: ['electricity', 'gas', 'tv'] });
    const productEntry = r.entries.find(e => e.name.startsWith('Producten'));
    expect(productEntry?.amount).toBe(ONBOARDING_REWARDS.perProduct * 3); // 750
    expect(productEntry?.nameEn).toBe('Products linked (×3)');
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

  test('full profile sums all categories and assigns sequential ids', () => {
    const r = computeOnboardingRewards({
      solarPanels: true, homeBattery: true, householdSize: 4, customerYears: 5,
      products: ['electricity', 'gas'],
    });
    expect(r.total).toBe(2200);
    expect(r.entries.map(e => e.id)).toEqual([1, 2, 3, 4, 5]);
  });
});
