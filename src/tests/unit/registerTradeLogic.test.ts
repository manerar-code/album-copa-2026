import type { UserCollection } from '@shared/types';

function applyRegisterTrade(
  collection: UserCollection,
  quantities: Record<string, number>,
  sent: string[],
  received: string[],
): { collection: UserCollection; quantities: Record<string, number> } {
  const newCollection: UserCollection = { ...collection };
  const newQuantities: Record<string, number> = { ...quantities };

  for (const figurinhaId of sent) {
    if ((newCollection[figurinhaId] ?? 'missing') !== 'duplicate') continue;
    const qty = newQuantities[figurinhaId] ?? 1;
    if (qty >= 2) {
      newQuantities[figurinhaId] = qty - 1;
    } else {
      newCollection[figurinhaId] = 'owned';
      delete newQuantities[figurinhaId];
    }
  }

  for (const figurinhaId of received) {
    if ((newCollection[figurinhaId] ?? 'missing') === 'owned') continue;
    newCollection[figurinhaId] = 'owned';
    delete newQuantities[figurinhaId];
  }

  return { collection: newCollection, quantities: newQuantities };
}

describe('registerTrade logic', () => {
  describe('sent stickers', () => {
    it('decrements qty from 3 to 2, status stays duplicate', () => {
      const { collection, quantities } = applyRegisterTrade(
        { 'fig-a': 'duplicate' },
        { 'fig-a': 3 },
        ['fig-a'],
        [],
      );
      expect(collection['fig-a']).toBe('duplicate');
      expect(quantities['fig-a']).toBe(2);
    });

    it('decrements qty from 2 to 1, status stays duplicate', () => {
      const { collection, quantities } = applyRegisterTrade(
        { 'fig-a': 'duplicate' },
        { 'fig-a': 2 },
        ['fig-a'],
        [],
      );
      expect(collection['fig-a']).toBe('duplicate');
      expect(quantities['fig-a']).toBe(1);
    });

    it('promotes to owned when qty is 1 (default) and removes qty entry', () => {
      const { collection, quantities } = applyRegisterTrade(
        { 'fig-a': 'duplicate' },
        {},
        ['fig-a'],
        [],
      );
      expect(collection['fig-a']).toBe('owned');
      expect(quantities['fig-a']).toBeUndefined();
    });

    it('skips sticker with status owned — no change', () => {
      const { collection } = applyRegisterTrade({ 'fig-a': 'owned' }, {}, ['fig-a'], []);
      expect(collection['fig-a']).toBe('owned');
    });

    it('skips sticker with status missing — no change', () => {
      const { collection } = applyRegisterTrade({ 'fig-a': 'missing' }, {}, ['fig-a'], []);
      expect(collection['fig-a']).toBe('missing');
    });

    it('skips sticker absent from collection (defaults to missing) — no change', () => {
      const { collection } = applyRegisterTrade({}, {}, ['fig-unknown'], []);
      expect(collection['fig-unknown']).toBeUndefined();
    });
  });

  describe('received stickers', () => {
    it('sets missing sticker to owned', () => {
      const { collection } = applyRegisterTrade({ 'fig-b': 'missing' }, {}, [], ['fig-b']);
      expect(collection['fig-b']).toBe('owned');
    });

    it('sets duplicate sticker to owned and removes qty entry', () => {
      const { collection, quantities } = applyRegisterTrade(
        { 'fig-b': 'duplicate' },
        { 'fig-b': 2 },
        [],
        ['fig-b'],
      );
      expect(collection['fig-b']).toBe('owned');
      expect(quantities['fig-b']).toBeUndefined();
    });

    it('is idempotent for already owned sticker', () => {
      const { collection } = applyRegisterTrade({ 'fig-b': 'owned' }, {}, [], ['fig-b']);
      expect(collection['fig-b']).toBe('owned');
    });

    it('sets absent sticker (defaults to missing) to owned', () => {
      const { collection } = applyRegisterTrade({}, {}, [], ['fig-new']);
      expect(collection['fig-new']).toBe('owned');
    });
  });

  describe('edge cases', () => {
    it('both sent and received empty — no mutations', () => {
      const input: UserCollection = { 'fig-a': 'duplicate' };
      const { collection } = applyRegisterTrade(input, {}, [], []);
      expect(collection).toEqual(input);
    });

    it('processes multiple sent and received in one call', () => {
      const { collection, quantities } = applyRegisterTrade(
        { 'fig-a': 'duplicate', 'fig-b': 'missing' },
        { 'fig-a': 3 },
        ['fig-a'],
        ['fig-b'],
      );
      expect(quantities['fig-a']).toBe(2);
      expect(collection['fig-b']).toBe('owned');
    });
  });
});
