import type { LedgerEntry, Profile } from '../types';
import { formatDate } from '../format';

// Solar panels and product ownership are now catalogue items (claimed/missed),
// so they are NOT rewarded here — only the non-catalogue situational bonuses are.
export const ONBOARDING_REWARDS = {
  homeBattery: 400,        // granted only on Yes
  perCustomerYear: 100,    // × customerYears
  perHouseholdMember: 50,  // × householdSize
};

const CAT = 'Onboarding';

type Spec = { seeds: number; name: string; nameEn: string };

export function computeOnboardingRewards(
  profile: Profile,
): { entries: LedgerEntry[]; total: number } {
  const date = formatDate();
  const specs: Spec[] = [];

  if (profile.homeBattery) {
    specs.push({ seeds: ONBOARDING_REWARDS.homeBattery, name: 'Thuisbatterij geregistreerd', nameEn: 'Home battery registered' });
  }
  if (profile.customerYears > 0) {
    specs.push({ seeds: ONBOARDING_REWARDS.perCustomerYear * profile.customerYears, name: `Klantjaren (×${profile.customerYears})`, nameEn: `Customer years (×${profile.customerYears})` });
  }
  if (profile.householdSize > 0) {
    specs.push({ seeds: ONBOARDING_REWARDS.perHouseholdMember * profile.householdSize, name: `Huishouden (×${profile.householdSize})`, nameEn: `Household (×${profile.householdSize})` });
  }

  const entries: LedgerEntry[] = specs.map((s, i) => ({
    id: i + 1,
    name: s.name,
    nameEn: s.nameEn,
    cat: CAT,
    date,
    base: s.seeds,
    mult: 1,
    amount: s.seeds,
    kind: 'pos',
  }));

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  return { entries, total };
}
