import type { RRState } from './types';

export function isAlreadyClaimed(state: RRState, catalogueKey: string): boolean {
  return state.catalogue.some(cat =>
    cat.items.some(item => item.name === catalogueKey && item.status === 'claimed')
  );
}
