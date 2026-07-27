import { describe, expect, it } from 'vitest';
import { getWeekEnd, getWeekStart, toDateString } from './weeks';

describe('getWeekStart', () => {
  it('returns the same Monday for every day in that week', () => {
    // Mon 2026-07-27 .. Sun 2026-08-02
    const monday = toDateString(getWeekStart('2026-07-27'));
    expect(toDateString(getWeekStart('2026-07-27'))).toBe(monday);
    expect(toDateString(getWeekStart('2026-07-29'))).toBe(monday);
    expect(toDateString(getWeekStart('2026-08-02'))).toBe(monday); // Sunday
  });

  it('rolls a Sunday date back to its own week (not forward into the next)', () => {
    expect(toDateString(getWeekStart('2026-08-02'))).toBe('2026-07-27');
  });

  it('the Monday after resets to a new week start', () => {
    expect(toDateString(getWeekStart('2026-08-03'))).toBe('2026-08-03');
  });
});

describe('getWeekEnd', () => {
  it('returns the Sunday six days after the given Monday', () => {
    const monday = getWeekStart('2026-07-27');
    expect(toDateString(getWeekEnd(monday))).toBe('2026-08-02');
  });
});
