import type { RRState, Dispatch } from '../types';
import { isAlreadyClaimed } from '../guards';

const PRODUCT_CONFIG: Record<string, { catalogueKey: string; base: number }> = {
  Internet:    { catalogueKey: 'Tweede product: Internet',   base: 500 },
  Verzekering: { catalogueKey: 'Derde product: Verzekering', base: 750 },
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
