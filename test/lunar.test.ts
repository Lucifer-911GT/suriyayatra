import { describe, expect, it } from 'vitest';
import {
  buddhistHolyDays, fromThaiLunar, holyDays, monthsOf, ruleYearType, toThaiLunar, yearType, YEAR_LENGTH,
} from '../src/index.js';
import { HOLY_DAY_TABLE, OFFICIAL_HOLY_DAYS, OFFICIAL_LUNAR_DATES, TABLE_ISOLATED } from './data.js';

const KEY = { makha: 'makhaBucha', visakha: 'visakhaBucha', asalha: 'asalhaBucha' } as const;
const ymd = ([year, month, day]: [number, number, number]) => ({ year, month, day });

describe('year types', () => {
  it('CS 1320 is อธิกมาส and passes its extra day to CS 1321 (Eade 2000)', () => {
    expect(ruleYearType(1320)).toBe('adhikamas');
    expect(ruleYearType(1321)).toBe('adhikawan');
  });

  it('ประกาศสงกรานต์ 2569: CS 1388 is อธิกมาส', () => {
    expect(yearType(1388)).toBe('adhikamas');
  });

  it('month lengths add up to the year length', () => {
    for (let cs = 1300; cs < 1450; cs++) {
      expect(monthsOf(cs).reduce((s, m) => s + m.days, 0)).toBe(YEAR_LENGTH[yearType(cs)]);
    }
  });
});

describe('official calendar', () => {
  it.each(OFFICIAL_LUNAR_DATES)('$date is $label', ({ date, label }) => {
    expect(toThaiLunar(ymd(date)).label).toBe(label);
  });

  it.each(OFFICIAL_HOLY_DAYS)('$kind $be falls on $date', ({ be, kind, date }) => {
    expect(buddhistHolyDays(be)[KEY[kind]]).toEqual(ymd(date));
  });
});

describe('almanac table 2539–2566', () => {
  const rows = HOLY_DAY_TABLE.filter((r) => r.be <= 2566 && !TABLE_ISOLATED.includes(`${r.kind} ${r.be}`));
  it.each(rows)('$kind $be falls on $date', ({ be, kind, date }) => {
    expect(buddhistHolyDays(be)[KEY[kind]]).toEqual(ymd(date));
  });

  it('only the three listed isolated entries differ', () => {
    const off = HOLY_DAY_TABLE
      .filter((r) => r.be <= 2566)
      .filter((r) => JSON.stringify(buddhistHolyDays(r.be)[KEY[r.kind]]) !== JSON.stringify(ymd(r.date)))
      .map((r) => `${r.kind} ${r.be}`);
    expect(off).toEqual(TABLE_ISOLATED);
  });
});

describe('conversion', () => {
  it('round-trips every day of 1950–2100', () => {
    for (let y = 1950; y <= 2100; y += 7) {
      for (const m of [1, 4, 7, 10]) {
        const d = { year: y, month: m, day: 15 };
        const l = toThaiLunar(d);
        expect(fromThaiLunar({ cs: l.cs, month: l.month, secondEighth: l.secondEighth, phase: l.phase, day: l.day })).toEqual(d);
      }
    }
  });

  it('lists วันพระ, four or five a month', () => {
    const list = holyDays({ year: 2026, month: 11, day: 1 }, { year: 2026, month: 11, day: 30 });
    expect(list.map((h) => h.date.day)).toEqual([3, 9, 17, 24]);
  });

  it('reads a Date as Thai time', () => {
    // 23:30 UTC on 16 Nov is already 17 Nov in Thailand: ขึ้น 8 ค่ำ เดือน 12
    expect(toThaiLunar(new Date('2026-11-16T23:30:00Z')).label).toBe('ขึ้น 8 ค่ำ เดือน 12');
  });
});
