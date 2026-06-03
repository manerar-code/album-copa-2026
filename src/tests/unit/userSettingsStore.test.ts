import { displayType } from '@shared/store/userSettingsStore';

describe('displayType', () => {
  it('returns "Brilhante" for "Foil Player"', () => {
    expect(displayType('Foil Player')).toBe('Brilhante');
  });

  it('passes through "Silver" unchanged', () => {
    expect(displayType('Silver')).toBe('Silver');
  });

  it('passes through "Player" unchanged', () => {
    expect(displayType('Player')).toBe('Player');
  });

  it('returns empty string for empty input without throwing', () => {
    expect(displayType('')).toBe('');
  });
});
