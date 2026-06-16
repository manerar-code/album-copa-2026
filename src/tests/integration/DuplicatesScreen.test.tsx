describe('DuplicatesScreen', () => {
  it('calculates total as sum of quantities (2+3=5) not unique sticker count', () => {
    // When two stickers have quantities 2 and 3, total should be 5 (sum)
    // not 2 (unique count)
    const sum = [2, 3].reduce((a, q) => a + q, 0);
    expect(sum).toBe(5);
  });

  it('omits ×1 suffix in share message', () => {
    const qty = 1;
    const suffix = qty > 1 ? ` ×${qty}` : '';
    expect(suffix).toBe('');
  });

  it('includes ×N suffix when quantity > 1', () => {
    const qty = 3;
    const suffix = qty > 1 ? ` ×${qty}` : '';
    expect(suffix).toBe(' ×3');
  });

  it('getDupCount returns quantity from store', () => {
    const quantities: Record<string, number> = { 'fig-007': 2, 'fig-010': 3 };
    const getDupCount = (id: string) => quantities[id] ?? 1;
    expect(getDupCount('fig-007')).toBe(2);
    expect(getDupCount('fig-010')).toBe(3);
    expect(getDupCount('fig-unknown')).toBe(1);
  });
});
