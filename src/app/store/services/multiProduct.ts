import type { RRState, Dispatch } from '../types';
import { isAlreadyClaimed } from '../guards';

// The utility products, each mapping to its Multi-product catalogue item.
const PRODUCT_CONFIG: Record<string, { catalogueKey: string; base: number }> = {
  Stroom:       { catalogueKey: 'Stroom',     base: 500 },
  Gas:          { catalogueKey: 'Gas',        base: 400 },
  Internet:     { catalogueKey: 'Internet',   base: 500 },
  TV:           { catalogueKey: 'TV',         base: 300 },
  Mobiel:       { catalogueKey: 'Mobiel',     base: 300 },
  'Vaste lijn': { catalogueKey: 'Vaste lijn', base: 200 },
};

export function addProduct(productName: string, state: RRState, dispatch: Dispatch): void {
  const config = PRODUCT_CONFIG[productName];
  if (!config) return;
  if (isAlreadyClaimed(state, config.catalogueKey)) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: {
      name: config.catalogueKey,
      cat: 'Multi-product',
      base: config.base,
      kind: 'pos',
      catalogueKey: config.catalogueKey,
    },
  });
}
