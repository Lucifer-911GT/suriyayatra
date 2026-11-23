import { describe, expect, it } from 'vitest';
import { retrogrades, isRetrograde, toJdn, type RetrogradeBody } from '../src/index.js';
import { RETROGRADES } from './retrograde-data.js';

const ymd = (s: string) => {
  const [be, month, day] = s.split('-').map(Number);
  return { year: be - 543, month, day };
};

describe('retrograde periods match the published suriyayatra ephemeris', () => {
  it.each(RETROGRADES.map((r) => [`${r[0]} ${r[1]}`, r]))('%s', (_, [body, start, end, days]) => {
    const found = retrogrades(body as RetrogradeBody, ymd(start), ymd(end));
    expect(found).toContainEqual({ body, start: ymd(start), end: ymd(end), days });
  });

  it('finds no other periods in 2566–2572', () => {
    const from = ymd('2566-3-1');
    const to = ymd('2572-8-31');
    const found = retrogrades(['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus'], from, to);
    const listed = new Set(RETROGRADES.map((r) => `${r[0]} ${toJdn(ymd(r[1]))}`));
    expect(found.filter((p) => !listed.has(`${p.body} ${toJdn(p.start)}`))).toEqual([]);
  });
});

describe('isRetrograde', () => {
  it('Venus is retrograde 13 Oct – 24 Nov 2569, not the day before or after', () => {
    expect(isRetrograde('venus', ymd('2569-10-12'))).toBe(false);
    expect(isRetrograde('venus', ymd('2569-10-13'))).toBe(true);
    expect(isRetrograde('venus', ymd('2569-11-24'))).toBe(true);
    expect(isRetrograde('venus', ymd('2569-11-25'))).toBe(false);
  });
  it('a period straddling the range is returned whole', () => {
    const [p] = retrogrades('mars', ymd('2570-2-1'), ymd('2570-2-2'));
    expect([p.start, p.end]).toEqual([ymd('2569-12-31'), ymd('2570-4-16')]);
  });
});
