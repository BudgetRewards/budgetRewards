import { describe, test, expect } from 'vitest';
import {
  applyProfileToCatalogue,
  applyHarvestGate,
  hasElectricity,
  claimedBalance,
  EMPTY_PROFILE,
} from '../catalogueDerive';
import { baseInitialState } from '../initialState';
import type { Profile } from '../types';

const find = (cat: ReturnType<typeof applyProfileToCatalogue>, catName: string, item: string) =>
  cat.find(c => c.cat === catName)!.items.find(i => i.name === item);

describe('applyProfileToCatalogue', () => {
  test('Welcome bonus is always claimed', () => {
    const cat = applyProfileToCatalogue(baseInitialState.catalogue, EMPTY_PROFILE);
    expect(find(cat, 'Contract & Lifecycle', 'Welkomstbonus')?.status).toBe('claimed');
  });

  test('owned products are claimed, the rest are missed', () => {
    const profile: Profile = { ...EMPTY_PROFILE, products: ['electricity', 'tv'] };
    const cat = applyProfileToCatalogue(baseInitialState.catalogue, profile);
    expect(find(cat, 'Multi-product', 'Stroom')?.status).toBe('claimed');
    expect(find(cat, 'Multi-product', 'TV')?.status).toBe('claimed');
    expect(find(cat, 'Multi-product', 'Gas')?.status).toBe('missed');
    expect(find(cat, 'Multi-product', 'Internet')?.status).toBe('missed');
  });

  test('solar panels follow the profile flag and live under Stroom bonussen', () => {
    // Solar panels is a bonus sub-item under Stroom — it requires electricity to be unlocked.
    const withBoth = applyProfileToCatalogue(baseInitialState.catalogue, { ...EMPTY_PROFILE, solarPanels: true, products: ['electricity'] });
    const elecOnly = applyProfileToCatalogue(baseInitialState.catalogue, { ...EMPTY_PROFILE, products: ['electricity'] });
    const noElec   = applyProfileToCatalogue(baseInitialState.catalogue, { ...EMPTY_PROFILE, solarPanels: true });
    expect(find(withBoth, 'Stroom bonussen', 'Zonnepanelen geregistreerd')?.status).toBe('claimed');
    expect(find(elecOnly, 'Stroom bonussen', 'Zonnepanelen geregistreerd')?.status).toBe('available');
    // Without electricity the bonus sub-category is fully locked.
    expect(find(noElec, 'Stroom bonussen', 'Zonnepanelen geregistreerd')?.status).toBe('locked');
  });

  test('5-year loyalty milestone is claimed only with 5+ customer years', () => {
    const newCustomer = applyProfileToCatalogue(baseInitialState.catalogue, { ...EMPTY_PROFILE, customerYears: 3 });
    const loyal       = applyProfileToCatalogue(baseInitialState.catalogue, { ...EMPTY_PROFILE, customerYears: 5 });
    expect(find(newCustomer, 'Contract & Lifecycle', '5 jaar trouw lid')?.status).toBe('locked');
    expect(find(loyal, 'Contract & Lifecycle', '5 jaar trouw lid')?.status).toBe('claimed');
  });
});

describe('applyHarvestGate', () => {
  test('without electricity, available harvest items become missed', () => {
    const cat = applyHarvestGate(applyProfileToCatalogue(baseInitialState.catalogue, EMPTY_PROFILE));
    expect(find(cat, 'Harvest Hours', 'Oogstdag — gratis stroom')?.status).toBe('missed');
  });

  test('with electricity, harvest items stay available', () => {
    const owned = applyProfileToCatalogue(baseInitialState.catalogue, { ...EMPTY_PROFILE, products: ['electricity'] });
    const cat = applyHarvestGate(owned);
    expect(find(cat, 'Harvest Hours', 'Oogstdag — gratis stroom')?.status).toBe('available');
  });

  test('locked harvest items stay locked regardless of electricity', () => {
    const cat = applyHarvestGate(applyProfileToCatalogue(baseInitialState.catalogue, EMPTY_PROFILE));
    expect(find(cat, 'Harvest Hours', 'Volledig oogstseizoen')?.status).toBe('locked');
  });
});

describe('hasElectricity & claimedBalance', () => {
  test('hasElectricity reflects the Stroom claim', () => {
    const owned = applyProfileToCatalogue(baseInitialState.catalogue, { ...EMPTY_PROFILE, products: ['electricity'] });
    const without = applyProfileToCatalogue(baseInitialState.catalogue, EMPTY_PROFILE);
    expect(hasElectricity(owned)).toBe(true);
    expect(hasElectricity(without)).toBe(false);
  });

  test('claimedBalance counts only claimed items (Welcome by default)', () => {
    const cat = applyProfileToCatalogue(baseInitialState.catalogue, EMPTY_PROFILE);
    expect(claimedBalance(cat)).toBe(1150); // Welcome 1000 + App geactiveerd 150 (both claimed by default)
  });

  test('claimedBalance adds owned product seeds', () => {
    const cat = applyProfileToCatalogue(baseInitialState.catalogue, { ...EMPTY_PROFILE, products: ['electricity', 'gas'] });
    expect(claimedBalance(cat)).toBe(2050); // Welcome 1000 + App 150 + Stroom 500 + Gas 400
  });
});
